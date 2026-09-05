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
      frequenceVisites = 1, // 1, 2 ou 4 fois par mois
      jourPassage,
      termeFacturation = "ECHU",
      technicienAssigneId,
      checklistPrevue = "Dépoussiérage et soufflage complet, contrôle antivirus et mises à jour, vérification des sauvegardes, test des onduleurs et tensions électriques, vérification de l'intégrité du réseau local.",
      genererFactures = true,
      remplacerExistants = true,
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

    // 1. Détection anti-doublons
    const existingScheduledTickets = contract.interventions.filter(
      (i) => i.dateProgrammee !== null
    );

    if (existingScheduledTickets.length > 0) {
      if (!remplacerExistants) {
        return NextResponse.json(
          {
            success: false,
            message: `Ce contrat possède déjà ${existingScheduledTickets.length} intervention(s) programmée(s). Cochez l'option de remplacement pour régénérer le calendrier.`,
            alreadyConfigured: true,
            existingCount: existingScheduledTickets.length,
          },
          { status: 409 }
        );
      }

      // Remplacement sécurisé : supprimer uniquement les interventions programmées encore à l'état NOUVEAU
      await db.intervention.deleteMany({
        where: {
          contractId: contract.id,
          type: InterventionType.CONTRACTUEL,
          statut: InterventionStatut.NOUVEAU,
          dateProgrammee: { not: null },
        },
      });
    }

    const freqNum = Number(frequenceVisites) || 1;
    const resolvedJourPassage =
      jourPassage ||
      (freqNum === 2
        ? "1er et 15 du mois"
        : freqNum === 4
        ? "Chaque semaine"
        : "1er du mois");

    // Mettre à jour les clauses sur le contrat
    await db.contract.update({
      where: { id: contractId },
      data: {
        frequenceVisites: freqNum,
        jourPassage: resolvedJourPassage,
        termeFacturation:
          termeFacturation === "A_ECHOIR"
            ? TermeFacturation.A_ECHOIR
            : TermeFacturation.ECHU,
      },
    });

    const startDate = new Date(contract.dateDebut);

    // 2. Calcul de la durée contractuelle et du quota total garanti
    let totalMonths = 12; // Par défaut pour un CDI (cycle de 12 mois d'avance)

    if (contract.dateFin) {
      const endDate = new Date(contract.dateFin);
      const diffMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      totalMonths = Math.max(3, diffMonths); // Minimum 3 mois pour un CDD
    }

    const quotaTotalVisites = totalMonths * freqNum;

    // 3. Jours réels de passage
    let days: number[] = [1];
    const passageLower = resolvedJourPassage.toLowerCase();

    if (freqNum === 2) {
      if (passageLower.includes("5") && passageLower.includes("20")) {
        days = [5, 20];
      } else {
        days = [1, 15];
      }
    } else if (freqNum === 1) {
      if (passageLower.includes("10")) {
        days = [10];
      } else if (passageLower.includes("15")) {
        days = [15];
      } else {
        days = [1];
      }
    } else if (freqNum === 4) {
      days = [1, 8, 15, 22];
    }

    // 4. Génération des dates avec report / rattrapage continu en fin de période
    const visitDates: Date[] = [];
    let loopYear = startDate.getFullYear();
    let loopMonth = startDate.getMonth();

    while (visitDates.length < quotaTotalVisites) {
      for (const day of days) {
        if (visitDates.length >= quotaTotalVisites) break;
        const candidateDate = new Date(loopYear, loopMonth, day, 9, 0, 0);
        // On ne garde que les dates à partir de la date de début
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

    // Récupérer le dernier numéro séquentiel d'intervention
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

    // 5. Génération intelligente des factures périodiques
    let createdInvoicesCount = 0;
    if (genererFactures && contract.montantMainOeuvre > 0) {
      let stepMonths = 1;
      if (contract.periodicite === "TRIMESTRIEL") stepMonths = 3;
      if (contract.periodicite === "ANNUEL") stepMonths = 12;

      const totalInvoicesTarget = Math.max(1, Math.floor(totalMonths / stepMonths));

      // Vérifier les factures déjà existantes pour ce contrat
      const existingInvoices = await db.financialDocument.findMany({
        where: {
          contractId: contract.id,
          type: DocumentType.FACTURE,
          typeFacture: FactureType.CONTRAT,
        },
        select: { dateEmission: true },
      });

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

      for (let i = 0; i < totalInvoicesTarget; i++) {
        const invDate = new Date(startDate);
        invDate.setMonth(invDate.getMonth() + i * stepMonths);

        // Vérifier si une facture existe déjà pour le même mois/année
        const alreadyExists = existingInvoices.some((ef) => {
          const d = new Date(ef.dateEmission);
          return (
            d.getFullYear() === invDate.getFullYear() &&
            d.getMonth() === invDate.getMonth()
          );
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
        titre: "Tickets contractuels générés",
        message: `${createdTickets.length} interventions programmées (${contract.dateFin ? "CDD de " + totalMonths + " mois" : "CDI — cycle initial de 12 mois"}) et ${createdInvoicesCount} factures générées pour le contrat de ${contract.client.nom}.`,
        type: "SYSTEME",
      },
    });

    broadcastCrmEvent("contrat:updated", contract.id);
    broadcastCrmEvent("tickets:batch_created", contract.id);

    return NextResponse.json({
      success: true,
      message: `${createdTickets.length} interventions programmées (${contract.dateFin ? "CDD de " + totalMonths + " mois" : "CDI — cycle annuel de 12 mois"}) et ${createdInvoicesCount} factures générées avec succès.`,
      ticketsCount: createdTickets.length,
      invoicesCount: createdInvoicesCount,
    });
  } catch (error: any) {
    console.error("Erreur génération tickets contrat:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de la configuration du contrat." },
      { status: 500 }
    );
  }
}
