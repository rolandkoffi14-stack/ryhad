import { InterventionType, InterventionStatut } from "@prisma/client";

// Parcours Ponctuel : cycle complet avec diagnostic et devis
export const PARCOURS_PONCTUEL_SEQUENCE: InterventionStatut[] = [
  InterventionStatut.NOUVEAU,
  InterventionStatut.EN_DIAGNOSTIC,
  InterventionStatut.DIAGNOSTIC_TERMINE,
  InterventionStatut.DEVIS_ENVOYE,
  InterventionStatut.DEVIS_ACCEPTE,
  InterventionStatut.EN_REPARATION,
  InterventionStatut.TERMINE,
  InterventionStatut.LIVRE_CLOTURE,
];

// Parcours Contractuel : cycle direct sans frais de diagnostic ni devis sauf si pièces
export const PARCOURS_CONTRACTUEL_SEQUENCE: InterventionStatut[] = [
  InterventionStatut.NOUVEAU,
  InterventionStatut.EN_DIAGNOSTIC,
  InterventionStatut.EN_INTERVENTION,
  InterventionStatut.TERMINE,
  InterventionStatut.CLOTURE,
];

/**
 * Retourne les prochains statuts autorisés selon le type d'intervention et le statut actuel.
 */
export function getStatutsAutorises(
  type: InterventionType,
  statutActuel: InterventionStatut,
  options?: { hasPieces?: boolean; hasMainOeuvre?: boolean }
): InterventionStatut[] {
  if (type === InterventionType.PONCTUEL) {
    switch (statutActuel) {
      case InterventionStatut.NOUVEAU:
      case InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE:
        return [InterventionStatut.EN_DIAGNOSTIC];
      case InterventionStatut.EN_DIAGNOSTIC:
        // Si chiffrage présent (pièces ou main d'œuvre) : Émettre le Devis. Sinon : Terminer sans Réparation
        if (options?.hasPieces || options?.hasMainOeuvre) {
          return [InterventionStatut.DIAGNOSTIC_TERMINE];
        }
        return [InterventionStatut.TERMINE];
      case InterventionStatut.DIAGNOSTIC_TERMINE:
        return [InterventionStatut.DEVIS_ENVOYE];
      case InterventionStatut.DEVIS_ENVOYE:
        return [InterventionStatut.DEVIS_ACCEPTE, InterventionStatut.DEVIS_REFUSE];
      case InterventionStatut.DEVIS_ACCEPTE:
        return [InterventionStatut.EN_REPARATION];
      case InterventionStatut.DEVIS_REFUSE:
        return [InterventionStatut.LIVRE_CLOTURE];
      case InterventionStatut.EN_REPARATION:
        return [InterventionStatut.TERMINE];
      case InterventionStatut.TERMINE:
        return [InterventionStatut.LIVRE_CLOTURE];
      case InterventionStatut.LIVRE_CLOTURE:
        return [];
      default:
        return [];
    }
  } else if (type === InterventionType.CONTRACTUEL) {
    switch (statutActuel) {
      case InterventionStatut.NOUVEAU:
        return [InterventionStatut.EN_INTERVENTION];
      case InterventionStatut.EN_INTERVENTION:
      case InterventionStatut.EN_DIAGNOSTIC:
        // Si pièces ajoutées : Émettre Devis Pièces. Sinon : Terminer directement
        if (options?.hasPieces) {
          return [InterventionStatut.DIAGNOSTIC_TERMINE];
        }
        return [InterventionStatut.TERMINE];
      case InterventionStatut.DIAGNOSTIC_TERMINE:
        return [InterventionStatut.DEVIS_ENVOYE];
      case InterventionStatut.DEVIS_ENVOYE:
        return [InterventionStatut.DEVIS_ACCEPTE, InterventionStatut.DEVIS_REFUSE];
      case InterventionStatut.DEVIS_ACCEPTE:
        return [InterventionStatut.EN_REPARATION];
      case InterventionStatut.DEVIS_REFUSE:
        return [InterventionStatut.CLOTURE];
      case InterventionStatut.EN_REPARATION:
        return [InterventionStatut.TERMINE];
      case InterventionStatut.TERMINE:
        return [InterventionStatut.CLOTURE];
      case InterventionStatut.CLOTURE:
        return [];
      default:
        return [];
    }
  }
  return [];
}

/**
 * Libellé compréhensible pour le suivi public (sans jargon ni données financières)
 */
export function getPublicStatusInfo(
  statut: InterventionStatut,
  options?: { isPaid?: boolean }
): {
  label: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  isComplete: boolean;
} {
  switch (statut) {
    case InterventionStatut.NOUVEAU:
      return {
        label: "Demande reçue",
        description: "Votre demande a bien été enregistrée et est en attente de prise en charge par l'atelier.",
        stepIndex: 1,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE:
      return {
        label: "Frais réglés (En attente diag.)",
        description: "Les frais de diagnostic ont été encaissés. Votre appareil est en file d'attente pour être pris en charge par le technicien.",
        stepIndex: 2,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.EN_DIAGNOSTIC:
      return {
        label: "Diagnostic en cours",
        description: "Notre technicien spécialisé analyse l'appareil pour identifier l'origine exacte de la panne.",
        stepIndex: 2,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.DIAGNOSTIC_TERMINE:
      return {
        label: "Diagnostic terminé",
        description: "L'expertise technique est achevée. Le devis est en cours de préparation par la réception.",
        stepIndex: 2,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.DEVIS_ENVOYE:
      return {
        label: "Devis émis",
        description: "Le diagnostic est terminé et le devis détaillé vous a été transmis. En attente de votre accord.",
        stepIndex: 3,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.DEVIS_ACCEPTE:
      return {
        label: options?.isPaid ? "Facture Encaissée" : "Devis validé (En attente règlement)",
        description: options?.isPaid
          ? "Règlement confirmé. Vos équipements sont pris en charge par nos techniciens pour les réparations."
          : "Vous avez accepté le devis. Facture émise en attente de confirmation de règlement.",
        stepIndex: 3,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.DEVIS_REFUSE:
      return {
        label: "Devis refusé",
        description: "Vous avez décliné la proposition de réparation. Votre matériel est disponible pour retrait.",
        stepIndex: 3,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.EN_REPARATION:
    case InterventionStatut.EN_INTERVENTION:
      return {
        label: "Réparation en cours",
        description: "Nos techniciens procèdent au dépannage et au remplacement des pièces nécessaires.",
        stepIndex: 4,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.TERMINE:
      return {
        label: "Prêt à être récupéré",
        description: "Les tests de bon fonctionnement ont été validés avec succès. Votre matériel est disponible à l'atelier.",
        stepIndex: 5,
        totalSteps: 6,
        isComplete: false,
      };
    case InterventionStatut.LIVRE_CLOTURE:
    case InterventionStatut.CLOTURE:
      return {
        label: "Dossier clôturé / Restitué",
        description: "L'intervention est finalisée et le matériel a été remis.",
        stepIndex: 6,
        totalSteps: 6,
        isComplete: true,
      };
    default:
      return {
        label: "Traitement en cours",
        description: "Intervention en cours de traitement par notre équipe technique.",
        stepIndex: 1,
        totalSteps: 6,
        isComplete: false,
      };
  }
}

/**
 * Libellé technique pour le CRM avec prise en compte du paiement
 */
export function getCrmStatusLabel(
  statut: InterventionStatut,
  options?: { isPaid?: boolean }
): string {
  switch (statut) {
    case InterventionStatut.NOUVEAU:
      return "Nouveau";
    case InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE:
      return "Diag. Payé (Prêt à diagnostiquer)";
    case InterventionStatut.EN_DIAGNOSTIC:
      return "En diagnostic";
    case InterventionStatut.DIAGNOSTIC_TERMINE:
      return "Diag. terminé";
    case InterventionStatut.DEVIS_ENVOYE:
      return "Devis envoyé";
    case InterventionStatut.DEVIS_ACCEPTE:
      return options?.isPaid ? "Facture Encaissée" : "Devis Accepté (À encaisser)";
    case InterventionStatut.DEVIS_REFUSE:
      return "Devis refusé";
    case InterventionStatut.EN_REPARATION:
      return "En réparation";
    case InterventionStatut.EN_INTERVENTION:
      return "En intervention";
    case InterventionStatut.TERMINE:
      return "Terminé";
    case InterventionStatut.LIVRE_CLOTURE:
      return "Livré / Clôturé";
    case InterventionStatut.CLOTURE:
      return "Clôturé";
    default:
      return statut;
  }
}

/**
 * Libellé court et direct pour les boutons d'action du CRM
 */
export function getCrmActionLabel(
  statut: InterventionStatut,
  type?: InterventionType,
  currentStatut?: InterventionStatut
): string {
  switch (statut) {
    case InterventionStatut.EN_DIAGNOSTIC:
      return "Démarrer Diagnostic";
    case InterventionStatut.EN_INTERVENTION:
      return "Démarrer Intervention";
    case InterventionStatut.DIAGNOSTIC_TERMINE:
      return type === InterventionType.CONTRACTUEL ? "Émettre Devis Pièces" : "Émettre le Devis";
    case InterventionStatut.DEVIS_ENVOYE:
      return "Envoyer Devis";
    case InterventionStatut.DEVIS_ACCEPTE:
      return "Valider Accord";
    case InterventionStatut.DEVIS_REFUSE:
      return "Refuser Devis";
    case InterventionStatut.EN_REPARATION:
      return "Démarrer Réparation";
    case InterventionStatut.TERMINE:
      if (type === InterventionType.CONTRACTUEL) return "Terminer Intervention";
      if (currentStatut === InterventionStatut.EN_DIAGNOSTIC) return "Terminer sans Réparation";
      return "Terminer Réparation";
    case InterventionStatut.LIVRE_CLOTURE:
      return "Livrer & Clôturer";
    case InterventionStatut.CLOTURE:
      return "Clôturer Dossier";
    default:
      return getCrmStatusLabel(statut);
  }
}
