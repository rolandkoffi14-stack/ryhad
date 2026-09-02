import { TicketTracker } from "@/components/site/TicketTracker";
import { Search, ShieldCheck, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Suivre ma Réparation en Direct",
  description:
    "Consultez l'état d'avancement de votre réparation informatique, biomédicale ou audiovisuelle en temps réel sans authentification.",
};

export default function SuiviLandingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-blue-light text-brand-blue px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Search className="w-3.5 h-3.5 text-brand-green" />
          <span>Espace Suivi Public</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark">
          Suivre l&apos;État de Votre Réparation
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Saisissez la référence unique de votre dossier (ex: <strong>INT-2026-0001</strong>) reçue lors de votre dépôt en atelier ou par SMS/Email.
        </p>
      </div>

      {/* Tracker Search & Display */}
      <TicketTracker />

      {/* Badges de transparence */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-xs">
        <div className="p-4 rounded-xl bg-brand-slate border border-gray-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-brand-dark block">Accès Simple & Sécurisé</span>
            <p className="text-gray-500 mt-0.5">Pas besoin de mot de passe, votre numéro de ticket suffit.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-slate border border-gray-100 flex items-start gap-3">
          <Clock className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-brand-dark block">Mises à jour en direct</span>
            <p className="text-gray-500 mt-0.5">Chaque diagnostic et test est actualisé en temps réel.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-slate border border-gray-100 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-brand-dark block">Notification de fin</span>
            <p className="text-gray-500 mt-0.5">Vous savez immédiatement dès que votre matériel est prêt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
