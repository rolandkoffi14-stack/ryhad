import { TicketTracker } from "@/components/site/TicketTracker";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export const metadata = {
  title: "Détail du Suivi de Dossier",
  description: "État d'avancement de votre réparation chez RyHaD Tic-Medic.",
};

export default async function SuiviDetailPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link
          href="/suivi"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-green transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rechercher un autre numéro</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
          Dossier de Suivi : <span className="text-brand-blue">{numero.toUpperCase()}</span>
        </h1>
      </div>

      <TicketTracker initialNumero={numero} />
    </div>
  );
}
