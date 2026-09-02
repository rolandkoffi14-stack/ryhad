import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventionRequestSchema } from "@/lib/validations";
import { generateInterventionNumber } from "@/lib/documents/numbering";
import { sendInterventionNotification } from "@/lib/services/email";
import { InterventionType, InterventionStatut, PieceJointeType, ClientType, ContractStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = interventionRequestSchema.parse(body);

    // 1. Rechercher ou créer le client par téléphone
    let client = await db.client.findFirst({
      where: {
        telephone: validatedData.telephone.trim(),
      },
      include: {
        contrats: {
          where: {
            statut: ContractStatus.ACTIF,
          },
        },
      },
    });

    if (!client) {
      client = await db.client.create({
        data: {
          type: ClientType.PARTICULIER,
          nom: validatedData.nom.trim(),
          telephone: validatedData.telephone.trim(),
          email: validatedData.email ? validatedData.email.trim() : null,
          adresse: validatedData.adresse ? validatedData.adresse.trim() : null,
        },
        include: {
          contrats: true,
        },
      });
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

    // 5. Envoi des notifications emails (Atelier & Client)
    sendInterventionNotification({
      numeroTicket: intervention.numero,
      clientNom: client.nom,
      clientEmail: client.email,
      clientTelephone: client.telephone,
      typeMateriel: intervention.typeMateriel,
      panneDeclaree: intervention.panneDeclaree,
    }).catch((err) => console.error("Email notification background error:", err));

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
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de l'enregistrement de votre demande." },
      { status: 500 }
    );
  }
}
