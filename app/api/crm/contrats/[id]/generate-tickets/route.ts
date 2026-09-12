import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  StaffRole,
  InterventionType,
  TypeMateriel,
  ModeIntervention,
  InterventionStatut,
  DocumentType,
  FactureType,
  StatutPaiement,
  TermeFacturation,
} from "@prisma/client";
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
      actionType = "INITIAL", // "INITIAL" | "AJUSTER" | "PROLONGER"
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

    // La fréquence est la clause contractuelle fixe du contrat
    const freqNum = contract.frequenceVisites || 1;
    const resolvedJourPassage =
      jourPassage ||
      contract.jourPassage ||
      (freqNum === 2
        ? "1er et 15 du mois"
        : freqNum === 4
        ? "Chaque semaine"
        : "1er du mois");

    // Mettre à jour les paramètres logistiques sur le contrat
    await db.contract.update({
      where: { id: contractId },
      data: {
        jourPassage: resolvedJourPassage,
        termeFacturation:
          termeFacturation === "A_ECHOIR"
            ? TermeFacturation.A_ECHOIR
            : TermeFacturation.ECHU,
      },
    });

    // Jours réels de passage
    let days: number[] = [1];
    const passageLower = resolvedJourPassage.toLowerCase();

    if (freqNum === 2) {
      if (passageLower.includes("5") && passageLower.includes("20")) {
        days = [5, 20];
      } else if (passageLower.includes("10") && passageLower.includes("25")) {
        days = [10, 25];
      } else {
        days = [1, 15];
      }
    } else if (freqNum === 1) {
      if (passageLower.includes("10")) {
        days = [10];
      } else if (passageLower.includes("15")) {
        days = [15];
      } else if (passageLower.includes("20")) {
        days = [20];
      } else {
        days = [1];
      }
    } else if (freqNum === 4) {
      days = [1, 8, 15, 22];
    }

    const existingScheduled = contract.interventions
      .filter((i) => i.dateProgrammee !== null)
      .sort((a, b) => new Date(a.dateProgrammee!).getTime() - new Date(b.dateProgrammee!).getTime());

    // Détermination de l'action réelle si non spécifiée
    const effectiveAction = existingScheduled.length === 0 ? "INITIAL" : actionType;

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

    const visitDates: Date[] = [];
    let feedbackMessage = "";

    // -------------------------------------------------------------
    // CAS 1 : AJUSTEMENT DU PLANNING RESTANT (tickets futurs non démarrés)
    // -------------------------------------------------------------
    if (effectiveAction === "AJUSTER") {
      const now = new Date();
      // On cible uniquement les tickets programmés après aujourd'hui qui sont strictement à l'état NOUVEAU
      const futureTickets = existingScheduled.filter(
        (t) => new Date(t.dateProgrammee!) > now && t.statut === InterventionStatut.NOUVEAU
      );

      if (futureTickets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Aucune intervention future non démarrée à réajuster. Utilisez l'option 'Prolonger le contrat' pour planifier un nouveau cycle.",
          },
          { status: 400 }
        );
      }

      // Supprimer les tickets futurs non démarrés
      await db.intervention.deleteMany({
        where: {
          id: { in: futureTickets.map((t) => t.id) },
        },
      });

      // Recalculer les dates futures à partir du mois courant/prochain
      let loopYear = now.getFullYear();
      let loopMonth = now.getMonth();
      const quotaToReplace = futureTickets.length;

      while (visitDates.length < quotaToReplace) {
        for (const day of days) {
          if (visitDates.length >= quotaToReplace) break;
          const candidateDate = new Date(loopYear, loopMonth, day, 9, 0, 0);
          if (candidateDate > now) {
            visitDates.push(candidateDate);
          }
        }
        loopMonth++;
        if (loopMonth > 11) {
          loopMonth = 0;
          loopYear++;
        }
      }

      feedbackMessage = `Planning réajusté : ${visitDates.length} intervention(s) future(s) reprogrammée(s). Les factures et l'historique passé sont conservés intacts.`;
    }

    // -------------------------------------------------------------
    // CAS 2 : PROLONGATION DU CONTRAT (+12 mois CDI ou durée CDD)
    // -------------------------------------------------------------
    else if (effectiveAction === "PROLONGER") {
      const lastTicketInContract = existingScheduled[existingScheduled.length - 1];
      const lastDate = lastTicketInContract?.dateProgrammee
        ? new Date(lastTicketInContract.dateProgrammee)
        : new Date();

      // Nouveau cycle commence le mois suivant le dernier ticket
      let loopYear = lastDate.getFullYear();
      let loopMonth = lastDate.getMonth() + 1;
      if (loopMonth > 11) {
        loopMonth = 0;
        loopYear++;
      }

      let extensionMonths = 12;
      if (contract.dateFin) {
        const start = new Date(contract.dateDebut);
        const end = new Date(contract.dateFin);
        const origMonths = Math.max(
          1,
          (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
        );
        extensionMonths = origMonths;

        // Repousser la date de fin sur le contrat
        const newEndDate = new Date(end);
        newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
        await db.contract.update({
          where: { id: contract.id },
          data: { dateFin: newEndDate },
        });
      }

      const quotaNewVisites = extensionMonths * freqNum;

      while (visitDates.length < quotaNewVisites) {
        for (const day of days) {
          if (visitDates.length >= quotaNewVisites) break;
          const candidateDate = new Date(loopYear, loopMonth, day, 9, 0, 0);
          visitDates.push(candidateDate);
        }
        loopMonth++;
        if (loopMonth > 11) {
          loopMonth = 0;
          loopYear++;
        }
      }

      feedbackMessage = `Contrat prolongé : ${visitDates.length} nouvelles interventions planifiées (${contract.dateFin ? "Prolongation CDD de " + extensionMonths + " mois" : "Nouveau cycle CDI de 12 mois"}).`;
    }

    // -------------------------------------------------------------
    // CAS 3 : INITIALISATION (Première génération)
    // -------------------------------------------------------------
    else {
      const startDate = new Date(contract.dateDebut);
      let totalMonths = 12;
      if (contract.dateFin) {
        const endDate = new Date(contract.dateFin);
        const diffMonths =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());
        totalMonths = Math.max(1, diffMonths);
      }

      const quotaTotalVisites = totalMonths * freqNum;
      let loopYear = startDate.getFullYear();
      let loopMonth = startDate.getMonth();

      while (visitDates.length < quotaTotalVisites) {
        for (const day of days) {
          if (visitDates.length >= quotaTotalVisites) break;
          const candidateDate = new Date(loopYear, loopMonth, day, 9, 0, 0);
          if (candidateDate >= startDate) {
            visitDates.push(candidateDate);
          }
        }
        loopMonth++;
        if (loopMonth > 11) {
          loopMonth = 0;
          loopYear++;
        }
      }

      feedbackMessage = `${visitDates.length} interventions programmées (${contract.dateFin ? "CDD de " + totalMonths + " mois" : "CDI — cycle initial de 12 mois"}).`;
    }

    // Création en base des nouveaux tickets calculés
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
          montantMainOeuvre: 0,
        },
      });

      createdTickets.push(ticket);
    }

    // Génération conditionnelle des factures (uniquement pour INITIAL et PROLONGER)
    let createdInvoicesCount = 0;
    if ((effectiveAction === "INITIAL" || effectiveAction === "PROLONGER") && genererFactures && contract.montantMainOeuvre > 0) {
      let stepMonths = 1;
      if (contract.periodicite === "TRIMESTRIEL") stepMonths = 3;
      if (contract.periodicite === "ANNUEL") stepMonths = 12;

      // Déterminer la date de départ de facturation
      const existingInvoices = await db.financialDocument.findMany({
        where: {
          contractId: contract.id,
          type: DocumentType.FACTURE,
          typeFacture: FactureType.CONTRAT,
        },
        select: { dateEmission: true },
        orderBy: { dateEmission: "desc" },
      });

      let invoiceStartDate: Date;
      if (effectiveAction === "PROLONGER" && existingInvoices.length > 0) {
        const lastInvDate = new Date(existingInvoices[0].dateEmission);
        invoiceStartDate = new Date(lastInvDate);
        invoiceStartDate.setMonth(invoiceStartDate.getMonth() + stepMonths);
      } else {
        invoiceStartDate = new Date(contract.dateDebut);
      }

      let totalInvoicesTarget = 12 / stepMonths;
      if (effectiveAction === "PROLONGER" && contract.dateFin) {
        const start = new Date(contract.dateDebut);
        const end = new Date(contract.dateFin);
        const origMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        totalInvoicesTarget = Math.max(1, Math.floor(origMonths / stepMonths));
      } else if (effectiveAction === "INITIAL" && contract.dateFin) {
        const start = new Date(contract.dateDebut);
        const end = new Date(contract.dateFin);
        const diffMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        totalInvoicesTarget = Math.max(1, Math.floor(diffMonths / stepMonths));
      }

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

      for (let i = 0; i < totalInvoicesTarget; i++) {
        const invDate = new Date(invoiceStartDate);
        invDate.setMonth(invDate.getMonth() + i * stepMonths);

        const alreadyExists = existingInvoices.some((ef) => {
          const d = new Date(ef.dateEmission);
          return d.getFullYear() === invDate.getFullYear() && d.getMonth() === invDate.getMonth();
        });

        if (alreadyExists) continue;

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
        titre: effectiveAction === "AJUSTER" ? "Planning contrat réajusté" : "Tickets contractuels générés",
        message: `${feedbackMessage} ${createdInvoicesCount > 0 ? createdInvoicesCount + " facture(s) émise(s)." : ""}`,
        type: "SYSTEME",
      },
    });

    broadcastCrmEvent("contrat:updated", contract.id);
    broadcastCrmEvent("tickets:batch_created", contract.id);

    return NextResponse.json({
      success: true,
      message: `${feedbackMessage} ${createdInvoicesCount > 0 ? createdInvoicesCount + " facture(s) générée(s)." : ""}`,
      ticketsCount: createdTickets.length,
      invoicesCount: createdInvoicesCount,
      actionType: effectiveAction,
    });
  } catch (error: any) {
    console.error("Erreur génération/reconfiguration tickets contrat:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de la configuration du contrat." },
      { status: 500 }
    );
  }
}
