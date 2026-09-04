import { InterventionStatut } from "@prisma/client";
import { getCrmStatusLabel } from "@/lib/interventions/statut-transitions";

interface Props {
  statut: InterventionStatut;
  isPaid?: boolean;
  className?: string;
}

export function TicketStatusBadge({ statut, isPaid, className = "" }: Props) {
  const getBadgeStyle = (st: InterventionStatut) => {
    switch (st) {
      // 1. FAMILLE BLEU / INFO (Démarrage, Diagnostic en cours, Visite en cours)
      case InterventionStatut.NOUVEAU:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case InterventionStatut.EN_DIAGNOSTIC:
      case InterventionStatut.EN_INTERVENTION:
        return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";

      // 2. FAMILLE AMBRE / ATTENTION (Frais encaissés, Diagnostic fini, Devis en attente)
      case InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE:
      case InterventionStatut.DIAGNOSTIC_TERMINE:
      case InterventionStatut.DEVIS_ENVOYE:
        return "bg-amber-50 text-amber-800 border-amber-300 font-bold";

      // 3. FAMILLE ÉMERAUDE / SUCCÈS & EN COURS VALIDÉ (Devis accepté, Réparation active, Prêt)
      case InterventionStatut.DEVIS_ACCEPTE:
        return isPaid
          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
          : "bg-amber-50 text-amber-800 border-amber-300 font-bold";
      case InterventionStatut.EN_REPARATION:
        return "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
      case InterventionStatut.TERMINE:
        return "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold shadow-2xs";

      // 4. FAMILLE ROSE / ALERTE & REFUS (Devis refusé, incident)
      case InterventionStatut.DEVIS_REFUSE:
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";

      // 5. FAMILLE ARDOISE / NEUTRE (Clôturé, Archivé)
      case InterventionStatut.LIVRE_CLOTURE:
      case InterventionStatut.CLOTURE:
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getBadgeStyle(
        statut
      )} ${className}`}
    >
      {getCrmStatusLabel(statut, { isPaid })}
    </span>
  );
}
