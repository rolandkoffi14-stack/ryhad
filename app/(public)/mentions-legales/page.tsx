import Link from "next/link";
import { ShieldCheck, FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Mentions Légales & Politique de Confidentialité",
  description: "Informations légales, conditions de garantie et politique de protection des données de RyHaD Tic-Medic.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-gray-200 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-green transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
          Mentions Légales & Confidentialité
        </h1>
        <p className="text-xs text-gray-500">Dernière mise à jour : Février 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-blue" />
            <span>1. Éditeur du Site & Atelier</span>
          </h2>
          <p>
            Le site internet <strong>www.ryhad.bj</strong> et la plateforme de gestion associée sont édités par l&apos;entreprise <strong>RyHaD Tic-Medic</strong>, spécialisée dans la maintenance des équipements informatiques, biomédicaux et audiovisuels au Bénin.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li><strong>Dénomination :</strong> RyHaD Tic-Medic</li>
            <li><strong>Siège social & Atelier :</strong> Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin</li>
            <li><strong>Téléphone :</strong> +229 01 90 88 13 14</li>
            <li><strong>Email de contact :</strong> ryhadticmedic@gmail.com</li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-green" />
            <span>2. Protection des Données Personnelles</span>
          </h2>
          <p>
            Les données recueillies lors des demandes d&apos;intervention (nom, numéro de téléphone, adresse email, adresse de localisation, photos du matériel) sont destinées exclusivement à la gestion administrative, technique et financière de vos réparations.
          </p>
          <p>
            Vos informations ne font l&apos;objet d&apos;aucune cession, vente ou échange avec des tiers à des fins publicitaires. Le module de suivi public est accessible uniquement avec le numéro de référence unique de votre ticket (ex: INT-2026-XXXX) et ne divulgue aucune information financière sensible.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-blue" />
            <span>3. Conditions Générales d&apos;Intervention & Garantie</span>
          </h2>
          <p>
            Toute intervention en atelier ou à domicile fait l&apos;objet d&apos;un enregistrement préalable et de l&apos;émission d&apos;un reçu ou devis descriptif.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li>Les pièces détachées remplacées sont garanties contre tout vice de fabrication pour une durée définie sur la facture finale.</li>
            <li>Le diagnostic initial permet d&apos;évaluer la faisabilité technique. En cas de refus du devis par le client, seuls les frais d&apos;examen initial convenus restent acquis.</li>
            <li>Le matériel réparé est conservé en atelier pendant une durée légale de 90 jours après notification de fin d&apos;intervention.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
