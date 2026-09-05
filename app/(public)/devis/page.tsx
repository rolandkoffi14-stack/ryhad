import { Suspense } from "react";
import { CommercialRequestForm } from "@/components/site/CommercialRequestForm";
import { ShoppingBag, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Demande de Devis",
  description:
    "Obtenez un devis rapide pour l'achat de matériel informatique, la location de vidéoprojecteurs ou des formations techniques à Cotonou.",
};

export default function DevisPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-green-light text-brand-green-dark px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vente • Location • Formation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark">
          Demande de Devis Commercial
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Remplissez ce formulaire pour vos besoins d&apos;achat de matériel garanti, de location pour un événement ou de formation d&apos;équipe.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-brand-slate border border-gray-100 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>Réponse sous 24h ouvrées</span>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-slate border border-gray-100 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
          <span>Matériel certifié & garanti</span>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-slate border border-gray-100 flex items-center gap-2.5">
          <ShoppingBag className="w-4 h-4 text-brand-green shrink-0" />
          <span>Tarifs dégressifs pour parcs</span>
        </div>
      </div>

      {/* Formulaire */}
      <Suspense fallback={<div className="text-center py-12">Chargement du formulaire...</div>}>
        <CommercialFormWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CommercialFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  return <CommercialRequestForm initialType={params.type} />;
}
