import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketContractuelCrmSchema } from "@/lib/validations";
import { generateInterventionNumber } from "@/lib/documents/numbering";
import { InterventionType, InterventionStatut } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = ticketContractuelCrmSchema.parse(body);

    const numero = await generateInterventionNumber();

    const ticket = await db.intervention.create({
      data: {
        numero,
        clientId: validated.clientId,
        contractId: validated.contractId,
        type: InterventionType.CONTRACTUEL,
        typeMateriel: validated.typeMateriel,
        panneDeclaree: validated.panneDeclaree,
        modeIntervention: validated.modeIntervention,
        statut: InterventionStatut.NOUVEAU,
        montantDiagnostic: null, // STRICTEMENT NULL en parcours contractuel
        technicienAssigneId: validated.technicienAssigneId || null,
        historique: {
          create: [
            {
              action: "Ticket contractuel déclenché (prise en charge directe)",
              note: "Main d'œuvre couverte par le contrat de maintenance",
            },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, id: ticket.id, numero: ticket.numero }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création ticket contractuel:", error);
    return NextResponse.json({ success: false, message: error.message || "Erreur serveur" }, { status: 400 });
  }
}
