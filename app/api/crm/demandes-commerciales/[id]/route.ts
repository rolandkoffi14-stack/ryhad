import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { DemandeStatut, DocumentType, FactureType, StatutPaiement, StaffRole } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const demande = await db.demandeCommerciale.findUnique({
      where: { id },
      include: {
        client: true,
        documents: {
          orderBy: { dateEmission: "desc" },
        },
      },
    });

    if (!demande) {
      return NextResponse.json({ success: false, message: "Demande commerciale non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ success: true, demande });
  } catch (error: any) {
    console.error("Erreur GET demande commerciale:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la récupération de la demande" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role as StaffRole;
    if (role === StaffRole.TECHNICIEN) {
      return NextResponse.json(
        { success: false, message: "Action réservée à la réception ou à la direction." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { actionType, lignes, notesInternes, statut } = body;

    const currentDemande = await db.demandeCommerciale.findUnique({
      where: { id },
      include: {
        client: true,
        documents: true,
      },
    });

    if (!currentDemande) {
      return NextResponse.json({ success: false, message: "Demande non trouvée" }, { status: 404 });
    }

    // 1. ACTION : Traiter la demande (Passage en EN_COURS)
    if (actionType === "traiter") {
      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          statut: DemandeStatut.EN_COURS,
        },
        include: { client: true, documents: true },
      });
      return NextResponse.json({ success: true, demande: updated, message: "Demande passée en cours de traitement." });
    }

    // 2. ACTION : Sauvegarder les lignes de cotation
    if (actionType === "sauvegarder_lignes") {
      const lignesArr = Array.isArray(lignes) ? lignes : [];
      const totalCalcule = lignesArr.reduce(
        (acc: number, item: any) => acc + (Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0),
        0
      );

      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          lignesCotation: JSON.stringify(lignesArr),
          montantTotal: totalCalcule,
          notesInternes: notesInternes !== undefined ? notesInternes : currentDemande.notesInternes,
        },
        include: { client: true, documents: true },
      });
      return NextResponse.json({ success: true, demande: updated, message: "Cotation enregistrée." });
    }

    // 3. ACTION : Émettre & Envoyer le Devis
    if (actionType === "emettre_devis") {
      const lignesArr = Array.isArray(lignes) ? lignes : (currentDemande.lignesCotation ? JSON.parse(currentDemande.lignesCotation) : []);
      const totalCalcule = lignesArr.reduce(
        (acc: number, item: any) => acc + (Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0),
        0
      );

      if (totalCalcule <= 0) {
        return NextResponse.json(
          { success: false, message: "Veuillez saisir au moins une ligne avec un montant valide avant d'émettre le devis." },
          { status: 400 }
        );
      }

      // Vérifier si un devis existe déjà pour cette demande
      let devisDoc = currentDemande.documents.find((d) => d.type === DocumentType.DEVIS);

      if (devisDoc) {
        await db.financialDocument.update({
          where: { id: devisDoc.id },
          data: {
            montant: totalCalcule,
            statutPaiement: StatutPaiement.EN_ATTENTE,
          },
        });
      } else {
        const docNum = await generateDocumentNumber(DocumentType.DEVIS);
        devisDoc = await db.financialDocument.create({
          data: {
            numero: docNum,
            type: DocumentType.DEVIS,
            typeFacture: FactureType.COMMERCIALE,
            demandeCommercialeId: currentDemande.id,
            montant: totalCalcule,
            statutPaiement: StatutPaiement.EN_ATTENTE,
          },
        });
      }

      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          statut: DemandeStatut.DEVIS_ENVOYE,
          lignesCotation: JSON.stringify(lignesArr),
          montantTotal: totalCalcule,
          notesInternes: notesInternes !== undefined ? notesInternes : currentDemande.notesInternes,
        },
        include: { client: true, documents: true },
      });

      return NextResponse.json({
        success: true,
        demande: updated,
        message: `Devis ${devisDoc.numero} émis avec succès (${totalCalcule.toLocaleString("fr-FR")} FCFA).`,
      });
    }

    // 4. ACTION : Valider l'accord du client (Génère la facture en attente)
    if (actionType === "valider_accord") {
      const devisDoc = currentDemande.documents.find((d) => d.type === DocumentType.DEVIS);
      if (devisDoc) {
        await db.financialDocument.update({
          where: { id: devisDoc.id },
          data: { statutPaiement: StatutPaiement.PAYE },
        });
      }

      // Générer ou mettre à jour la facture commerciale
      let factDoc = currentDemande.documents.find((d) => d.type === DocumentType.FACTURE);
      const montant = currentDemande.montantTotal || devisDoc?.montant || 0;

      if (factDoc) {
        await db.financialDocument.update({
          where: { id: factDoc.id },
          data: {
            montant,
            statutPaiement: StatutPaiement.EN_ATTENTE,
          },
        });
      } else {
        const docNum = await generateDocumentNumber(DocumentType.FACTURE);
        factDoc = await db.financialDocument.create({
          data: {
            numero: docNum,
            type: DocumentType.FACTURE,
            typeFacture: FactureType.COMMERCIALE,
            demandeCommercialeId: currentDemande.id,
            montant,
            statutPaiement: StatutPaiement.EN_ATTENTE,
          },
        });
      }

      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          statut: DemandeStatut.DEVIS_ACCEPTE,
        },
        include: { client: true, documents: true },
      });

      return NextResponse.json({
        success: true,
        demande: updated,
        message: `Accord validé. Facture ${factDoc.numero} générée en attente de règlement.`,
      });
    }

    // 5. ACTION : Refuser le devis
    if (actionType === "refuser_devis") {
      const devisDoc = currentDemande.documents.find((d) => d.type === DocumentType.DEVIS);
      if (devisDoc) {
        await db.financialDocument.update({
          where: { id: devisDoc.id },
          data: { statutPaiement: StatutPaiement.REFUSE },
        });
      }

      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          statut: DemandeStatut.DEVIS_REFUSE,
        },
        include: { client: true, documents: true },
      });

      return NextResponse.json({
        success: true,
        demande: updated,
        message: "Devis marqué comme refusé.",
      });
    }

    // 6. ACTION : Encaisser la facture
    if (actionType === "encaisser_facture") {
      const factDoc = currentDemande.documents.find((d) => d.type === DocumentType.FACTURE);
      const modePaiement = body.modePaiement || "ESPECES";
      const referencePaiement = body.referencePaiement || null;

      if (factDoc) {
        await db.financialDocument.update({
          where: { id: factDoc.id },
          data: {
            statutPaiement: StatutPaiement.PAYE,
            modePaiement,
            referencePaiement,
            datePaiement: new Date(),
          },
        });
      }

      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          statut: DemandeStatut.FACTURE_PAYEE,
        },
        include: { client: true, documents: true },
      });

      return NextResponse.json({
        success: true,
        demande: updated,
        message: `Règlement encaissé avec succès via ${modePaiement.replace(/_/g, " ")}.`,
      });
    }

    // 7. ACTION : Clôturer la demande
    if (actionType === "cloturer") {
      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: {
          statut: DemandeStatut.CLOS,
        },
        include: { client: true, documents: true },
      });

      return NextResponse.json({
        success: true,
        demande: updated,
        message: "Dossier commercial clôturé et archivé.",
      });
    }

    // Fallback : mise à jour directe du statut
    if (statut) {
      const updated = await db.demandeCommerciale.update({
        where: { id },
        data: { statut: statut as DemandeStatut },
        include: { client: true, documents: true },
      });
      return NextResponse.json({ success: true, demande: updated });
    }

  } catch (error: any) {
    console.error("Erreur PATCH demande commerciale:", error);
    const userMessage =
      error.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("SELECT")
        ? error.message
        : "Une erreur inattendue est survenue lors de la mise à jour de la demande.";
    return NextResponse.json({ success: false, message: userMessage }, { status: 500 });
  }
}
