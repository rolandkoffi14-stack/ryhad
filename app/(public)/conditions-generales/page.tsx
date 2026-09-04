import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Intervention — RyHaD Tic-Medic",
  description: "Conditions générales de service, modalités de diagnostic, garanties et conditions de gardiennage des matériels chez RyHaD Tic-Medic à Cotonou, Bénin.",
};

export default function ConditionsGeneralesPage() {
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
          Conditions Générales d&apos;Intervention
        </h1>
        <p className="text-xs text-gray-500">
          Document contractuel applicable aux prestations de maintenance et services techniques — RyHaD Tic-Medic (Cotonou, Bénin).
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        {/* Article 1 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-blue" />
            <span>Article 1 — Champ d&apos;application & Objet</span>
          </h2>
          <p>
            Les présentes Conditions Générales d&apos;Intervention (CGI) régissent l&apos;ensemble des prestations techniques exécutées par <strong>RyHaD Tic-Medic</strong> au profit de ses clients (particuliers, entreprises, établissements de santé, administrations et écoles).
          </p>
          <p>
            Les prestations couvrent : la maintenance informatique (PC fixes, portables, serveurs), biomédicale, audiovisuelle (vidéoprojecteurs, écrans TV), les infrastructures réseaux, la vidéosurveillance, la formation ainsi que la vente et la location d&apos;équipements.
          </p>
        </section>

        {/* Article 2 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>Article 2 — Prise en charge, Fiche d&apos;entrée & Diagnostic</span>
          </h2>
          <p>
            Tout équipement déposé à l&apos;atelier de Gbégamey ou pris en charge sur site fait l&apos;objet d&apos;une fiche d&apos;intervention numérotée (ex : <code>INT-2026-XXXX</code>) avec un état des lieux contradictoire (accessoires remis, état cosmétique, symptôme déclaré).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li>Un diagnostic approfondi est mené par nos techniciens pour identifier l&apos;origine de la panne et chiffrer les réparations.</li>
            <li>Le devis descriptif est communiqué au client par WhatsApp, email ou consultable directement en ligne sur la plateforme de suivi.</li>
            <li>Aucune réparation payante n&apos;est engagée sans l&apos;accord exprès préalable du client (validation en ligne ou signature de devis).</li>
          </ul>
        </section>

        {/* Article 3 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span>Article 3 — Garantie des Prestations & Pièces Détachées</span>
          </h2>
          <p>
            RyHaD Tic-Medic garantit la qualité de ses interventions et la conformité des pièces de rechange installées :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li><strong>Main-d&apos;œuvre :</strong> Garantie de 30 jours à compter de la date de mise à disposition du matériel réparé.</li>
            <li><strong>Pièces neuves :</strong> Bénéficient de la garantie constructeur ou de la garantie mentionnée sur la facture finale.</li>
            <li><strong>Exclusions de garantie :</strong> La garantie ne couvre pas les pannes causées par une surtension électrique, une immersion liquide postérieure, un choc physique ou une intervention tierce non autorisée.</li>
          </ul>
        </section>

        {/* Article 4 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-red" />
            <span>Article 4 — Sauvegarde des Données & Responsabilité</span>
          </h2>
          <p>
            Il appartient au client d&apos;effectuer une sauvegarde de ses données personnelles ou professionnelles avant tout dépôt de matériel informatique.
          </p>
          <p className="text-xs text-gray-600">
            RyHaD Tic-Medic met en œuvre toute la diligence technique requise pour préserver l&apos;intégrité des disques et supports de stockage, mais ne saurait être tenu responsable d&apos;une perte fortuite de données résultant d&apos;une défaillance matérielle préexistante du support. Une prestation optionnelle de sauvegarde ou récupération de données peut être demandée avant intervention.
          </p>
        </section>

        {/* Article 5 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-green" />
            <span>Article 5 — Tarifs, Facturation & Modalités de Paiement</span>
          </h2>
          <p>
            Les prix sont stipulés en Francs CFA (XOF). Les paiements s&apos;effectuent selon les modalités convenues :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li>Espèces à la caisse de l&apos;atelier contre reçu officiel.</li>
            <li>Mobile Money (MTN MoMo, Moov Money) selon les instructions transmises par la réception.</li>
            <li>Virement bancaire ou chèque pour les entreprises et contrats B2B (selon conditions négociées).</li>
          </ul>
          <p className="text-xs text-gray-600">
            Pour les clients sous contrat de maintenance préventive/curative, les facturations périodiques respectent l&apos;échéancier défini dans la convention cadre.
          </p>
        </section>

        {/* Article 6 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-blue" />
            <span>Article 6 — Retrait du Matériel & Délais de Garde</span>
          </h2>
          <p>
            Dès notification de fin des travaux (ou d&apos;impossibilité technique), le client est tenu de retirer son équipement dans un délai de 30 jours calendaires.
          </p>
          <p className="text-xs text-gray-600">
            Passé ce délai de 30 jours sans nouvelles malgré nos relances, des frais de gardiennage et d&apos;entreposage sécurisé pourront être appliqués. Au-delà d&apos;un délai légal de 90 jours calendaires, le matériel sera réputé abandonné conformément aux dispositions légales applicables en République du Bénin.
          </p>
        </section>

        {/* Article 7 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 subtle-shadow space-y-3">
          <h2 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-dark" />
            <span>Article 7 — Droit Applicable & Règlement des Différends</span>
          </h2>
          <p>
            Les présentes conditions sont soumises au droit béninois. En cas de contestation ou de réclamation, les parties s&apos;engagent à rechercher prioritairement une solution amiable auprès de la direction de RyHaD Tic-Medic. À défaut d&apos;accord amiable, les tribunaux compétents de Cotonou seront seuls habilités.
          </p>
        </section>
      </div>
    </div>
  );
}
