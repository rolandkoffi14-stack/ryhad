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
import { generateDocumentNumber } from "@/lib/documents/numbering";
import {
  getStepMonths,
  calculateInvoiceEmissionDate,
  isContractPeriodInvoiced,
} from "@/lib/documents/contract-invoicing";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Infère intelligemment le type de matériel dominant depuis le périmètre d'équipements couverts.
 */
function inferTypeMateriel(equipements: string = ""): TypeMateriel {
  const text = equipements.toLowerCase();
  if (
    text.includes("médical") ||
    text.includes("medical") ||
    text.includes("biomédical") ||
    text.includes("hopital") ||
    text.includes("santé")
  ) {
    return TypeMateriel.APPAREIL_MEDICAL;
  }
  if (
    text.includes("vidéoprojecteur") ||
    text.includes("videoprojecteur") ||
    text.includes("projecteur")
  ) {
    return TypeMateriel.VIDEOPROJECTEUR;
  }
  if (
    text.includes("caméra") ||
    text.includes("camera") ||
    text.includes("surveillance") ||
    text.includes("vidéosurveillance")
  ) {
    return TypeMateriel.CAMERA_VIDEOSURVEILLANCE;
  }
  if (
    text.includes("réseau") ||
    text.includes("reseau") ||
    text.includes("switch") ||
    text.includes("baie") ||
    text.includes("routeur") ||
    text.includes("serveur")
  ) {
    return TypeMateriel.EQUIPEMENT_RESEAU;
  }
  if (
    text.includes("topographie") ||
    text.includes("topographique") ||
    text.includes("gps")
  ) {
    return TypeMateriel.EQUIPEMENT_TOPOGRAPHIE;
  }
  if (
    text.includes("tv") ||
    text.includes("télé") ||
    text.includes("ecran")
  ) {
    return TypeMateriel.TV;
  }
  if (
    text.includes("portable") ||
    text.includes("laptop")
  ) {
    return TypeMateriel.PC_PORTABLE;
  }
  if (
    text.includes("bureau") ||
    text.includes("fixe") ||
    text.includes("desktop") ||
    text.includes("pc") ||
    text.includes("poste")
  ) {
    return TypeMateriel.PC_BUREAU;
  }
  return TypeMateriel.AUTRE;
}

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
      joursPassage, // tableau de nombres précis [1, 15]
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

    // La fréquence est la clause contractuelle fixe du contrat (1, 2 ou 4 passages/mois)
    const freqNum = contract.frequenceVisites || 1;

    // 1. Détermination précise et robuste des jours du mois
    let days: number[] = [];

    if (Array.isArray(joursPassage) && joursPassage.length > 0) {
      days = joursPassage
        .map(Number)
        .filter((d) => !isNaN(d) && d >= 1 && d <= 28)
        .sort((a, b) => a - b);
    }

    // Si non fourni sous forme de tableau, extraction depuis le texte ou repli par défaut
    if (days.length === 0) {
      const rawText = (jourPassage || contract.jourPassage || "").toLowerCase();
      if (freqNum === 2) {
        if (rawText.includes("5") && rawText.includes("20")) {
          days = [5, 20];
        } else if (rawText.includes("10") && rawText.includes("25")) {
          days = [10, 25];
        } else {
          days = [1, 15];
        }
      } else if (freqNum === 1) {
        if (rawText.includes("10")) {
          days = [10];
        } else if (rawText.includes("15")) {
          days = [15];
        } else if (rawText.includes("20")) {
          days = [20];
        } else if (rawText.includes("25")) {
          days = [25];
        } else if (rawText.includes("5")) {
          days = [5];
        } else {
          days = [1];
        }
      } else if (freqNum === 4) {
        days = [1, 8, 15, 22];
      }
    }

    // Construction d'un libellé clair pour affichage
    let resolvedJourPassage = "";
    if (days.length === 1) {
      resolvedJourPassage = `Le ${days[0] === 1 ? "1er" : days[0]} de chaque mois`;
    } else if (days.length === 2) {
      resolvedJourPassage = `Le ${days[0] === 1 ? "1er" : days[0]} et le ${days[1]} de chaque mois`;
    } else {
      resolvedJourPassage = days.map((d) => (d === 1 ? "1er" : d.toString())).join(", ");
    }

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

    // Détermination du matériel dominant
    const inferredTypeMateriel = inferTypeMateriel(contract.equipementsCouverts);

    const existingScheduled = contract.interventions
      .filter((i) => i.dateProgrammee !== null)
      .sort((a, b) => new Date(a.dateProgrammee!).getTime() - new Date(b.dateProgrammee!).getTime());

    // Détermination de l'action réelle si premier passage
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

    const createdTickets = [];
    let updatedTicketsCount = 0;
    let feedbackMessage = "";

    // -------------------------------------------------------------
    // CAS 1 : AJUSTEMENT DU PLANNING (Tickets non démarrés : futurs + passés ratés)
    // -------------------------------------------------------------
    if (effectiveAction === "AJUSTER") {
      // Sélection de tous les tickets encore à l'état NOUVEAU (y compris passés non réalisés)
      const untouchedTickets = existingScheduled
        .filter((t) => t.statut === InterventionStatut.NOUVEAU)
        .sort((a, b) => new Date(a.dateProgrammee!).getTime() - new Date(b.dateProgrammee!).getTime());

      if (untouchedTickets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Aucune intervention non démarrée à réajuster. Utilisez l'option 'Prolonger le contrat' pour planifier un nouveau cycle.",
          },
          { status: 400 }
        );
      }

      const now = new Date();
      let loopYear = now.getFullYear();
      let loopMonth = now.getMonth();
      const newDates: Date[] = [];
      const quotaToReschedule = untouchedTickets.length;

      // Calcul des nouvelles dates à partir d'aujourd'hui
      while (newDates.length < quotaToReschedule) {
        for (const day of days) {
          if (newDates.length >= quotaToReschedule) break;
          const candidateDate = new Date(loopYear, loopMonth, day, 9, 0, 0);
          if (candidateDate > now) {
            newDates.push(candidateDate);
          }
        }
        loopMonth++;
        if (loopMonth > 11) {
          loopMonth = 0;
          loopYear++;
        }
      }

      // MISE À JOUR en place des tickets (Zéro suppression, Zéro crash de clé étrangère)
      for (let i = 0; i < untouchedTickets.length; i++) {
        const ticket = untouchedTickets[i];
        const targetDate = newDates[i];

        await db.intervention.update({
          where: { id: ticket.id },
          data: {
            dateProgrammee: targetDate,
            technicienAssigneId:
              technicienAssigneId !== undefined
                ? technicienAssigneId || null
                : ticket.technicienAssigneId,
            checklistPrevue: checklistPrevue || ticket.checklistPrevue,
            typeMateriel: inferredTypeMateriel !== TypeMateriel.AUTRE ? inferredTypeMateriel : ticket.typeMateriel,
            historique: {
              create: {
                auteurId: (session.user as any).id,
                action: "Planning réajusté",
                note: `Date reprogrammée au ${format(targetDate, "dd/MM/yyyy", { locale: fr })} selon les nouveaux jours convenus (${resolvedJourPassage}).`,
              },
            },
          },
        });
        updatedTicketsCount++;
      }

      feedbackMessage = `Planning réajusté : ${updatedTicketsCount} intervention(s) reprogrammée(s) avec succès. Les interventions en cours/terminées et les factures existantes sont conservées.`;
    }

    // -------------------------------------------------------------
    // CAS 2 : PROLONGATION DU CONTRAT (+12 mois CDI ou durée CDD)
    // -------------------------------------------------------------
    else if (effectiveAction === "PROLONGER") {
      const lastTicketInContract = existingScheduled[existingScheduled.length - 1];
      const lastDate = lastTicketInContract?.dateProgrammee
        ? new Date(lastTicketInContract.dateProgrammee)
        : new Date();

      // Nouveau cycle commence le mois suivant la dernière date planifiée
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
      const visitDates: Date[] = [];

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
            typeMateriel: inferredTypeMateriel,
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

      feedbackMessage = `Contrat prolongé : ${createdTickets.length} nouvelles interventions planifiées (${contract.dateFin ? "Prolongation CDD de " + extensionMonths + " mois" : "Nouveau cycle CDI de 12 mois"}).`;
    }

    // -------------------------------------------------------------
    // CAS 3 : INITIALISATION (Première génération avec quota garanti)
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

      // Quota mathématiquement garanti (Règle 2-A)
      const quotaTotalVisites = totalMonths * freqNum;
      const visitDates: Date[] = [];
      let loopYear = startDate.getFullYear();
      let loopMonth = startDate.getMonth();

      while (visitDates.length < quotaTotalVisites) {
        for (const day of days) {
          if (visitDates.length >= quotaTotalVisites) break;
          const candidateDate = new Date(loopYear, loopMonth, day, 9, 0, 0);
          // N'inclure que les dates à partir de la date de début
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
            typeMateriel: inferredTypeMateriel,
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

      feedbackMessage = `${createdTickets.length} interventions programmées (${contract.dateFin ? "CDD de " + totalMonths + " mois" : "CDI — cycle initial de 12 mois"}).`;
    }

    // -------------------------------------------------------------
    // GÉNÉRATION DES FACTURES (Automatique en lot avec anti-doublon universel)
    // -------------------------------------------------------------
    let createdInvoicesCount = 0;
    if (
      (effectiveAction === "INITIAL" || effectiveAction === "PROLONGER") &&
      genererFactures &&
      contract.montantMainOeuvre > 0
    ) {
      const stepMonths = getStepMonths(contract.periodicite);
      const existingInvoices = await db.financialDocument.findMany({
        where: {
          contractId: contract.id,
          type: DocumentType.FACTURE,
          typeFacture: FactureType.CONTRAT,
        },
        select: { dateEmission: true, numero: true },
        orderBy: { dateEmission: "desc" },
      });

      let invoiceStartDate: Date;
      let targetPeriodsCount = 12 / stepMonths;

      if (effectiveAction === "PROLONGER" && existingInvoices.length > 0) {
        const lastInvDate = new Date(existingInvoices[0].dateEmission);
        invoiceStartDate = new Date(lastInvDate.getFullYear(), lastInvDate.getMonth() + stepMonths, 1);
        if (contract.dateFin) {
          const start = new Date(contract.dateDebut);
          const end = new Date(contract.dateFin);
          const origMonths = Math.max(
            1,
            (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
          );
          targetPeriodsCount = Math.max(1, Math.floor(origMonths / stepMonths));
        }
      } else {
        invoiceStartDate = new Date(contract.dateDebut);
        if (contract.dateFin) {
          const start = new Date(contract.dateDebut);
          const end = new Date(contract.dateFin);
          const diffMonths = Math.max(
            1,
            (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
          );
          targetPeriodsCount = Math.max(1, Math.floor(diffMonths / stepMonths));
        }
      }

      for (let i = 0; i < targetPeriodsCount; i++) {
        const periodStart = new Date(
          invoiceStartDate.getFullYear(),
          invoiceStartDate.getMonth() + i * stepMonths,
          1
        );

        // Si CDD, ne pas dépasser la date de fin
        if (contract.dateFin) {
          const endDate = new Date(contract.dateFin);
          if (periodStart > endDate) break;
        }

        // Vérification anti-doublon stricte sur la période
        const alreadyExists = isContractPeriodInvoiced(existingInvoices, periodStart, stepMonths);
        if (alreadyExists) continue;

        // Calcul de la date d'émission selon termeFacturation (ECHU vs A_ECHOIR)
        const emissionDate = calculateInvoiceEmissionDate(
          periodStart,
          stepMonths,
          contract.termeFacturation
        );

        const targetYear = emissionDate.getFullYear();
        const invNum = await generateDocumentNumber(DocumentType.FACTURE, targetYear);

        await db.financialDocument.create({
          data: {
            numero: invNum,
            type: DocumentType.FACTURE,
            typeFacture: FactureType.CONTRAT,
            contractId: contract.id,
            montant: contract.montantMainOeuvre,
            statutPaiement: StatutPaiement.EN_ATTENTE,
            dateEmission: emissionDate,
          },
        });

        createdInvoicesCount++;
      }
    }

    // Notification système
    await db.notification.create({
      data: {
        userId: (session.user as any).id,
        titre:
          effectiveAction === "AJUSTER"
            ? "Planning contrat réajusté"
            : "Tickets contractuels générés",
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
      updatedTicketsCount,
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

