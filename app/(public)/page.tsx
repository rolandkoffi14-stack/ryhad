import Link from "next/link";
import Image from "next/image";
import {
  Laptop,
  Activity,
  Projector,
  Network,
  ShoppingBag,
  GraduationCap,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  // 4 À 6 cartes MAXIMUM (pas 8), les plus représentatives de l'étendue réelle de l'activité
  const servicesPreview = [
    {
      id: "informatique",
      title: "Maintenance Informatique & Systèmes",
      desc: "Dépannage micro-électronique PC portables & fixes, cartes mères, écrans, optimisation disques SSD et maintenance de serveurs.",
      icon: Laptop,
      badge: "Particuliers & Pros",
      link: "/services",
    },
    {
      id: "biomedical",
      title: "Maintenance Matériel Biomédical",
      desc: "Maintenance préventive et curative des moniteurs multiparamétriques, ECG, centrifugeuses, concentrateurs d'oxygène et équipements médicaux.",
      icon: Activity,
      badge: "Cliniques & Santé",
      link: "/services",
    },
    {
      id: "audiovisuel",
      title: "TV & Vidéoprojecteurs",
      desc: "Remplacement de rampes de rétroéclairage TV LED/OLED, alimentations, révision optique et changement de lampes de vidéoprojecteurs.",
      icon: Projector,
      badge: "Audiovisuel Pro & Salon",
      link: "/services",
    },
    {
      id: "reseaux",
      title: "Réseaux & Vidéosurveillance",
      desc: "Câblage réseau structuré, baies de brassage, routeurs d'entreprise et caméras de sécurité IP haute définition avec vision 24/7.",
      icon: Network,
      badge: "Infrastructures IT",
      link: "/services",
    },
    {
      id: "vente-location",
      title: "Vente de Matériel & Location",
      desc: "Vente d'ordinateurs professionnels testés et garantis, pièces de rechange, et location de vidéoprojecteurs haute luminosité pour événements.",
      icon: ShoppingBag,
      badge: "Vente & Événements",
      link: "/vente-location",
    },
    {
      id: "formation",
      title: "Formations Techniques & Métiers",
      desc: "Modules pratiques en atelier pour renforcer vos compétences : diagnostic matériel, réparation électronique, câblage et réseaux locaux.",
      icon: GraduationCap,
      badge: "Pratique en Atelier",
      link: "/vente-location",
    },
  ];

  // Processus transparent en 4 étapes
  const processSteps = [
    {
      num: "01",
      title: "Dépôt ou Demande en ligne",
      desc: "Déposez votre équipement directement à l'atelier de Gbégamey ou soumettez votre demande avec détails sur notre site.",
    },
    {
      num: "02",
      title: "Diagnostic & Devis clair",
      desc: "Nos techniciens inspectent l'appareil et vous transmettent un devis précis détaillant pièces et main-d'œuvre sans frais cachés.",
    },
    {
      num: "03",
      title: "Réparation & Tests rigoureux",
      desc: "Dépannage soigné avec composants de qualité, complété par une série de tests de validation avant toute restitution.",
    },
    {
      num: "04",
      title: "Restitution & Garantie",
      desc: "Récupération de votre appareil à l'atelier avec remise de la facture et de la garantie sur l'intervention réalisée.",
    },
  ];

  // Chiffres clés réels fournis explicitement
  const realStats = [
    {
      value: "+2 000",
      label: "Interventions réalisées",
    },
    {
      value: "98%",
      label: "Satisfaction client",
    },
    {
      value: "10+ ans",
      label: "D'expérience combinée",
    },
    {
      value: "Moins de 24h",
      label: "Délai moyen de diagnostic",
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 3. HERO SECTION */}
      <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden bg-brand-dark">
        {/* Image de fond : Atelier & Technicien labo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.webp"
            alt="Technicien RyHaD Tic-Medic en intervention électronique et maintenance technique"
            fill
            quality={85}
            className="object-cover object-center"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
          />
          {/* Dégradé sombre pour lisibilité optimale */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/85 to-brand-dark/70 lg:to-brand-dark/50" />
        </div>

        {/* Contenu Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 w-full">
          <div className="max-w-3xl space-y-6">
            {/* Badge : Atelier spécialisé à Cotonou · Gbégamey */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span>Atelier spécialisé à Cotonou · Gbégamey</span>
            </div>

            {/* H1 avec un mot en Vert Maintenance */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Maintenance experte et ingénierie tech pour{" "}
              <span className="text-brand-green">vos équipements</span> à Cotonou
            </h1>

            {/* Paragraphe couvrant en une phrase la diversité réelle */}
            <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal max-w-2xl">
              De l&apos;informatique bureautique aux dispositifs biomédicaux, en passant par les équipements audiovisuels et les infrastructures réseaux, RyHaD Tic-Medic assure le dépannage, la maintenance et l&apos;équipement des particuliers et des professionnels.
            </p>

            {/* DEUX CTA maximum (pas trois comme la version précédente) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              {/* CTA 1 : Plein Bleu Confiance vers /demande-intervention */}
              <Link
                href="/demande-intervention"
                className="inline-flex items-center justify-center gap-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-7 py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm sm:text-base group"
              >
                <span>Demander une intervention</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* CTA 2 : Contour / verre vers /vente-location */}
              <Link
                href="/vente-location"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/30 backdrop-blur-sm active:scale-[0.98] transition-all text-sm sm:text-base"
              >
                <span>Vente &amp; Location</span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            </div>

            {/* 3 badges de réassurance sous les CTA : faits vérifiables uniquement, sans chiffre inventé */}
            <div className="pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-brand-green shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Pièces garanties</span>
                  <span className="text-[11px] text-gray-300">Composants testés en atelier</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                <Clock className="w-5 h-5 text-brand-blue-light shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Devis clair sous 24-48h</span>
                  <span className="text-[11px] text-gray-300">Diagnostic précis avant travaux</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                <MapPin className="w-5 h-5 text-brand-blue-light shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Atelier Gbégamey · Lun-Ven 9h-20h</span>
                  <span className="text-[11px] text-gray-300">Prise en charge directe sur place</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. APERÇU DES SERVICES (4 à 6 cartes maximum, liens vers vraies pages sans ancres) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue uppercase tracking-wider">
            <span>Aperçu de nos activités</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
            Une expertise technique polyvalente et outillée
          </h2>
          <p className="text-sm text-gray-600">
            Particuliers, entreprises, écoles, administrations et structures de santé : découvrez les principaux domaines d&apos;intervention pris en charge à notre atelier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesPreview.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-slate text-gray-600 px-2.5 py-1 rounded-full">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-brand-dark">{service.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{service.desc}</p>
                </div>

                {/* Lien net vers vraie page dédiée (pas d'ancre) */}
                <div className="pt-4 mt-5 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={service.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-blue-dark transition-colors group"
                  >
                    <span>Détails &amp; tarifs</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lien net en bas vers la page complète de services */}
        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-brand-slate hover:bg-gray-200 text-brand-dark px-6 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <span>Voir tous nos domaines d&apos;intervention</span>
            <ArrowRight className="w-4 h-4 text-brand-blue" />
          </Link>
        </div>
      </section>

      {/* 5. PROCESSUS EN 4 ÉTAPES */}
      <section className="bg-brand-slate py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue uppercase tracking-wider">
              <span>Méthodologie d&apos;intervention</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
              Un processus transparent en 4 étapes simples
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Chaque étape de votre dossier est documentée pour vous assurer une traçabilité complète et un travail soigné.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-xs relative space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="text-3xl font-extrabold text-brand-blue/25">{step.num}</div>
                  <h3 className="text-base font-bold text-brand-dark">{step.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                <div className="pt-3 border-t border-gray-50 flex items-center gap-1.5 text-[11px] text-brand-green font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Étape vérifiée</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CHIFFRES CLÉS (uniquement les données réelles fournies) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-brand-blue rounded-2xl text-white p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {realStats.map((stat, idx) => (
              <div key={idx} className="space-y-1.5 pt-4 lg:pt-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </div>
                <p className="text-xs sm:text-sm text-brand-blue-light/90 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TÉMOIGNAGES : Section omise complètement car aucune donnée réelle n'a été fournie */}

      {/* 8. CTA DE CONVERSION — UNE SEULE SECTION PLEINE LARGEUR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-brand-dark via-brand-dark to-brand-blue-dark text-white rounded-2xl p-8 sm:p-12 border border-gray-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Message orienté client fusionnant toutes les informations utiles */}
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Besoin d&apos;un diagnostic immédiat ?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Déposez votre appareil à notre atelier de Gbégamey ou décrivez votre panne en ligne. Devis clair sous 24-48h, pièces garanties et suivi de dossier en direct sans appel obligatoire.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-brand-blue-light/90">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                <span>Pièces testées &amp; garanties</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                <span>Diagnostic transparent</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                <span>Suivi web en temps réel</span>
              </span>
            </div>
          </div>

          {/* Actions & Téléphone cliquable */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/demande-intervention"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all text-center"
              >
                Demander une intervention
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3.5 rounded-xl text-xs sm:text-sm border border-white/20 transition-all text-center"
              >
                Nous contacter
              </Link>
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs text-gray-300">
              <Phone className="w-3.5 h-3.5 text-brand-green" />
              <span>Assistance directe : </span>
              <a
                href="tel:+2290190881314"
                className="text-white font-bold hover:text-brand-green transition-colors"
              >
                +229 01 90 88 13 14
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
