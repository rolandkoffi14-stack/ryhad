import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ticketContractuelCrmSchema } from "@/lib/validations";
import { generateInterventionNumber } from "@/lib/documents/numbering";
import { InterventionType, InterventionStatut, StaffRole } from "@prisma/client";

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
              action: `Ticket contractuel déclenché par ${userName} (${role})`,
              note: "Main d'œuvre couverte par le contrat de maintenance active",
            },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, id: ticket.id, numero: ticket.numero }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création ticket contractuel:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création du ticket." },
      { status: 500 }
    );
  }
}
