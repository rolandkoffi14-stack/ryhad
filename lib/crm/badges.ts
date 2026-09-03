import { cache } from "react";
import { db } from "@/lib/db";
import { StaffRole, InterventionStatut, DemandeStatut, StatutPaiement, InterventionType } from "@prisma/client";

export interface UrgentBadgeCounts {
  ticketsPonctuel: number;
  ticketsContractuel: number;
  documents: number;
  demandesCommerciales: number;
  contrats: number;
}

export const getUrgentBadgeCounts = cache(async (user: { id: string; role: StaffRole }): Promise<UrgentBadgeCounts> => {
  try {
    const isTech = user.role === StaffRole.TECHNICIEN;

    // 1. Where clause Tickets Ponctuels urgents
    const ponctuelWhere: any = {
      type: InterventionType.PONCTUEL,
    };

    if (isTech) {
      ponctuelWhere.technicienAssigneId = user.id;
      ponctuelWhere.statut = {
        in: [
          InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE,
          InterventionStatut.EN_DIAGNOSTIC,
          InterventionStatut.EN_REPARATION,
        ],
      };
    } else {
      ponctuelWhere.statut = {
        in: [
          InterventionStatut.NOUVEAU,
          InterventionStatut.DIAGNOSTIC_TERMINE,
          InterventionStatut.DEVIS_ACCEPTE,
          InterventionStatut.TERMINE,
        ],
      };
    }

    // 2. Where clause Tickets Contractuels urgents
    const contractuelWhere: any = {
      type: InterventionType.CONTRACTUEL,
    };

    if (isTech) {
      contractuelWhere.technicienAssigneId = user.id;
      contractuelWhere.statut = {
        in: [
          InterventionStatut.NOUVEAU,
          InterventionStatut.EN_INTERVENTION,
          InterventionStatut.EN_REPARATION,
        ],
      };
    } else {
      contractuelWhere.statut = {
        in: [
          InterventionStatut.NOUVEAU,
          InterventionStatut.DEVIS_ENVOYE,
          InterventionStatut.TERMINE,
        ],
      };
    }

    // Exécution SIMULTANÉE en parallèle des 4 comptages (gain immédiat de 300 à 600ms)
    const [ticketsPonctuelCount, ticketsContractuelCount, documentsCount, demandesCount] =
      await Promise.all([
        db.intervention.count({ where: ponctuelWhere }),
        db.intervention.count({ where: contractuelWhere }),
        db.financialDocument.count({
          where: {
            type: { not: "DEVIS" },
            statutPaiement: { in: [StatutPaiement.EN_ATTENTE, StatutPaiement.PARTIEL] },
          },
        }),
        db.demandeCommerciale.count({
          where: { statut: DemandeStatut.NOUVEAU },
        }),
      ]);

    return {
      ticketsPonctuel: ticketsPonctuelCount,
      ticketsContractuel: ticketsContractuelCount,
      documents: documentsCount,
      demandesCommerciales: demandesCount,
      contrats: 0,
    };
  } catch (error) {
    console.error("Error computing urgent badge counts:", error);
    return {
      ticketsPonctuel: 0,
      ticketsContractuel: 0,
      documents: 0,
      demandesCommerciales: 0,
      contrats: 0,
    };
  }
});
