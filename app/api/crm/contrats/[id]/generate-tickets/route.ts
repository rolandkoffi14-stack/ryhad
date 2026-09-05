import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffRole, InterventionType, TypeMateriel, ModeIntervention, InterventionStatut, DocumentType, FactureType, StatutPaiement, TermeFacturation } from "@prisma/client";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role as StaffRole;
    if (role !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Action réservée exclusivement à l'Administrateur." },
        { status: 403 }
      );
    }

    const { id: contractId } = await params;
    const body = await request.json();

    const {
      frequenceVisites = 1, // 1 ou 2 fois par mois
      jourPassage,
      termeFacturation = "ECHU",
      technicienAssigneId,
      checklistPrevue = "Dépoussiérage et soufflage complet, contrôle antivirus et mises à jour, vérification des sauvegardes, test des onduleurs et tensions électriques, vérification de l'intégrité du réseau local.",
      genererFactures = true,
    } = body;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        interventions: true,
        facturesPeriodiques: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ success: false, message: "Contrat introuvable." }, { status: 404 });
    }

    // Mettre à jour les clauses sur le contrat
    await db.contract.update({
      where: { id: contractId },
      data: {
        frequenceVisites: Number(frequenceVisites),
        jourPassage: jourPassage || (frequenceVisites === 2 ? "1er et 15 du mois" : "1er du mois"),
        termeFacturation: termeFacturation === "A_ECHOIR" ? TermeFacturation.A_ECHOIR : TermeFacturation.ECHU,
      },
    });

    const startDate = new Date(contract.dateDebut);
    const defaultEnd = new Date(startDate);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    const endDate = contract.dateFin ? new Date(contract.dateFin) : defaultEnd;

    // 1. Calculer les dates prévues d'interventions
    const visitDates: Date[] = [];
    const loopDate = new Date(startDate);

    while (loopDate < endDate) {
      const year = loopDate.getFullYear();
      const month = loopDate.getMonth();

      if (frequenceVisites === 2) {
        // Deux fois par mois : le 5 et le 20
        const date1 = new Date(year, month, 5, 9, 0, 0);
        const date2 = new Date(year, month, 20, 9, 0, 0);

        if (date1 >= startDate && date1 <= endDate) visitDates.push(date1);
        if (date2 >= startDate && date2 <= endDate) visitDates.push(date2);
      } else if (frequenceVisites === 1) {
        // Une fois par mois : le 10 du mois
        const date1 = new Date(year, month, 10, 9, 0, 0);
        if (date1 >= startDate && date1 <= endDate) visitDates.push(date1);
      } else if (frequenceVisites === 4) {
        // Hebdomadaire (4 fois par mois) : les 7, 14, 21, 28
        [7, 14, 21, 28].forEach((day) => {
          const date = new Date(year, month, day, 9, 0, 0);
          if (date >= startDate && date <= endDate) visitDates.push(date);
        });
      }

      // Passer au mois suivant
      loopDate.setMonth(loopDate.getMonth() + 1);
    }

    // Récupérer le dernier numéro d'intervention séquentiel
    const currentYear = new Date().getFullYear();
    const lastTicket = await db.intervention.findFirst({
      where: { numero: { startsWith: `INT-${currentYear}-` } },
      orderBy: { numero: "desc" },
    });

    let currentSeq = 1;
    if (lastTicket?.numero) {
      const parts = lastTicket.numero.split("-");
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) currentSeq = seq + 1;
    }

    // Créer les tickets d'intervention pour chaque date
    const createdTickets = [];
    for (const vDate of visitDates) {
      const paddedSeq = currentSeq.toString().padStart(4, "0");
      const ticketNum = `INT-${currentYear}-${paddedSeq}`;
      currentSeq++;

      const ticket = await db.intervention.create({
        data: {
          numero: ticketNum,
          clientId: contract.clientId,
          contractId: contract.id,
          type: InterventionType.CONTRACTUEL,
          typeMateriel: TypeMateriel.AUTRE,
          panneDeclaree: `Maintenance préventive contractuelle — ${contract.equipementsCouverts || "Parc complet"}`,
          modeIntervention: ModeIntervention.DOMICILE,
          statut: InterventionStatut.NOUVEAU,
          dateProgrammee: vDate,
          checklistPrevue: checklistPrevue,
          technicienAssigneId: technicienAssigneId || null,
          montantMainOeuvre: 0, // Inclus dans le forfait contrat
        },
      });

      createdTickets.push(ticket);
    }

    // 2. Générer les factures périodiques si demandé
    let createdInvoicesCount = 0;
    if (genererFactures && contract.montantMainOeuvre > 0) {
      // Calculer les périodes de facturation selon contract.periodicite
      let stepMonths = 1;
      if (contract.periodicite === "TRIMESTRIEL") stepMonths = 3;
      if (contract.periodicite === "ANNUEL") stepMonths = 12;

      const invoiceDates: Date[] = [];
      const billDate = new Date(startDate);

      while (billDate < endDate) {
        invoiceDates.push(new Date(billDate));
        billDate.setMonth(billDate.getMonth() + stepMonths);
      }

      // Dernier numéro séquentiel de facture
      const lastInvoice = await db.financialDocument.findFirst({
        where: { numero: { startsWith: `FAC-${currentYear}-` } },
        orderBy: { numero: "desc" },
      });

      let invoiceSeq = 1;
      if (lastInvoice?.numero) {
        const parts = lastInvoice.numero.split("-");
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq)) invoiceSeq = seq + 1;
      }

      for (const invDate of invoiceDates) {
        const paddedSeq = invoiceSeq.toString().padStart(4, "0");
        const invNum = `FAC-${currentYear}-${paddedSeq}`;
        invoiceSeq++;

        await db.financialDocument.create({
          data: {
            numero: invNum,
            type: DocumentType.FACTURE,
            typeFacture: FactureType.CONTRAT,
            contractId: contract.id,
            montant: contract.montantMainOeuvre,
            statutPaiement: StatutPaiement.EN_ATTENTE,
            dateEmission: invDate,
          },
        });

        createdInvoicesCount++;
      }
    }

    // Notification système
    await db.notification.create({
      data: {
        userId: (session.user as any).id,
        titre: "Tickets contractuels générés",
        message: `${createdTickets.length} interventions programmées et ${createdInvoicesCount} factures générées pour le contrat de ${contract.client.nom}.`,
        type: "SYSTEME",
        lien: `/crm/tickets/contractuel?contractId=${contract.id}`,
      },
    });

    broadcastCrmEvent("contrat:updated", contract.id);

    return NextResponse.json({
      success: true,
      message: `${createdTickets.length} intervention(s) préventive(s) et ${createdInvoicesCount} facture(s) configurées avec succès.`,
      ticketsCount: createdTickets.length,
      invoicesCount: createdInvoicesCount,
    });
  } catch (error: any) {
    console.error("Erreur génération tickets contractuels:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur serveur lors de la génération des tickets." },
      { status: 500 }
    );
  }
}
