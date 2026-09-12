import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contractFormSchema } from "@/lib/validations";
import { ContractStatus, VisiteStatus, Periodicite, StaffRole } from "@prisma/client";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

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

    // Règle d'unicité stricte : un client ne peut pas avoir plus d'un contrat actif
    const existingActiveContract = await db.contract.findFirst({
      where: {
        clientId: validated.clientId,
        statut: ContractStatus.ACTIF,
      },
      include: {
        client: true,
      },
    });

    if (existingActiveContract) {
      return NextResponse.json(
        {
          success: false,
          message: `Le client ${existingActiveContract.client.nom} dispose déjà d'un contrat de maintenance actif. Un client ne peut pas avoir plus d'un contrat actif simultanément.`,
        },
        { status: 400 }
      );
    }

    const startDate = new Date(validated.dateDebut);
    let finalEndDate: Date | null = null;

    if (validated.dateFin && validated.dateFin.trim() !== "") {
      finalEndDate = new Date(validated.dateFin);
      const minEnd = new Date(startDate);
      let minMonths = 1;
      if (validated.periodicite === Periodicite.TRIMESTRIEL) minMonths = 3;
      else if (validated.periodicite === Periodicite.ANNUEL) minMonths = 12;
      minEnd.setMonth(minEnd.getMonth() + minMonths);

      if (finalEndDate < minEnd) {
        return NextResponse.json(
          {
            success: false,
            message: `Pour une périodicité ${validated.periodicite.toLowerCase()}, la durée minimale du contrat est de ${minMonths} mois.`,
          },
          { status: 400 }
        );
      }
    }

    // Durée de projection pour les visites initiales : durée du CDD ou 1 an pour un CDI
    const defaultEnd = new Date(startDate);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    const horizonDate = finalEndDate || defaultEnd;

    // Calculer le pas d'intervalle en mois selon la périodicité
    let intervalMonths = 1;
    if (validated.periodicite === Periodicite.TRIMESTRIEL) intervalMonths = 3;
    else if (validated.periodicite === Periodicite.ANNUEL) intervalMonths = 12;

    const visitesToCreate: { datePrevue: Date; statut: VisiteStatus }[] = [];
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + intervalMonths);

    while (currentDate <= horizonDate) {
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
        dateFin: finalEndDate, // null pour CDI
        periodicite: validated.periodicite,
        montantMainOeuvre: validated.montantMainOeuvre,
        frequenceVisites: validated.frequenceVisites || 1,
        equipementsCouverts: validated.equipementsCouverts,
        statut: ContractStatus.ACTIF,
        visitesPlanifiees: {
          create: visitesToCreate,
        },
      },
    });

    broadcastCrmEvent("contrat:updated", contract.id);

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
