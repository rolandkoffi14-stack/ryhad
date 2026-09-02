import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketPonctuelCrmSchema } from "@/lib/validations";
import { generateInterventionNumber, generateDocumentNumber } from "@/lib/documents/numbering";
import { InterventionType, InterventionStatut, DocumentType, FactureType, StatutPaiement } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = ticketPonctuelCrmSchema.parse(body);

    const numero = await generateInterventionNumber();
    const docNumero = await generateDocumentNumber(DocumentType.FACTURE);
    const montantDiag = validated.montantDiagnostic;

    if (!montantDiag || montantDiag < 1000) {
      return NextResponse.json(
        { success: false, message: "Les frais de diagnostic doivent être d'au moins 1 000 FCFA." },
        { status: 400 }
      );
    }

    // Création du ticket et émission immédiate de la facture de diagnostic
    const ticket = await db.intervention.create({
      data: {
        numero,
        clientId: validated.clientId,
        type: InterventionType.PONCTUEL,
        typeMateriel: validated.typeMateriel,
        panneDeclaree: validated.panneDeclaree,
        modeIntervention: validated.modeIntervention,
        statut: InterventionStatut.NOUVEAU,
        montantDiagnostic: montantDiag,
        technicienAssigneId: validated.technicienAssigneId || null,
        documents: {
          create: [
            {
              numero: docNumero,
              type: DocumentType.FACTURE,
              typeFacture: FactureType.DIAGNOSTIC,
              montant: montantDiag,
              statutPaiement: StatutPaiement.EN_ATTENTE,
            },
          ],
        },
        historique: {
          create: [
            {
              action: "Ticket ponctuel créé par la réception",
              note: `Diagnostic initial : ${montantDiag} FCFA`,
            },
            {
              action: `Facture de diagnostic émise : ${docNumero}`,
              note: `Montant : ${montantDiag} FCFA (En attente d'encaissement par la réception)`,
            },
          ],
        },
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json(
      { success: true, id: ticket.id, numero: ticket.numero, invoiceNumero: docNumero },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur création ticket ponctuel:", error);
    return NextResponse.json({ success: false, message: error.message || "Erreur serveur" }, { status: 400 });
  }
}
