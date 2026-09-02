import Link from "next/link";
import {
  Laptop,
  Tv,
  Projector,
  Activity,
  Compass,
  Network,
  Video,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Clock,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Nos Services de Maintenance & Prestations Tech",
  description:
    "Découvrez l'ensemble de nos expertises : maintenance informatique, matériel biomédical, vidéoprojecteurs, TV, topographie, réseaux, vidéosurveillance et vente à Cotonou.",
};

export default function ServicesPage() {
  const serviceCategories = [
    {
      id: "informatique",
      title: "1. Maintenance Informatique (PC & Serveurs)",
      icon: Laptop,
      badge: "PC Portables & Bureaux",
      summary:
        "Dépannage matériel et logiciel complet pour particuliers, entreprises et administrations.",
      points: [
        "Réparation au composant de cartes mères (court-circuit, circuit de charge, BIOS).",
        "Remplacement d'écrans cassés, claviers, batteries, charnières et connecteurs de charge.",
        "Optimisation des performances : passage au disque SSD ultra-rapide et extension mémoire RAM.",
        "Nettoyage thermique approfondi, dépoussiérage et remplacement de pâte thermique haute conductivité.",
        "Désinfection virale, réinstallation sécurisée Windows / Linux / macOS et sauvegarde de données.",
        "Maintenance des serveurs de fichiers d'entreprise et stations de travail professionnelles.",
      ],
      ctaText: "Déposer un ordinateur",
      ctaLink: "/demande-intervention?type=PC_PORTABLE",
    },
    {
      id: "biomedical",
      title: "2. Maintenance d'Appareils Biomédicaux",
      icon: Activity,
      badge: "Cliniques, Hôpitaux & Laboratoires",
      summary:
        "Garantir la fiabilité absolue de vos dispositifs médicaux pour la sécurité des patients.",
      points: [
        "Maintenance préventive contractuelle et contrôles périodiques de sécurité électrique.",
        "Dépannage de moniteurs multiparamétriques, électrocardiographes (ECG) et oxymètres.",
        "Maintenance de centrifugeuses de laboratoire, microscopes optiques et bains-marie.",
        "Réparation de concentrateurs d'oxygène, nébuliseurs et aspirateurs chirurgicaux.",
        "Contrôle et réparation de stérilisateurs autoclaves et négatoscopes à LED.",
        "Rapports d'intervention techniques conformes aux normes sanitaires.",
      ],
      ctaText: "Demande d'intervention biomédicale",
      ctaLink: "/demande-intervention?type=APPAREIL_MEDICAL",
    },
    {
      id: "audiovisuel",
      title: "3. Maintenance TV & Vidéoprojecteurs",
      icon: Projector,
      badge: "Audiovisuel Pro & Particuliers",
      summary:
        "Réparation experte de vos équipements de diffusion d'image pour salles de réunion et salons.",
      points: [
        "Réparation de téléviseurs LED, QLED et Smart TV : remplacement des rampes de rétroéclairage.",
        "Dépannage des cartes d'alimentation, cartes mères TV et cartes T-Con.",
        "Entretien des vidéoprojecteurs : remplacement de lampes d'origine et modules lasers.",
        "Nettoyage des blocs optiques, filtres à poussière, roues chromatiques et capteurs thermiques.",
        "Dépannage des problèmes de points blancs/noirs (remplacement de puce DMD).",
        "Calibrage des couleurs et réglage de la convergence optique.",
      ],
      ctaText: "Réparer un vidéoprojecteur ou une TV",
      ctaLink: "/demande-intervention?type=VIDEOPROJECTEUR",
    },
    {
      id: "topographie",
      title: "4. Maintenance des Équipements de Topographie",
      icon: Compass,
      badge: "BTP, Géomètres & Cabinets d'Études",
      summary:
        "Entretien métrologique et mécanique de vos instruments de mesure sur chantier.",
      points: [
        "Contrôle de précision et vérification des axes mécaniques.",
        "Nettoyage et désoxydation des circuits électroniques des stations totales.",
        "Maintenance des niveaux optiques automatiques et théodolites électroniques.",
        "Remplacement des connecteurs de batteries, écrans LCD et claviers de commande.",
        "Réparation des câbles de liaison et accessoires de visée.",
      ],
      ctaText: "Faire réviser un appareil topographique",
      ctaLink: "/demande-intervention?type=EQUIPEMENT_TOPOGRAPHIE",
    },
    {
      id: "reseaux",
      title: "5. Réseaux & Systèmes Informatiques",
      icon: Network,
      badge: "PME & Infrastructures",
      summary:
        "Conception, déploiement et sécurisation de votre réseau local d'entreprise.",
      points: [
        "Câblage structuré cuivre (Cat 6/6A/7) et raccordement fibre optique.",
        "Installation et organisation de baies de brassage, panneaux de distribution et onduleurs.",
        "Configuration de routeurs professionnels (MikroTik, Cisco), switchs administrables et VLANs.",
        "Déploiement de réseaux Wi-Fi maillés haute densité avec portail captif.",
        "Mise en place de serveurs de fichiers NAS sécurisés avec sauvegarde automatique.",
      ],
      ctaText: "Demander un audit réseau",
      ctaLink: "/devis?type=AUTRE",
    },
    {
      id: "securite",
      title: "6. Vidéosurveillance & Sécurité Électronique",
      icon: Video,
      badge: "Surveillance 24/7",
      summary:
        "Protégez vos locaux commerciaux, bureaux, entrepôts et résidences privées.",
      points: [
        "Installation de caméras de sécurité IP haute définition (2K / 4K) avec vision nocturne infrarouge et couleur.",
        "Pose d'enregistreurs NVR/DVR avec disques durs dédiés surveillance haute endurance.",
        "Configuration de l'accès à distance sécurisé sur smartphones (iOS / Android) et ordinateurs.",
        "Détection intelligente de mouvements, franchissement de ligne et alertes en temps réel.",
        "Contrats d'entretien annuel des caméras (nettoyage dômes, vérification disques, mises à jour).",
      ],
      ctaText: "Devis installation caméras",
      ctaLink: "/devis?type=AUTRE",
    },
    {
      id: "vente",
      title: "7. Vente de Matériel Informatique & Médical",
      icon: ShoppingBag,
      badge: "Équipements Garantis",
      summary:
        "Une sélection de matériel robuste rigoureusement testé et garanti par nos techniciens.",
      points: [
        "Ordinateurs portables professionnels neufs et reconditionnés Grade A (Dell Latitude, HP EliteBook, Lenovo ThinkPad).",
        "Unités centrales de bureau, écrans professionnels et stations graphiques.",
        "Accessoires informatiques : disques SSD, RAM, chargeurs originaux, claviers, souris, sacoches.",
        "Fournitures et consommables biomédicaux courants pour structures de santé.",
        "Garantie directe atelier RyHaD sur tout le matériel vendu.",
      ],
      ctaText: "Consulter nos offres de matériel",
      ctaLink: "/devis?type=VENTE_MATERIEL",
    },
    {
      id: "location",
      title: "8. Location & Vente de Vidéoprojecteurs",
      icon: Tv,
      badge: "Événements & Séminaires",
      summary:
        "Mise à disposition rapide d'équipements de projection professionnels pour vos présentations.",
      points: [
        "Location courte durée (journée, week-end) ou longue durée pour salles de conférence.",
        "Vidéoprojecteurs forte luminosité (3 500 à 5 000 lumens) adaptés aux salles éclairées.",
        "Écrans de projection sur trépied ou déroulants, câblage HDMI longue distance et pointeurs laser.",
        "Assistance technique à l'installation et réglage sur place à Cotonou.",
        "Vente de vidéoprojecteurs neufs avec garantie atelier.",
      ],
      ctaText: "Réserver un vidéoprojecteur",
      ctaLink: "/devis?type=LOCATION_VIDEOPROJECTEUR",
    },
  ];

  return (
    <div className="space-y-16 py-10">
      {/* Header Page */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-brand-blue via-brand-blue-dark to-brand-dark text-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-green/20 text-brand-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5" />
              <span>Savoir-faire Technique & Métiers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Nos Domaines d&apos;Intervention & Prestations Spécialisées
            </h1>
            <p className="text-sm sm:text-base text-brand-blue-light/90 leading-relaxed">
              De la micro-électronique informatique aux systèmes biomédicaux hospitaliers, RyHaD Tic-Medic met à votre disposition un atelier outillé et des techniciens chevronnés à Cotonou.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {serviceCategories.map((service, index) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              id={service.id}
              className="scroll-mt-24 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 subtle-shadow card-hover grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Colonne gauche : Titre & résumé */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-brand-green-light text-brand-green-dark px-2.5 py-0.5 rounded-full">
                      {service.badge}
                    </span>
                    <h2 className="text-xl font-extrabold text-brand-dark mt-1">
                      {service.title}
                    </h2>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {service.summary}
                </p>

                <div className="pt-2">
                  <Link
                    href={service.ctaLink}
                    className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-lg shadow transition-all"
                  >
                    <span>{service.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-brand-green" />
                  </Link>
                </div>
              </div>

              {/* Colonne droite : Liste des prestations détaillées */}
              <div className="lg:col-span-7 bg-brand-slate rounded-xl p-5 sm:p-6 border border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-4 border-b border-gray-200/60 pb-2">
                  Prestations incluses & Opérations couvertes
                </h3>
                <ul className="space-y-3">
                  {service.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </section>

      {/* Reassurance Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-brand-slate rounded-2xl p-8 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <ShieldCheck className="w-8 h-8 text-brand-green mx-auto" />
            <h4 className="font-bold text-sm text-brand-dark">Garantie sur Interventions</h4>
            <p className="text-xs text-gray-500">Toutes nos réparations matérielles bénéficient d&apos;une garantie sur les pièces changées.</p>
          </div>
          <div className="space-y-2">
            <Clock className="w-8 h-8 text-brand-blue mx-auto" />
            <h4 className="font-bold text-sm text-brand-dark">Transparence des Délais</h4>
            <p className="text-xs text-gray-500">Diagnostic précis communiqué avant toute intervention sans mauvaise surprise sur la facture.</p>
          </div>
          <div className="space-y-2">
            <Sparkles className="w-8 h-8 text-brand-green mx-auto" />
            <h4 className="font-bold text-sm text-brand-dark">Contrats Sur Mesure</h4>
            <p className="text-xs text-gray-500">Offres personnalisées avec visites préventives mensuelles ou trimestrielles pour votre parc.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
