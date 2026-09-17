import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventionRequestSchema } from "@/lib/validations";
import { generateInterventionNumber } from "@/lib/documents/numbering";
import { sendInterventionNotification } from "@/lib/services/email";
import { notifyNewInterventionToStaff } from "@/lib/services/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { InterventionType, InterventionStatut, PieceJointeType, ClientType, ContractStatus } from "@prisma/client";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

export async function POST(request: Request) {
  try {
    // 0. Limitation de débit anti-flood (5 requêtes / minute par IP)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`intervention_${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de requêtes. Veuillez patienter une minute avant de soumettre une nouvelle demande." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = interventionRequestSchema.parse(body);

    // 1. Rechercher le client par téléphone (normalisé) ou par email
    let client = await db.client.findUnique({
      where: {
        telephone: validatedData.telephone,
      },
      include: {
        contrats: {
          where: {
            statut: ContractStatus.ACTIF,
          },
        },
      },
    });

    // Si non trouvé par téléphone et qu'un email est renseigné, chercher par email
    if (!client && validatedData.email) {
      client = await db.client.findUnique({
        where: {
          email: validatedData.email,
        },
        include: {
          contrats: {
            where: {
              statut: ContractStatus.ACTIF,
            },
          },
        },
      });
    }

    if (!client) {
      client = await db.client.create({
        data: {
          type: ClientType.PARTICULIER,
          nom: validatedData.nom.trim(),
          telephone: validatedData.telephone,
          email: validatedData.email || null,
          adresse: validatedData.adresse ? validatedData.adresse.trim() : null,
        },
        include: {
          contrats: true,
        },
      });
    } else if (!client.email && validatedData.email) {
      // Enrichir l'email du client existant si absent
      try {
        client = await db.client.update({
          where: { id: client.id },
          data: { email: validatedData.email },
          include: {
            contrats: {
              where: {
                statut: ContractStatus.ACTIF,
              },
            },
          },
        });
      } catch {
        // En cas de conflit d'email concurrent, ne pas interrompre la création du ticket
      }
    }

    // 2. Déterminer le parcours (PONCTUEL ou CONTRACTUEL selon contrat actif)
    const activeContract = client.contrats && client.contrats.length > 0 ? client.contrats[0] : null;
    const interventionType = activeContract ? InterventionType.CONTRACTUEL : InterventionType.PONCTUEL;

    // 3. Générer le numéro unique lisible INT-2026-XXXX
    const numero = await generateInterventionNumber();

    // 4. Créer l'intervention dans la base
    const intervention = await db.intervention.create({
      data: {
        numero,
        clientId: client.id,
        contractId: activeContract ? activeContract.id : null,
        type: interventionType,
        typeMateriel: validatedData.typeMateriel,
        panneDeclaree: validatedData.panneDeclaree.trim(),
        modeIntervention: validatedData.modeIntervention,
        statut: InterventionStatut.NOUVEAU,
        montantDiagnostic: interventionType === InterventionType.PONCTUEL ? 1000 : null,
        piecesJointes: validatedData.photoUrl
          ? {
              create: [
                {
                  url: validatedData.photoUrl,
                  type: PieceJointeType.PHOTO_DEPOT,
                },
              ],
            }
          : undefined,
        historique: {
          create: [
            {
              action: `Demande soumise en ligne (${interventionType === InterventionType.CONTRACTUEL ? "Contrat actif détecté" : "Parcours ponctuel"})`,
              note: `Mode souhaité : ${validatedData.modeIntervention}`,
            },
          ],
        },
      },
    });

    // 5. Envoi des notifications (In-App + Push + Email aux comptes ADMIN/RECEPTION et email au client)
    notifyNewInterventionToStaff({
      numero: intervention.numero,
      typeMateriel: intervention.typeMateriel,
      panneDeclaree: intervention.panneDeclaree,
      clientNom: client.nom,
      clientTelephone: client.telephone,
    }).catch((err) => console.error("Staff notification background error:", err));

    sendInterventionNotification({
      numeroTicket: intervention.numero,
      clientNom: client.nom,
      clientEmail: client.email,
      clientTelephone: client.telephone,
      typeMateriel: intervention.typeMateriel,
      panneDeclaree: intervention.panneDeclaree,
    }).catch((err) => console.error("Client email notification background error:", err));

    broadcastCrmEvent("ticket:created", intervention.id);

    return NextResponse.json(
      {
        success: true,
        numero: intervention.numero,
        type: intervention.type,
        message: "Votre demande a été enregistrée avec succès.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur création demande intervention:", error);
    if (error.name === "ZodError") {
      const firstMsg = error.errors?.[0]?.message || "Données du formulaire invalides";
      return NextResponse.json({ success: false, message: firstMsg, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de l'enregistrement de votre demande." },
      { status: 500 }
    );
  }
}
