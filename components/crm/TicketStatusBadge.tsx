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
      case InterventionStatut.NOUVEAU:
        return "bg-blue-50 text-brand-blue border-brand-blue/30";
      case InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE:
        return "bg-amber-50 text-amber-700 border-amber-300";
      case InterventionStatut.EN_DIAGNOSTIC:
        return "bg-purple-50 text-purple-700 border-purple-300";
      case InterventionStatut.DIAGNOSTIC_TERMINE:
        return "bg-amber-100 text-amber-900 border-amber-400 font-extrabold";
      case InterventionStatut.DEVIS_ENVOYE:
        return "bg-cyan-50 text-cyan-700 border-cyan-300";
      case InterventionStatut.DEVIS_ACCEPTE:
        return isPaid
          ? "bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold shadow-2xs"
          : "bg-amber-50 text-amber-800 border-amber-300 font-extrabold";
      case InterventionStatut.DEVIS_REFUSE:
        return "bg-red-50 text-red-700 border-red-300 font-bold";
      case InterventionStatut.EN_REPARATION:
      case InterventionStatut.EN_INTERVENTION:
        return "bg-indigo-50 text-indigo-700 border-indigo-300";
      case InterventionStatut.TERMINE:
        return "bg-brand-green-light text-brand-green-dark border-brand-green/40 font-extrabold";
      case InterventionStatut.LIVRE_CLOTURE:
      case InterventionStatut.CLOTURE:
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
