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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>2. Protection des Données Personnelles (APDP Bénin)</span>
            </h2>
            <Link href="/confidentialite" className="text-xs font-bold text-brand-blue hover:text-brand-green transition-colors">
              Voir la politique complète →
            </Link>
          </div>
          <p>
            Les données recueillies lors des demandes d&apos;intervention (nom, numéro de téléphone, adresse email, pannes signalées) sont destinées exclusivement à la gestion administrative, technique et financière de vos réparations.
          </p>
          <p>
            Vos informations ne font l&apos;objet d&apos;aucune cession commerciale. Consultez notre{" "}
            <Link href="/confidentialite" className="text-brand-blue font-bold hover:underline">
              Politique de Confidentialité détaillée
            </Link>{" "}
            pour connaître l&apos;ensemble de vos droits et les mesures de sécurité appliquées.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-blue" />
              <span>3. Conditions Générales d&apos;Intervention & Garantie</span>
            </h2>
            <Link href="/conditions-generales" className="text-xs font-bold text-brand-blue hover:text-brand-green transition-colors">
              Voir les conditions complètes →
            </Link>
          </div>
          <p>
            Toute intervention en atelier ou sur site fait l&apos;objet d&apos;un enregistrement préalable et d&apos;un devis descriptif soumis à l&apos;accord du client.
          </p>
          <p>
            Pour prendre connaissance des modalités détaillées de diagnostic, garantie de 30 jours, modalités de règlement et délais de garde, veuillez consulter nos{" "}
            <Link href="/conditions-generales" className="text-brand-blue font-bold hover:underline">
              Conditions Générales d&apos;Intervention
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
