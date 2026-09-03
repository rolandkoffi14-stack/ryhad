import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPublicStatusInfo } from "@/lib/interventions/statut-transitions";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { InterventionStatut, DocumentType, FactureType, StatutPaiement } from "@prisma/client";

function maskClientName(name: string): string {
  if (!name) return "Client";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].length > 2 ? `${parts[0].slice(0, 2)}***` : `${parts[0]}***`;
  }
  return parts
    .map((part, index) => {
      if (index === 0) return part;
      return `${part.charAt(0)}.`;
    })
    .join(" ");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`suivi_get_${ip}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de requêtes. Veuillez patienter un instant." },
        { status: 429 }
      );
    }

    const { numero } = await params;
    const url = new URL(request.url);
    const phoneInput = url.searchParams.get("phone") || url.searchParams.get("phoneSuffix") || "";

    if (!numero) {
      return NextResponse.json({ success: false, message: "Numéro de ticket requis" }, { status: 400 });
    }

    const intervention = await db.intervention.findUnique({
      where: { numero: numero.toUpperCase().trim() },
      include: {
        client: {
          select: {
            nom: true,
            telephone: true,
          },
        },
        piecesUtilisees: true,
        documents: {
          orderBy: { dateEmission: "desc" },
        },
      },
    });

    if (!intervention) {
      return NextResponse.json(
        { success: false, message: `Aucun dossier trouvé pour la référence "${numero}".` },
        { status: 404 }
      );
    }

    const repDoc = intervention.documents.find(
      (d) => d.type === DocumentType.FACTURE && d.typeFacture === FactureType.REPARATION
    );
    const isRepPaid = !repDoc || repDoc.statutPaiement === StatutPaiement.PAYE;

    const statusInfo = getPublicStatusInfo(intervention.statut, { isPaid: isRepPaid });

    // Vérification du contrôle propriétaire par les 4 derniers chiffres du téléphone
    const cleanClientPhone = (intervention.client.telephone || "").replace(/\D/g, "");
    const cleanInputPhone = phoneInput.replace(/\D/g, "");
    const isUnlocked =
      cleanInputPhone.length >= 4 &&
      cleanClientPhone.length >= 4 &&
      cleanClientPhone.endsWith(cleanInputPhone.slice(-4));

    // Trouver le devis actif si existant
    const devisDoc = intervention.documents.find((d) => d.type === DocumentType.DEVIS);

    return NextResponse.json({
      success: true,
      ticket: {
        id: intervention.id,
        numero: intervention.numero,
        type: intervention.type,
        typeMateriel: intervention.typeMateriel,
        isUnlocked,
        // Données protégées uniquement disponibles après confirmation du téléphone
        panneDeclaree: isUnlocked ? intervention.panneDeclaree : "Description protégée (saisissez votre téléphone)",
        modeIntervention: intervention.modeIntervention,
        clientNom: maskClientName(intervention.client.nom),
        dateCreation: intervention.dateCreation,
        dateCloture: intervention.dateCloture,
        statut: intervention.statut,
        statusInfo,
        devis: isUnlocked && devisDoc
          ? {
              numero: devisDoc.numero,
              montant: devisDoc.montant,
              statutPaiement: devisDoc.statutPaiement,
            }
          : null,
        pieces: isUnlocked
          ? intervention.piecesUtilisees.map((p) => ({
              designation: p.designation,
              quantite: p.quantite,
              prixUnitaire: p.prixUnitaire,
            }))
          : [],
      },
    });
  } catch (error) {
    console.error("Erreur consultation suivi public:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la recherche du dossier." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`suivi_post_${ip}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de requêtes. Veuillez patienter une minute." },
        { status: 429 }
      );
    }

    const { numero } = await params;
    const body = await request.json();
    const { action, phoneSuffix, phone } = body;

    const phoneInput = (phoneSuffix || phone || "").replace(/\D/g, "");

    const intervention = await db.intervention.findUnique({
      where: { numero: numero.toUpperCase().trim() },
      include: {
        client: true,
        documents: true,
      },
    });

    if (!intervention) {
      return NextResponse.json({ success: false, message: "Dossier introuvable." }, { status: 404 });
    }

    // Contrôle d'autorisation propriétaire avant d'accepter/refuser le devis
    const cleanClientPhone = (intervention.client.telephone || "").replace(/\D/g, "");
    const isOwner =
      phoneInput.length >= 4 &&
      cleanClientPhone.length >= 4 &&
      cleanClientPhone.endsWith(phoneInput.slice(-4));

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "Vérification requise : veuillez fournir les 4 derniers chiffres de votre numéro de téléphone pour valider cette décision.",
        },
        { status: 403 }
      );
    }

    if (intervention.statut !== InterventionStatut.DEVIS_ENVOYE) {
      return NextResponse.json(
        { success: false, message: "Cette action n'est disponible que lorsque le devis est en attente de votre accord." },
        { status: 400 }
      );
    }

    if (action === "accept_devis") {
      // Marquer le devis comme accepté
      await db.financialDocument.updateMany({
        where: {
          interventionId: intervention.id,
          type: DocumentType.DEVIS,
        },
        data: {
          statutPaiement: StatutPaiement.PAYE,
        },
      });

      const existingDevis = intervention.documents.find((d) => d.type === DocumentType.DEVIS);
      const montantFacture = existingDevis ? existingDevis.montant : 10000;

      const docNum = await generateDocumentNumber(DocumentType.FACTURE);

      await db.financialDocument.create({
        data: {
          numero: docNum,
          type: DocumentType.FACTURE,
          typeFacture: FactureType.REPARATION,
          interventionId: intervention.id,
          montant: montantFacture,
          statutPaiement: StatutPaiement.EN_ATTENTE,
        },
      });

      await db.intervention.update({
        where: { id: intervention.id },
        data: {
          statut: InterventionStatut.DEVIS_ACCEPTE,
          historique: {
            create: [
              {
                action: "Devis accepté en ligne par le client",
                note: `Le client a validé le devis en ligne (Téléphone vérifié). Facture ${docNum} émise en attente de règlement.`,
              },
            ],
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Merci ! Votre accord a été enregistré. Notre atelier va préparer votre matériel dès confirmation de règlement.",
      });
    }

    if (action === "refuse_devis") {
      await db.financialDocument.updateMany({
        where: {
          interventionId: intervention.id,
          type: DocumentType.DEVIS,
        },
        data: {
          statutPaiement: StatutPaiement.REFUSE,
        },
      });

      await db.intervention.update({
        where: { id: intervention.id },
        data: {
          statut: InterventionStatut.DEVIS_REFUSE,
          historique: {
            create: [
              {
                action: "Devis décliné en ligne par le client",
                note: "Le client a refusé la proposition de devis en ligne (Téléphone vérifié).",
              },
            ],
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Votre décision a été transmise à notre atelier. Votre matériel est disponible pour retrait.",
      });
    }

    return NextResponse.json({ success: false, message: "Action non valide." }, { status: 400 });

  } catch (error: any) {
    console.error("Erreur action client suivi public:", error);
    const userMessage =
      error.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("SELECT")
        ? error.message
        : "Une erreur inattendue est survenue lors de la transmission de votre décision.";
    return NextResponse.json({ success: false, message: userMessage }, { status: 500 });
  }
}
