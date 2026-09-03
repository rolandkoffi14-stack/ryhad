import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contractFormSchema } from "@/lib/validations";
import { ContractStatus, VisiteStatus, Periodicite, StaffRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role as StaffRole;
    if (role !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Action réservée exclusivement à la Direction (Administrateur)." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = contractFormSchema.parse(body);

    const startDate = new Date(validated.dateDebut);
    // Durée par défaut 1 an si non précisée
    const defaultEnd = new Date(startDate);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    const endDate = validated.dateFin ? new Date(validated.dateFin) : defaultEnd;

    // Calculer le pas d'intervalle en mois selon la périodicité
    let intervalMonths = 1;
    if (validated.periodicite === Periodicite.TRIMESTRIEL) intervalMonths = 3;
    else if (validated.periodicite === Periodicite.ANNUEL) intervalMonths = 12;

    const visitesToCreate: { datePrevue: Date; statut: VisiteStatus }[] = [];
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + intervalMonths);

    while (currentDate <= endDate) {
      visitesToCreate.push({
        datePrevue: new Date(currentDate),
        statut: VisiteStatus.PLANIFIEE,
      });
      currentDate.setMonth(currentDate.getMonth() + intervalMonths);
    }

    if (visitesToCreate.length === 0) {
      const fallbackDate = new Date(startDate);
      fallbackDate.setMonth(fallbackDate.getMonth() + intervalMonths);
      visitesToCreate.push({
        datePrevue: fallbackDate,
        statut: VisiteStatus.PLANIFIEE,
      });
    }

    const contract = await db.contract.create({
      data: {
        clientId: validated.clientId,
        dateDebut: startDate,
        dateFin: validated.dateFin ? new Date(validated.dateFin) : endDate,
        periodicite: validated.periodicite,
        montantMainOeuvre: validated.montantMainOeuvre,
        equipementsCouverts: validated.equipementsCouverts,
        statut: ContractStatus.ACTIF,
        visitesPlanifiees: {
          create: visitesToCreate,
        },
      },
    });

    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création contrat:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création du contrat." },
      { status: 500 }
    );
  }
}
