"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  Wrench,
  Building2,
  Activity,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface FAQItem {
  id: string;
  category: string;
  categoryLabel: string;
  icon: any;
  question: string;
  answer: string;
  highlight?: string;
}

const FAQ_DATA: FAQItem[] = [
  // 1. Dépôt & Diagnostic
  {
    id: "diag-1",
    category: "diagnostic",
    categoryLabel: "Dépôt & Diagnostic",
    icon: Wrench,
    question: "Comment se déroule le dépôt d'un équipement à l'atelier ?",
    answer:
      "Vous pouvez déposer votre appareil directement à notre atelier de Gbégamey à Cotonou (du Lundi au Vendredi, de 9h à 20h), ou initier votre demande en ligne pour gagner du temps. Dès la réception, une fiche d'intervention officielle vous est remise avec un numéro de suivi unique (ex: INT-2026-XXXX).",
    highlight: "Un reçu officiel avec numéro de dossier vous est remis au comptoir.",
  },
  {
    id: "diag-2",
    category: "diagnostic",
    categoryLabel: "Dépôt & Diagnostic",
    icon: Wrench,
    question: "Quels sont les frais et délais du diagnostic technique ?",
    answer:
      "Le diagnostic standard est facturé à partir de 1 000 FCFA lors du dépôt. Nos techniciens procèdent à une batterie complète de tests électroniques, optiques et logiciels sous 24 à 48 heures ouvrées pour identifier avec certitude l'origine de la panne.",
    highlight: "Délai moyen de diagnostic : 24h à 48h.",
  },
  {
    id: "diag-3",
    category: "diagnostic",
    categoryLabel: "Dépôt & Diagnostic",
    icon: Wrench,
    question: "Comment suivre l'avancement de ma réparation sans appeler ?",
    answer:
      "Grâce à notre plateforme en ligne, rendez-vous dans la section 'Suivi Réparation' et saisissez votre numéro de ticket (ex: INT-2026-XXXX) ainsi que les 4 derniers chiffres de votre téléphone. Vous aurez accès en direct au statut (Reçu, En diagnostic, Devis émis, En réparation, Prêt au retrait) et au rapport technique.",
  },

  // 2. Contrats Entreprises
  {
    id: "ent-1",
    category: "entreprises",
    categoryLabel: "Entreprises & PME",
    icon: Building2,
    question: "Quels types de contrats de maintenance proposez-vous aux entreprises ?",
    answer:
      "Nous proposons des contrats de maintenance préventive et curative sur-mesure (mensuelle, trimestrielle ou semestrielle). Le contrat couvre la visite périodique de contrôle de l'ensemble de votre parc (ordinateurs, serveurs, réseaux, imprimantes, onduleurs) ainsi que la main d'œuvre illimitée lors des urgences sur site.",
    highlight: "Main d'œuvre 100% incluse pour les interventions sous contrat.",
  },
  {
    id: "ent-2",
    category: "entreprises",
    categoryLabel: "Entreprises & PME",
    icon: Building2,
    question: "Vos techniciens se déplacent-ils dans nos locaux à Cotonou et ses environs ?",
    answer:
      "Oui, nos équipes d'ingénieurs et techniciens interviennent sur site pour les entreprises, cliniques, écoles et administrations à Cotonou, Calavi, Porto-Novo et dans tout le Bénin selon les modalités convenues.",
  },
  {
    id: "ent-3",
    category: "entreprises",
    categoryLabel: "Entreprises & PME",
    icon: Building2,
    question: "Comment obtenir un devis personnalisé pour notre parc informatique ?",
    answer:
      "Vous pouvez faire une demande directement sur notre formulaire de devis commercial en ligne ou contacter nos conseillers. Un audit technique initial de votre parc est réalisé afin de calibrer une offre tarifaire juste et avantageuse.",
  },

  // 3. Biomédical & Équipements Spécifiques
  {
    id: "bio-1",
    category: "specialise",
    categoryLabel: "Biomédical & Audiovisuel",
    icon: Activity,
    question: "Quels dispositifs médicaux prenez-vous en charge ?",
    answer:
      "Notre pôle biomédical intervient sur la maintenance préventive, la calibration, le contrôle de conformité et le dépannage de moniteurs multiparamétriques, concentrateurs d'oxygène, ECG, centrifugeuses de laboratoire, négatoscopes, tables d'examen et stérilisateurs autoclaves pour cliniques et centres de santé.",
    highlight: "Interventions conformes aux normes strictes de sécurité hospitalière.",
  },
  {
    id: "bio-2",
    category: "specialise",
    categoryLabel: "Biomédical & Audiovisuel",
    icon: Activity,
    question: "Prenez-vous en charge les vidéoprojecteurs, Smart TV et matériel topographique ?",
    answer:
      "Oui ! Nous réparons les vidéoprojecteurs toutes marques (remplacement lampe, ballast, carte mère, roue chromatique, prisme LCD), les téléviseurs Smart/LED (rétroéclairage, alimentation, carte T-Con) ainsi que les équipements de topographie (niveaux optiques, théodolites, stations totales).",
  },

  // 4. Garantie & Pièces Détachées
  {
    id: "gar-1",
    category: "garantie",
    categoryLabel: "Garantie & Qualité",
    icon: ShieldCheck,
    question: "Les réparations et pièces détachées sont-elles garanties ?",
    answer:
      "Absolument. Toutes nos interventions font l'objet d'une garantie technique de 1 à 6 mois selon la nature de l'opération. En cas de récidive du problème diagnostiqué pendant la période de garantie, la prise en charge est prioritaire et sans frais supplémentaires.",
    highlight: "Garantie écrite mentionnée sur votre facture officielle.",
  },
  {
    id: "gar-2",
    category: "garantie",
    categoryLabel: "Garantie & Qualité",
    icon: ShieldCheck,
    question: "Les pièces de rechange utilisées sont-elles neuves et de qualité ?",
    answer:
      "Nous nous approvisionnons exclusivement auprès de fournisseurs certifiés pour des pièces neuves et conformes aux spécifications constructeurs (écrans d'origine, batteries haute capacité certifiées, blocs d'alimentation stabilisés).",
  },
  {
    id: "gar-3",
    category: "garantie",
    categoryLabel: "Garantie & Qualité",
    icon: ShieldCheck,
    question: "Que se passe-t-il si un appareil n'est pas réparable ?",
    answer:
      "Si après diagnostic approfondi les dégâts sur la carte mère sont irréversibles ou si le coût de réparation dépasse la valeur de l'équipement, nous vous conseillons en toute honnêteté de ne pas engager de frais inutiles. Seuls les frais initiaux de diagnostic restent acquis.",
  },

  // 5. Vente, Location & Modalités de Paiement
  {
    id: "pai-1",
    category: "paiement",
    categoryLabel: "Paiement & Vente",
    icon: CreditCard,
    question: "Quels sont les modes de paiement acceptés à l'atelier ?",
    answer:
      "Nous acceptons les règlements en espèces au comptoir, par Mobile Money (MTN MoMo, Moov Money, Wave, Celtiis Cash) ainsi que par virement bancaire ou chèque pour les entreprises et institutions. Une facture officielle certifiée vous est systématiquement transmise.",
  },
  {
    id: "pai-2",
    category: "paiement",
    categoryLabel: "Paiement & Vente",
    icon: CreditCard,
    question: "Proposez-vous la location de vidéoprojecteurs pour conférences ou événements ?",
    answer:
      "Oui, nous disposons d'un parc de vidéoprojecteurs haute luminosité (Full HD, 3500+ lumens) et d'écrans de projection disponibles à la location journalière ou hebdomadaire pour vos conférences, formations et cérémonies à Cotonou.",
    highlight: "Livraison, installation et câblage disponibles sur demande.",
  },
];

const CATEGORIES = [
  { id: "ALL", label: "Toutes les questions" },
  { id: "diagnostic", label: "Dépôt & Diagnostic" },
  { id: "entreprises", label: "Contrats Entreprises" },
  { id: "specialise", label: "Biomédical & Audiovisuel" },
  { id: "garantie", label: "Garantie & Qualité" },
  { id: "paiement", label: "Vente & Paiement" },
];

export function FAQAccordion() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "diag-1": true, // premier item ouvert par défaut
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Barre de recherche & Filtres de catégorie */}
      <div className="space-y-4">
        {/* Recherche texte */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une question (diagnostic, garantie, vidéoprojecteur, contrat...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-brand-dark"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Filtres par boutons de catégories */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs pt-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-brand-blue text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des Questions / Réponses */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filteredItems.map((item) => {
          const isOpen = !!openItems[item.id];
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-white border-brand-blue/30 shadow-md ring-1 ring-brand-blue/10"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-brand-blue text-white"
                        : "bg-brand-slate text-brand-blue"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-green block mb-1">
                      {item.categoryLabel}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-brand-dark leading-snug">
                      {item.question}
                    </h2>
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? "rotate-180 bg-brand-slate text-brand-blue"
                      : "text-gray-400 bg-gray-50"
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-6 pt-1 sm:px-6 sm:pb-6 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100/80 space-y-3 bg-brand-slate/20">
                  <p>{item.answer}</p>
                  {item.highlight && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                      <span>{item.highlight}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300 space-y-3">
            <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-brand-dark">
              Aucune question ne correspond à votre recherche
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Vous avez une question spécifique qui ne figure pas ici ? Notre équipe technique vous répond directement.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
              >
                <span>Poser une question via le formulaire de contact</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bloc CTA Bas de page */}
      <div className="max-w-3xl mx-auto bg-brand-blue text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-lg font-bold">Vous avez un appareil en panne ?</h3>
          <p className="text-xs text-brand-blue-light/90 max-w-md">
            Déposez votre demande d&apos;intervention en ligne et obtenez un numéro de suivi immédiat pour accélérer votre prise en charge.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/demande-intervention"
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>Déposer un appareil</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
