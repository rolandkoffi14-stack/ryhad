import { FAQAccordion } from "@/components/site/FAQAccordion";
import { HelpCircle } from "lucide-react";

export const metadata = {
  title: "Foire Aux Questions (FAQ) | RyHaD Tic-Medic Cotonou",
  description:
    "Retrouvez toutes les réponses à vos questions : déroulement du diagnostic, délais, tarifs, garanties, contrats de maintenance entreprises, matériel biomédical et audiovisuel à Cotonou.",
};

export default function FAQPage() {
  return (
    <div className="space-y-12 py-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-green-light text-brand-green-dark px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-brand-green" />
            <span>Foire Aux Questions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark">
            Toutes les Réponses à Vos Questions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Fonctionnement de l&apos;atelier, diagnostic, contrats de maintenance, garanties et modalités de prise en charge à Cotonou.
          </p>
        </div>
      </section>

      {/* Accordéon & Recherche FAQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <FAQAccordion />
      </section>
    </div>
  );
}
