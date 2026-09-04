import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2, UserCheck } from "lucide-react";

export const metadata = {
  title: "Politique de Confidentialité & Protection des Données — RyHaD Tic-Medic",
  description: "Politique de confidentialité et protection des données à caractère personnel de RyHaD Tic-Medic, en conformité avec la réglementation en République du Bénin.",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-gray-200 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-green transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
          Politique de Confidentialité
        </h1>
        <p className="text-xs text-gray-500">
          Protection des données à caractère personnel — Conformité avec le Code du numérique en République du Bénin (Livre V / APDP).
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-blue" />
            <span>1. Responsable du Traitement</span>
          </h2>
          <p>
            Le traitement de vos données à caractère personnel est placé sous la responsabilité de :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li><strong>Entreprise :</strong> RyHaD Tic-Medic</li>
            <li><strong>Adresse :</strong> Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin</li>
            <li><strong>Téléphone :</strong> +229 01 90 88 13 14</li>
            <li><strong>Email de contact :</strong> ryhadticmedic@gmail.com</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-green" />
            <span>2. Données Collectées & Finalités</span>
          </h2>
          <p>
            Nous collectons uniquement les informations strictement nécessaires à la bonne réalisation de nos prestations techniques et commerciales :
          </p>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="p-3 bg-brand-slate rounded-lg border border-gray-200">
              <strong className="text-brand-dark block mb-1">Données d&apos;identification et de contact :</strong>
              Nom, prénom, raison sociale (pour les entreprises), numéro de téléphone (WhatsApp / mobile) et adresse email.
            </div>
            <div className="p-3 bg-brand-slate rounded-lg border border-gray-200">
              <strong className="text-brand-dark block mb-1">Données techniques d&apos;intervention :</strong>
              Marque, modèle, numéro de série, description du dysfonctionnement constaté et photos éventuelles de l&apos;appareil.
            </div>
          </div>
          <p className="text-xs text-gray-600">
            <strong>Finalités du traitement :</strong> Enregistrement de la prise en charge, communication du diagnostic et devis, exécution des réparations, facturation, suivi en ligne et gestion des contrats de maintenance.
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-blue" />
            <span>3. Sécurité des Équipements & Secret Professionnel</span>
          </h2>
          <p>
            Dans le cadre de la maintenance informatique et biomédicale, les techniciens de RyHaD Tic-Medic sont astreints au strict respect du secret professionnel et de la confidentialité des fichiers résidant sur les supports de stockage des clients.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li>Aucun fichier personnel ou d&apos;entreprise n&apos;est consulté au-delà de ce qui est techniquement indispensable pour diagnostiquer ou vérifier la bonne marche du système.</li>
            <li>Aucune copie ou transfert de données n&apos;est opéré en dehors de l&apos;accord explicite du client (par exemple lors d&apos;un forfait sauvegarde/migration).</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-green" />
            <span>4. Suivi en Ligne Sécurisé & Accès Restreint</span>
          </h2>
          <p>
            Le portail public de suivi des tickets de réparation utilise un numéro de référence unique (ex : <code>INT-2026-0001</code>). Pour protéger la confidentialité de nos clients, la consultation des devis chiffrés et la validation en ligne requièrent une clé de déverrouillage sécurisée (les 4 derniers chiffres du numéro de téléphone client).
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span>5. Conservation & Destinataires des Données</span>
          </h2>
          <p>
            Vos données personnelles sont réservées exclusivement à l&apos;usage interne de RyHaD Tic-Medic.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li><strong>Aucune cession commerciale :</strong> Vos coordonnées ne sont jamais vendues, louées ou transmises à des tiers pour du démarchage.</li>
            <li><strong>Durée de conservation :</strong> Les fiches techniques et factures sont conservées pendant la durée légale requise pour la traçabilité comptable et la gestion des garanties.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>6. Vos Droits & Exercice</span>
          </h2>
          <p>
            Conformément à la réglementation applicable en République du Bénin, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression de vos données personnelles.
          </p>
          <p className="text-xs text-gray-600">
            Pour exercer vos droits ou pour toute question relative à la protection de vos données, vous pouvez contacter notre direction par email à <a href="mailto:ryhadticmedic@gmail.com" className="text-brand-blue font-bold hover:underline">ryhadticmedic@gmail.com</a> ou par courrier à l&apos;adresse de notre atelier à Gbégamey, Cotonou.
          </p>
        </section>
      </div>
    </div>
  );
}
