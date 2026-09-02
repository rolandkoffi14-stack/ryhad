import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPublicStatusInfo } from "@/lib/interventions/statut-transitions";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { InterventionStatut, DocumentType, FactureType, StatutPaiement } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;

    if (!numero) {
      return NextResponse.json({ success: false, message: "Numéro de ticket requis" }, { status: 400 });
    }

    const intervention = await db.intervention.findUnique({
      where: { numero: numero.toUpperCase().trim() },
      include: {
        client: {
          select: {
            nom: true,
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

    // Trouver le devis actif si existant
    const devisDoc = intervention.documents.find((d) => d.type === DocumentType.DEVIS);

    return NextResponse.json({
      success: true,
      ticket: {
        id: intervention.id,
        numero: intervention.numero,
        type: intervention.type,
        typeMateriel: intervention.typeMateriel,
        panneDeclaree: intervention.panneDeclaree,
        modeIntervention: intervention.modeIntervention,
        clientNom: intervention.client.nom,
        dateCreation: intervention.dateCreation,
        dateCloture: intervention.dateCloture,
        statut: intervention.statut,
        statusInfo,
        devis: devisDoc
          ? {
              numero: devisDoc.numero,
              montant: devisDoc.montant,
              statutPaiement: devisDoc.statutPaiement,
            }
          : null,
        pieces: intervention.piecesUtilisees.map((p) => ({
          designation: p.designation,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
        })),
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
    const { numero } = await params;
    const body = await request.json();
    const { action } = body;

    const intervention = await db.intervention.findUnique({
      where: { numero: numero.toUpperCase().trim() },
      include: {
        documents: true,
      },
    });

    if (!intervention) {
      return NextResponse.json({ success: false, message: "Dossier introuvable." }, { status: 404 });
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
                note: `Le client a validé le devis en ligne. Facture ${docNum} émise en attente de règlement.`,
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
                note: "Le client a refusé la proposition de devis en ligne.",
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

  } catch (error: any) {
    console.error("Erreur action client suivi public:", error);
    const userMessage =
      error.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("SELECT")
        ? error.message
        : "Une erreur inattendue est survenue lors de la transmission de votre décision.";
    return NextResponse.json({ success: false, message: userMessage }, { status: 500 });
  }
}
