import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { DocumentType, FactureType, StatutPaiement } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, typeFacture, interventionId, contractId, montant, statutPaiement } = body;

    const docType = (type as DocumentType) || DocumentType.FACTURE;
    const numero = await generateDocumentNumber(docType);

    let docMontant = montant;
    let computedTypeFacture: FactureType | null = null;

    if (docType === DocumentType.FACTURE) {
      if (typeFacture) {
        computedTypeFacture = typeFacture as FactureType;
      } else if (contractId) {
        computedTypeFacture = FactureType.CONTRAT;
      } else {
        computedTypeFacture = FactureType.REPARATION;
      }
    }

    // Si contrat, récupérer le montant main d'œuvre
    if (contractId && !docMontant) {
      const contract = await db.contract.findUnique({ where: { id: contractId } });
      if (contract) {
        docMontant = contract.montantMainOeuvre;
      }
    }

    const doc = await db.financialDocument.create({
      data: {
        numero,
        type: docType,
        typeFacture: computedTypeFacture,
        interventionId: interventionId || null,
        contractId: contractId || null,
        montant: docMontant || 10000,
        statutPaiement: statutPaiement || StatutPaiement.EN_ATTENTE,
      },
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur génération document financier:", error);
    const userMessage =
      error.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("SELECT")
        ? error.message
        : "Une erreur est survenue lors de la génération du document financier.";
    return NextResponse.json({ success: false, message: userMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { documentId, statutPaiement, modePaiement, referencePaiement } = body;

    const updateData: any = { statutPaiement };
    if (statutPaiement === StatutPaiement.PAYE) {
      updateData.modePaiement = modePaiement || "ESPECES";
      updateData.referencePaiement = referencePaiement || null;
      updateData.datePaiement = new Date();
    }

    const doc = await db.financialDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({ success: true, document: doc, message: "Statut mis à jour avec succès." });
  } catch (error: any) {
    console.error("Erreur mise à jour document financier:", error);
    return NextResponse.json({ success: false, message: "Une erreur est survenue lors de la mise à jour." }, { status: 400 });
  }
}
