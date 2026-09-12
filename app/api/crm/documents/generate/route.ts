import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { documentGenerateSchema, documentUpdateSchema } from "@/lib/validations";
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
    const validated = documentGenerateSchema.parse(body);

    const docType: DocumentType = (validated.type as DocumentType) || DocumentType.FACTURE;
    const numero = await generateDocumentNumber(docType);

    let docMontant = validated.montant ? Number(validated.montant) : undefined;
    let computedTypeFacture: FactureType | null = null;

    if (docType === DocumentType.FACTURE) {
      if (validated.typeFacture) {
        computedTypeFacture = validated.typeFacture as FactureType;
      } else if (validated.contractId) {
        computedTypeFacture = FactureType.CONTRAT;
      } else {
        computedTypeFacture = FactureType.REPARATION;
      }
    }


    // Si contrat, récupérer le montant main d'œuvre si non spécifié
    if (validated.contractId && !docMontant) {
      const contract = await db.contract.findUnique({ where: { id: validated.contractId } });
      if (contract) {
        docMontant = contract.montantMainOeuvre;
      }
    }

    const doc = await db.financialDocument.create({
      data: {
        numero,
        type: docType,
        typeFacture: computedTypeFacture,
        interventionId: validated.interventionId || null,
        contractId: validated.contractId || null,
        montant: docMontant || 10000,
        statutPaiement: validated.statutPaiement || StatutPaiement.EN_ATTENTE,
      },
    });

    broadcastCrmEvent("document:created", doc.id);

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur génération document financier:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
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
    const validated = documentUpdateSchema.parse(body);

    const currentDoc = await db.financialDocument.findUnique({
      where: { id: validated.documentId },
    });

    if (!currentDoc) {
      return NextResponse.json({ success: false, message: "Document introuvable." }, { status: 404 });
    }

    const userId = (session.user as any).id as string;
    const modePaiement = validated.modePaiement || "ESPECES";
    const referencePaiement = validated.referencePaiement || null;

    let nouveauMontantPaye = currentDoc.montantPaye || 0;
    let finalStatut = validated.statutPaiement;

    if (validated.statutPaiement === StatutPaiement.PAYE || validated.statutPaiement === StatutPaiement.PARTIEL) {
      const reste = Math.max(0, currentDoc.montant - nouveauMontantPaye);
      const montantVerse = validated.montantVerse ? Number(validated.montantVerse) : reste;

      if (montantVerse > 0) {
        nouveauMontantPaye += montantVerse;
        if (nouveauMontantPaye >= currentDoc.montant) {
          finalStatut = StatutPaiement.PAYE;
        } else {
          finalStatut = StatutPaiement.PARTIEL;
        }

        // Créer la transaction de règlement
        await db.paymentTransaction.create({
          data: {
            documentId: currentDoc.id,
            montant: montantVerse,
            modePaiement,
            referencePaiement,
            encaisseParId: userId,
            note: validated.note || (finalStatut === StatutPaiement.PAYE ? "Règlement solde" : "Acompte partiel"),
          },
        });
      }
    }

    const updateData: any = {
      statutPaiement: finalStatut,
      montantPaye: nouveauMontantPaye,
    };

    if (finalStatut === StatutPaiement.PAYE || finalStatut === StatutPaiement.PARTIEL) {
      updateData.modePaiement = modePaiement;
      updateData.referencePaiement = referencePaiement;
      updateData.datePaiement = new Date();
    }

    const doc = await db.financialDocument.update({
      where: { id: validated.documentId },
      data: updateData,
    });

    broadcastCrmEvent("document:updated", doc.id);

    return NextResponse.json({ success: true, document: doc, message: "Statut mis à jour avec succès." });
  } catch (error: any) {
    console.error("Erreur mise à jour document financier:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la mise à jour du document." },
      { status: 500 }
    );
  }
}

