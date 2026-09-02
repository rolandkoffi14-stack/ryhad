import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck, HelpCircle, FileText, Wrench } from "lucide-react";

export const metadata = {
  title: "Grille Tarifaire & Forfaits de Maintenance",
  description:
    "Transparence tarifaire : frais de diagnostic, forfaits de dépannage informatique et formules de contrats de maintenance pour entreprises à Cotonou.",
};

export default function TarifsPage() {
  const diagnosticPrices = [
    {
      category: "Informatique (PC Portables & Bureaux)",
      mode: "Dépôt en atelier",
      price: "5 000 FCFA",
      detail: "Examen approfondi des composants, test d'alimentation, diagnostic carte mère et disque.",
    },
    {
      category: "Audiovisuel (TV LED & Vidéoprojecteurs)",
      mode: "Dépôt en atelier",
      price: "7 500 FCFA",
      detail: "Test des rampes de rétroéclairage, alimentation, blocs optiques et ballast lampe.",
    },
    {
      category: "Instruments de Topographie",
      mode: "Dépôt en atelier",
      price: "10 000 FCFA",
      detail: "Contrôle électronique, axes mécaniques et vérification optique/laser.",
    },
    {
      category: "Dispositifs Biomédicaux & Cliniques",
      mode: "Déplacement sur site / Atelier",
      price: "15 000 FCFA",
      detail: "Contrôle de sécurité électrique, calibration capteurs et test fonctionnel sur site.",
    },
  ];

  const packages = [
    {
      name: "Forfait Rénovation & Vitesse",
      price: "15 000 FCFA*",
      desc: "Idéal pour redonner une seconde jeunesse à un ordinateur lent ou qui chauffe.",
      features: [
        "Dépoussiérage intégral de la carte mère et ventilateurs",
        "Remplacement pâte thermique haute conductivité",
        "Clonage système vers SSD rapide (*hors coût du SSD)",
        "Optimisation du démarrage et nettoyage registre",
      ],
      cta: "Prendre rendez-vous",
    },
    {
      name: "Forfait Sécurité & Système",
      price: "10 000 FCFA",
      desc: "Nettoyage complet en cas d'infection virale, blocage ou lenteurs inexpliquées.",
      features: [
        "Désinfection complète des malwares et rançongiciels",
        "Réinstallation propre Windows / Linux / macOS",
        "Installation des pilotes certifiés constructeur",
        "Configuration antivirus et mises à jour de sécurité",
      ],
      popular: true,
      cta: "Confier mon ordinateur",
    },
    {
      name: "Contrat Maintenance Entreprise",
      price: "Sur Devis",
      desc: "Couverture intégrale de votre parc informatique ou médical avec visites régulières.",
      features: [
        "Visites préventives mensuelles ou trimestrielles planifiées",
        "Main d'œuvre illimitée sur les interventions d'urgence",
        "Priorité absolue en cas de panne bloquante",
        "Rapports périodiques d'état du parc et conseils",
      ],
      cta: "Demander une proposition",
    },
  ];

  return (
    <div className="space-y-16 py-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-blue-light text-brand-blue px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>Tarification Claire & Transparente</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark">
            Des Tarifs Justes, Sans Mauvaise Surprise
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Chez RyHaD Tic-Medic, nous privilégions la transparence : aucun travail n&apos;est engagé sans votre validation préalable d&apos;un devis précis.
          </p>
        </div>
      </section>

      {/* Tableau Frais de Diagnostic */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-gray-200 subtle-shadow p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-brand-dark">Frais de Diagnostic par Catégorie</h2>
              <p className="text-xs text-gray-500 mt-1">
                Le diagnostic comprend l&apos;ouverture, l&apos;expertise au microscope/multimètre et l&apos;établissement du devis chiffré.
              </p>
            </div>
            <span className="text-xs bg-brand-green-light text-brand-green-dark font-bold px-3 py-1.5 rounded-lg shrink-0">
              Reçu officiel remis au dépôt
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagnosticPrices.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-brand-slate border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-brand-dark">{item.category}</span>
                    <span className="text-sm font-extrabold text-brand-blue bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{item.detail}</p>
                </div>
                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 pt-2 border-t border-gray-200/60">
                  <Wrench className="w-3.5 h-3.5 text-brand-green" />
                  <span>Mode : {item.mode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forfaits populaires */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl font-bold text-brand-dark">Nos Forfaits de Maintenance Courants</h2>
          <p className="text-xs sm:text-sm text-gray-500">Des formules optimisées pour les besoins récurrents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                pkg.popular
                  ? "bg-brand-blue text-white shadow-xl ring-2 ring-brand-green relative"
                  : "bg-white text-brand-dark border border-gray-200 subtle-shadow"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                  Plus Demandé
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className={`text-lg font-bold ${pkg.popular ? "text-white" : "text-brand-dark"}`}>
                    {pkg.name}
                  </h3>
                  <div className="mt-3">
                    <span className={`text-2xl font-extrabold ${pkg.popular ? "text-brand-green" : "text-brand-blue"}`}>
                      {pkg.price}
                    </span>
                  </div>
                  <p className={`text-xs mt-2 ${pkg.popular ? "text-brand-blue-light/80" : "text-gray-500"}`}>
                    {pkg.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100/20">
                  <ul className="space-y-2.5 text-xs">
                    {pkg.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            pkg.popular ? "text-brand-green" : "text-brand-green"
                          }`}
                        />
                        <span className={pkg.popular ? "text-gray-100" : "text-gray-700"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/demande-intervention"
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    pkg.popular
                      ? "bg-brand-green hover:bg-brand-green-dark text-white shadow-md"
                      : "bg-brand-blue hover:bg-brand-blue-dark text-white"
                  }`}
                >
                  <span>{pkg.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Tarifs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-brand-slate rounded-2xl p-6 sm:p-8 border border-gray-200/80 space-y-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-brand-blue" />
            <h3 className="text-lg font-bold text-brand-dark">Questions fréquentes sur nos tarifs</h3>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-gray-700 divide-y divide-gray-200">
            <div className="pt-3">
              <h4 className="font-bold text-brand-dark mb-1">Comment se déroule la validation du devis ?</h4>
              <p className="text-gray-600">
                Après le diagnostic en atelier, vous recevez un devis détaillé (pièces et main d&apos;œuvre). Si vous acceptez, les travaux démarrent immédiatement.
              </p>
            </div>
            <div className="pt-3">
              <h4 className="font-bold text-brand-dark mb-1">Les entreprises bénéficient-elles de conditions particulières ?</h4>
              <p className="text-gray-600">
                Oui. Les entreprises sous contrat de maintenance bénéficient de la gratuité totale de la main d&apos;œuvre sur toutes les interventions ponctuelles et de visites préventives programmées.
              </p>
            </div>
            <div className="pt-3">
              <h4 className="font-bold text-brand-dark mb-1">Quels sont les modes de paiement acceptés ?</h4>
              <p className="text-gray-600">
                Nous acceptons les règlements en espèces à l&apos;atelier, par virement bancaire, chèque ou via Mobile Money (MTN MoMo / Moov Money).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
