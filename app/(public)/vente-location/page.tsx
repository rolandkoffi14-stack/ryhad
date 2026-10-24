import { Suspense } from "react";
import { CommercialRequestForm } from "@/components/site/CommercialRequestForm";
import { ShoppingBag, Tv, GraduationCap, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Vente de Matériel & Location de Vidéoprojecteurs",
  description:
    "Achat d'ordinateurs et composants garantis, location de vidéoprojecteurs haute luminosité pour événements et formations techniques à Cotonou.",
};

export default function VenteLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <div className="space-y-12 py-10">
      {/* En-tête de page */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-brand-blue via-brand-blue-dark to-brand-dark text-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-blue-light/20 text-brand-blue-light px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vente • Location • Formations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Vente de Matériel & Location de Vidéoprojecteurs
            </h1>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-normal">
              RyHaD Tic-Medic met à votre disposition des équipements informatiques testés et garantis, des solutions de projection audiovisuelle pour vos événements et des programmes de formation pratique à Cotonou.
            </p>
          </div>
        </div>
      </section>

      {/* Les 3 Pôles Commerciaux */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pôle 1 : Vente de matériel */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-brand-dark">Vente d&apos;Équipements & Pièces</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                PC portables professionnels reconditionnés ou neufs (Dell, HP, Lenovo), unités fixes, disques SSD rapides, mémoire RAM, chargeurs d&apos;origine et consommables médicaux.
              </p>
              <ul className="space-y-2 text-xs text-gray-700 pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Matériel testé & pièces d&apos;origine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Garantie directe atelier RyHaD</span>
                </li>
              </ul>
            </div>
            <a
              href="#formulaire"
              className="inline-flex items-center justify-center gap-2 bg-brand-slate hover:bg-gray-200 text-brand-dark font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              <span>Demander un devis matériel</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
            </a>
          </div>

          {/* Pôle 2 : Location de vidéoprojecteurs */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center">
                <Tv className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-brand-dark">Location de Vidéoprojecteurs</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Appareils forte luminosité (3 500 à 5 000 lumens) pour séminaires, conférences, soutenances et événements d&apos;entreprise avec écrans sur pied et connectiques HDMI.
              </p>
              <ul className="space-y-2 text-xs text-gray-700 pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Mise à disposition rapide à Cotonou</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Assistance au branchement & test</span>
                </li>
              </ul>
            </div>
            <a
              href="#formulaire"
              className="inline-flex items-center justify-center gap-2 bg-brand-slate hover:bg-gray-200 text-brand-dark font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              <span>Réserver un vidéoprojecteur</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
            </a>
          </div>

          {/* Pôle 3 : Formations techniques */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-brand-dark">Formations Pratiques & IT</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Modules de formation professionnelle en maintenance informatique (diagnostic panne, remplacement composants, microsoudure) et fondamentaux des réseaux locaux.
              </p>
              <ul className="space-y-2 text-xs text-gray-700 pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Ateliers 100% pratiques en laboratoire</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Encadrement par techniciens d&apos;atelier</span>
                </li>
              </ul>
            </div>
            <a
              href="#formulaire"
              className="inline-flex items-center justify-center gap-2 bg-brand-slate hover:bg-gray-200 text-brand-dark font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              <span>S&apos;inscrire à une formation</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
            </a>
          </div>
        </div>
      </section>

      {/* Formulaire de demande commerciale */}
      <section id="formulaire" className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-6 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
            Formulaire de Demande Commerciale
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Précisez votre demande ci-dessous. Notre équipe commerciale vous répond sous 24h ouvrées avec une offre détaillée.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-sm text-gray-500">Chargement du formulaire...</div>}>
          <CommercialFormWrapper searchParams={searchParams} />
        </Suspense>
      </section>
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
