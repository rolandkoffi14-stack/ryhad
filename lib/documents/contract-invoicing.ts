import { TermeFacturation, Periodicite } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Calcule le nombre de mois par période selon la périodicité du contrat.
 */
export function getStepMonths(periodicite: Periodicite | string): number {
  if (periodicite === "TRIMESTRIEL") return 3;
  if (periodicite === "ANNUEL") return 12;
  return 1; // MENSUEL par défaut
}

/**
 * Calcule la date d'émission exacte selon le terme de facturation :
 * - A_ECHOIR : Premier jour de la période (au début des prestations)
 * - ECHU : Dernier jour de la période (après réalisation des interventions du cycle)
 */
export function calculateInvoiceEmissionDate(
  periodStartDate: Date,
  stepMonths: number,
  terme: TermeFacturation | "ECHU" | "A_ECHOIR"
): Date {
  const year = periodStartDate.getFullYear();
  const month = periodStartDate.getMonth();
  const day = periodStartDate.getDate();

  if (terme === TermeFacturation.ECHU) {
    // Dernier jour du cycle de facturation
    // Si mensuel (stepMonths = 1) : dernier jour du mois
    // Si trimestriel (stepMonths = 3) : dernier jour du 3ème mois
    const targetMonth = month + stepMonths;
    const lastDayOfPeriod = new Date(year, targetMonth, 0, 17, 0, 0);
    return lastDayOfPeriod;
  }

  // A_ECHOIR : Premier jour de la période
  return new Date(year, month, Math.min(day, 28), 9, 0, 0);
}

/**
 * Vérifie si une facture a déjà été émise pour une période donnée sur ce contrat.
 */
export function isContractPeriodInvoiced(
  existingInvoices: { dateEmission: Date | string }[],
  periodStartDate: Date,
  stepMonths: number
): boolean {
  const targetYear = periodStartDate.getFullYear();
  const targetMonth = periodStartDate.getMonth();

  return existingInvoices.some((inv) => {
    const d = new Date(inv.dateEmission);
    const invYear = d.getFullYear();
    const invMonth = d.getMonth();

    if (stepMonths === 1) {
      // Mensuel : Même mois et même année
      return invYear === targetYear && invMonth === targetMonth;
    }

    if (stepMonths === 3) {
      // Trimestriel : Même trimestre et même année
      const targetQuarter = Math.floor(targetMonth / 3);
      const invQuarter = Math.floor(invMonth / 3);
      return invYear === targetYear && invQuarter === targetQuarter;
    }

    if (stepMonths === 12) {
      // Annuel : Même année
      return invYear === targetYear;
    }

    return false;
  });
}

/**
 * Trouve la prochaine période non facturée pour un contrat.
 */
export function getNextUnbilledContractPeriod(
  contract: {
    dateDebut: Date | string;
    dateFin?: Date | string | null;
    periodicite: Periodicite | string;
    termeFacturation?: TermeFacturation | string | null;
  },
  existingInvoices: { dateEmission: Date | string; numero: string }[]
): {
  periodStartDate: Date;
  emissionDate: Date;
  periodLabel: string;
} | null {
  const startDate = new Date(contract.dateDebut);
  const stepMonths = getStepMonths(contract.periodicite);
  const terme = contract.termeFacturation || TermeFacturation.ECHU;

  // Calcul du nombre maximum de périodes selon CDD ou horizon 1 an CDI
  let maxPeriods = 12 / stepMonths;
  if (contract.dateFin) {
    const endDate = new Date(contract.dateFin);
    const totalMonths = Math.max(
      1,
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
    );
    maxPeriods = Math.max(1, Math.ceil(totalMonths / stepMonths));
  } else {
    // Si CDI et qu'on a déjà facturé 12 périodes, on peut continuer d'avancer
    maxPeriods = Math.max(12 / stepMonths, existingInvoices.length + 1);
  }

  for (let i = 0; i < maxPeriods + 1; i++) {
    const periodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i * stepMonths, 1);
    
    // Si CDD, ne pas dépasser la date de fin
    if (contract.dateFin) {
      const endDate = new Date(contract.dateFin);
      if (periodStart > endDate) break;
    }

    const alreadyBilled = isContractPeriodInvoiced(existingInvoices, periodStart, stepMonths);
    if (!alreadyBilled) {
      const emissionDate = calculateInvoiceEmissionDate(periodStart, stepMonths, terme as any);
      let periodLabel = "";
      if (stepMonths === 1) {
        periodLabel = format(periodStart, "MMMM yyyy", { locale: fr });
      } else if (stepMonths === 3) {
        const quarter = Math.floor(periodStart.getMonth() / 3) + 1;
        periodLabel = `T${quarter} ${periodStart.getFullYear()}`;
      } else {
        periodLabel = `Année ${periodStart.getFullYear()}`;
      }

      return {
        periodStartDate: periodStart,
        emissionDate,
        periodLabel,
      };
    }
  }

  return null;
}
