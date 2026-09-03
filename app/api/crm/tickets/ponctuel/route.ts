import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ticketPonctuelCrmSchema } from "@/lib/validations";
import { generateInterventionNumber, generateDocumentNumber } from "@/lib/documents/numbering";
import { InterventionType, InterventionStatut, DocumentType, FactureType, StatutPaiement, StaffRole } from "@prisma/client";

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

    const userName =
      `${(session.user as any).firstName || ""} ${(session.user as any).lastName || ""}`.trim() ||
      session.user.name ||
      "Réception";

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
              action: `Ticket ponctuel créé par ${userName} (${role})`,
              note: `Diagnostic initial fixé à ${montantDiag} FCFA`,
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
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création du ticket." },
      { status: 500 }
    );
  }
}
