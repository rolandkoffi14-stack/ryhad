import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { DocumentType, FactureType, StatutPaiement, StaffRole } from "@prisma/client";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { type, typeFacture, interventionId, contractId, montant, statutPaiement } = body;

    const docType = (type as DocumentType) || DocumentType.FACTURE;
    const numero = await generateDocumentNumber(docType);

    let docMontant = montant ? parseInt(montant, 10) : undefined;
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

    broadcastCrmEvent("document:created", doc.id);

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur génération document financier:", error);
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la génération du document financier." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role as StaffRole;
    if (role === StaffRole.TECHNICIEN) {
      return NextResponse.json(
        { success: false, message: "Seule la réception ou l'administration peut encaisser ou modifier un document." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { documentId, statutPaiement, modePaiement, referencePaiement } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, message: "Identifiant de document requis." }, { status: 400 });
    }

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

    broadcastCrmEvent("document:updated", doc.id);

    return NextResponse.json({ success: true, document: doc, message: "Statut mis à jour avec succès." });
  } catch (error: any) {
    console.error("Erreur mise à jour document financier:", error);
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la mise à jour du document." },
      { status: 500 }
    );
  }
}
