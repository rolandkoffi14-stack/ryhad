import { Suspense } from "react";
import { InterventionRequestForm } from "@/components/site/InterventionRequestForm";
import { Wrench, Clock, ShieldCheck, MapPin } from "lucide-react";

export const metadata = {
  title: "Demande d'Intervention & Dépannage en Ligne",
  description:
    "Déposez votre demande de réparation informatique, biomédicale ou audiovisuelle. Obtenez immédiatement votre numéro de suivi de dossier.",
};

export default function DemandeInterventionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-blue-light text-brand-blue px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Wrench className="w-3.5 h-3.5 text-brand-green" />
          <span>Prise en charge Immédiate</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark">
          Formulaire de Demande d&apos;Intervention
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Renseignez les détails de la panne pour pré-enregistrer votre appareil. Un numéro unique vous sera attribué pour suivre l&apos;avancement en temps réel.
        </p>
      </div>

      {/* Info bar rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-brand-slate p-3.5 rounded-xl flex items-center gap-3 border border-gray-100">
          <MapPin className="w-5 h-5 text-brand-blue shrink-0" />
          <div>
            <span className="font-bold text-brand-dark block">Atelier Gbégamey</span>
            <span className="text-gray-500">Rue avant le collège Clé de la réussite</span>
          </div>
        </div>
        <div className="bg-brand-slate p-3.5 rounded-xl flex items-center gap-3 border border-gray-100">
          <Clock className="w-5 h-5 text-brand-green shrink-0" />
          <div>
            <span className="font-bold text-brand-dark block">Ouvert 9h00 – 20h00</span>
            <span className="text-gray-500">Du lundi au vendredi</span>
          </div>
        </div>
        <div className="bg-brand-slate p-3.5 rounded-xl flex items-center gap-3 border border-gray-100">
          <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0" />
          <div>
            <span className="font-bold text-brand-dark block">Devis avant travaux</span>
            <span className="text-gray-500">Aucun frais caché sans accord</span>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <Suspense fallback={<div className="text-center py-12">Chargement du formulaire...</div>}>
        <InterventionFormWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InterventionFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  return <InterventionRequestForm initialType={params.type} />;
}
