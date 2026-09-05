import Link from "next/link";
import { ShieldCheck, Award, Users, MapPin, Clock, CheckCircle2, ArrowRight, HeartPulse, Wrench } from "lucide-react";

export const metadata = {
  title: "À Propos de l'Atelier",
  description:
    "Découvrez l'histoire, les valeurs et l'équipe d'experts de RyHaD Tic-Medic, votre atelier de maintenance informatique, biomédicale et audiovisuelle à Cotonou, Bénin.",
};

export default function AProposPage() {
  return (
    <div className="space-y-16 py-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-brand-blue via-brand-blue-dark to-brand-dark text-white rounded-2xl p-8 sm:p-12 shadow-lg">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-brand-green/20 text-brand-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Excellence & Proximité à Cotonou</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              L&apos;Ingénierie Technique au Service de Vos Équipements
            </h1>
            <p className="text-sm sm:text-base text-brand-blue-light/90 leading-relaxed">
              Fondée à Cotonou, <strong>RyHaD Tic-Medic</strong> est née d&apos;une ambition claire : offrir aux particuliers, entreprises et acteurs de santé une prise en charge technique irréprochable avec une traçabilité totale.
            </p>
          </div>
        </div>
      </section>

      {/* Histoire & Positionnement */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
              Une double expertise unique : IT et Médical
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Contrairement aux ateliers de dépannage classiques, RyHaD Tic-Medic réunit sous un même toit des techniciens en micro-électronique informatique et des spécialistes en maintenance biomédicale.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Nous intervenons aussi bien pour réparer le PC portable d&apos;un étudiant que pour maintenir les concentrateurs d&apos;oxygène d&apos;une clinique ou installer l&apos;infrastructure réseau sécurisée d&apos;un siège d&apos;entreprise.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-brand-slate border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
                  <Wrench className="w-4 h-4 text-brand-green" />
                  <span>Atelier Outillé</span>
                </div>
                <p className="text-xs text-gray-500">
                  Stations de soudure CMS, microscopes numériques et outillage de mesure de précision.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-brand-slate border border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
                  <HeartPulse className="w-4 h-4 text-brand-green" />
                  <span>Rigueur Biomédicale</span>
                </div>
                <p className="text-xs text-gray-500">
                  Protocoles stricts de contrôle et de sécurité électrique conformes aux exigences sanitaires.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 subtle-shadow space-y-6">
            <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3">
              Fiche d&apos;Identité de l&apos;Entreprise
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800 block">Siège & Atelier</span>
                  <span className="text-gray-600">Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800 block">Horaires de service</span>
                  <span className="text-gray-600">Lundi – Vendredi : 9h00 – 20h00</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800 block">Publics & Cibles</span>
                  <span className="text-gray-600">Particuliers, PME, Écoles, Cabinets d&apos;études, Cliniques & Hôpitaux</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800 block">Garantie Qualité</span>
                  <span className="text-gray-600">Traçabilité 100% numérique et suivi sans déplacement</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/contact"
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
              >
                <span>Prendre contact avec l&apos;équipe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nos 4 engagements */}
      <section className="bg-brand-slate py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
              Nos 4 Engagements Inébranlables
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Ce qui guide chacune de nos interventions au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-blue-light text-brand-blue flex items-center justify-center font-extrabold">
                1
              </div>
              <h3 className="font-bold text-sm text-brand-dark">Transparence Totale</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Aucun composant n&apos;est remplacé sans votre accord explicite sur un devis préalable chiffré.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-extrabold">
                2
              </div>
              <h3 className="font-bold text-sm text-brand-dark">Traçabilité en Ligne</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Suivez en temps réel l&apos;état d&apos;avancement de votre réparation depuis notre site web avec votre numéro.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-blue-light text-brand-blue flex items-center justify-center font-extrabold">
                3
              </div>
              <h3 className="font-bold text-sm text-brand-dark">Pièces Testées & Garanties</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Nous sélectionnons exclusivement des composants fiables issus de circuits certifiés avec garantie.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-extrabold">
                4
              </div>
              <h3 className="font-bold text-sm text-brand-dark">Réactivité Exceptionnelle</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Atelier ouvert jusqu&apos;à 20h en semaine pour vous permettre de déposer et récupérer votre matériel sereinement.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
