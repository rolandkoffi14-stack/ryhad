import Link from "next/link";
import Image from "next/image";
import {
  Laptop,
  Tv,
  Projector,
  Activity,
  Compass,
  Network,
  Video,
  ShoppingBag,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  Sparkles,
  Award,
  Users,
  Star,
  MapPin,
  Phone,
} from "lucide-react";

export default function HomePage() {
  const services = [
    {
      id: "pc",
      title: "PC Portables & Bureaux",
      desc: "Réparation électronique carte mère, remplacement écran, disque SSD, surchauffe, virus et récupération de données.",
      icon: Laptop,
      badge: "Particuliers & Pros",
    },
    {
      id: "biomedical",
      title: "Matériel Biomédical",
      desc: "Maintenance préventive et curative des dispositifs médicaux (moniteurs, ECG, concentrateurs, centrifugeuses) pour cliniques et laboratoires.",
      icon: Activity,
      badge: "Santé & Cliniques",
    },
    {
      id: "audiovisuel",
      title: "TV & Vidéoprojecteurs",
      desc: "Réparation rétroéclairage TV LED/OLED, changement de lampe, alimentation et optique de vidéoprojecteurs.",
      icon: Projector,
      badge: "Salles & Domicile",
    },
    {
      id: "reseaux",
      title: "Réseaux & Systèmes",
      desc: "Installation de baies de brassage, switchs, routeurs d'entreprise, partage de fichiers sécurisé et maintenance de serveurs.",
      icon: Network,
      badge: "Infrastructures",
    },
    {
      id: "securite",
      title: "Vidéosurveillance",
      desc: "Pose et paramétrage de caméras IP/HD, enregistreurs NVR/DVR et visionnage en direct sur smartphone 24/7.",
      icon: Video,
      badge: "Sécurité Pro",
    },
    {
      id: "topographie",
      title: "Matériel de Topographie",
      desc: "Contrôle, étalonnage et maintenance technique pour stations totales, théodolites et niveaux de chantier.",
      icon: Compass,
      badge: "BTP & Géomètres",
    },
    {
      id: "vente",
      title: "Vente de Matériel & Pièces",
      desc: "PC professionnels, composants neufs et reconditionnés garantis, consommables et accessoires certifiés.",
      icon: ShoppingBag,
      badge: "Vente & Stock",
    },
    {
      id: "location",
      title: "Location Vidéoprojecteurs",
      desc: "Location d'équipements de projection haute luminosité pour vos séminaires, conférences et événements à Cotonou.",
      icon: Tv,
      badge: "Événementiel",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Dépôt ou Demande en ligne",
      desc: "Déposez votre appareil à notre atelier de Gbégamey ou soumettez votre demande sur le site avec photos.",
    },
    {
      num: "02",
      title: "Diagnostic & Devis Clair",
      desc: "Nos experts examinent la panne et vous fournissent un devis détaillé avec le coût exact des pièces et main d'œuvre.",
    },
    {
      num: "03",
      title: "Réparation & Tests",
      desc: "Dépannage professionnel avec pièces de qualité et série de tests rigoureux pour valider le fonctionnement.",
    },
    {
      num: "04",
      title: "Restitution & Garantie",
      desc: "Récupération de votre équipement en atelier ou livraison, accompagné d'une garantie sur l'intervention.",
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 1. HERO SECTION AVEC IMAGE DE FOND HAUTE DÉFINITION */}
      <section className="relative min-h-[560px] lg:min-h-[620px] flex items-center overflow-hidden bg-brand-dark">
        {/* Image de fond : Technicien en intervention labo informatique (WebP ultra-rapide) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.webp"
            alt="Technicien RyHaD Tic-Medic en intervention électronique et maintenance en laboratoire"
            fill
            quality={85}
            className="object-cover object-center"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
          />
          {/* Overlay dégradé professionnel pour contraste parfait */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/85 to-brand-dark/65 lg:to-brand-dark/45" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-brand-dark/60" />
        </div>

        {/* Contenu Hero épuré & centré / aligné */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 w-full">
          <div className="max-w-3xl space-y-6">
            {/* Badge de réassurance */}
            <div className="inline-flex items-center gap-2 bg-brand-green/20 border border-brand-green/40 backdrop-blur-md text-brand-green-light px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
              <span>Atelier Spécialisé à Cotonou • Gbégamey</span>
            </div>

            {/* Titre Principal */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Maintenance Experte & Solutions Tech pour{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-teal-300">
                Tous Vos Équipements
              </span>
            </h1>

            {/* Sous-titre descriptif */}
            <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal max-w-2xl text-shadow-sm">
              De l&apos;informatique bureautique aux dispositifs biomédicaux complexes, <strong>RyHaD Tic-Medic</strong> prend en charge vos dépannages, réparations cartes mères, réseaux et contrats de maintenance avec traçabilité intégrale en direct.
            </p>

            {/* Boutons d'Action (CTAs) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/demande-intervention"
                className="inline-flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-dark text-white font-bold px-7 py-4 rounded-xl shadow-lg hover:shadow-brand-green/25 active:scale-[0.98] transition-all duration-200 text-sm sm:text-base group"
              >
                <span>Demander une intervention</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/suivi"
                className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-4 rounded-xl backdrop-blur-md border border-white/25 shadow-sm active:scale-[0.98] transition-all text-sm sm:text-base"
              >
                <Search className="w-4 h-4 text-brand-green" />
                <span>Suivre ma réparation</span>
              </Link>

              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-gray-300 hover:text-white sm:pl-2 transition-colors"
              >
                <span>Vente & Location de matériel →</span>
              </Link>
            </div>

            {/* Points forts / Badges intégrés */}
            <div className="pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-brand-green shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Pièces garanties</span>
                  <span className="text-[11px] text-gray-300">Composants testés & certifiés</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <Clock className="w-5 h-5 text-brand-green shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Diagnostic rapide</span>
                  <span className="text-[11px] text-gray-300">Devis clair sous 24h à 48h</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <MapPin className="w-5 h-5 text-brand-green shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Atelier Gbégamey</span>
                  <span className="text-[11px] text-gray-300">Lun - Ven : 9h00 – 20h00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOS DOMAINES D'EXPERTISE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue uppercase tracking-wider">
            <span>Catalogue d&apos;Interventions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
            Une prise en charge multimarque pour tous vos équipements
          </h2>
          <p className="text-sm text-gray-600">
            Particuliers, PME, écoles, administrations ou centres de santé : découvrez l&apos;ensemble de nos domaines d&apos;expertise technique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="bg-white rounded-xl p-5 border border-gray-100 subtle-shadow card-hover flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue-light text-brand-blue flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-slate text-gray-600 px-2 py-0.5 rounded-full">
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-brand-dark">{srv.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{srv.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <Link
                    href={`/services#${srv.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-green transition-colors"
                  >
                    <span>Détails & Tarifs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-brand-blue-dark transition-colors"
          >
            <span>Voir la description complète de tous nos services</span>
            <ArrowRight className="w-4 h-4 text-brand-green" />
          </Link>
        </div>
      </section>

      {/* 3. COMMENT ÇA FONCTIONNE (4 ÉTAPES) */}
      <section className="bg-brand-slate py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
              Un processus transparent en 4 étapes simples
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Chaque étape est enregistrée dans notre système pour vous garantir un suivi rigoureux et sans surprise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div
                key={step.num}
                className="bg-white rounded-xl p-6 border border-gray-200/60 shadow-sm relative space-y-3"
              >
                <div className="text-3xl font-extrabold text-brand-blue/20">{step.num}</div>
                <h3 className="text-base font-bold text-brand-dark">{step.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CHIFFRES CLÉS & ENGAGEMENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-brand-blue rounded-2xl text-white p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            <div className="space-y-1 pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-green">+2 500</div>
              <p className="text-xs text-brand-blue-light/90 font-medium">Interventions réalisées</p>
            </div>
            <div className="space-y-1 pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-green">98%</div>
              <p className="text-xs text-brand-blue-light/90 font-medium">Satisfaction client</p>
            </div>
            <div className="space-y-1 pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-green">10+ ans</div>
              <p className="text-xs text-brand-blue-light/90 font-medium">D&apos;expérience combinée</p>
            </div>
            <div className="space-y-1 pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-green">24-48h</div>
              <p className="text-xs text-brand-blue-light/90 font-medium">Délai moyen de diagnostic</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AVIS CLIENTS & TÉMOIGNAGES (Cotonou) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
            Ce que disent nos clients à Cotonou
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 subtle-shadow space-y-4">
            <p className="text-xs text-gray-600 italic leading-relaxed">
              &ldquo;Mon PC Dell s&apos;éteignait tout seul lors du montage de mes dossiers d&apos;architecture. RyHaD a diagnostiqué un problème de surchauffe et a réparé la carte mère en 48h. Service impeccable et transparent.&rdquo;
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="font-bold text-xs text-brand-dark block">Clarisse A.</span>
              <span className="text-[11px] text-gray-500">Gbégamey, Particulier</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 subtle-shadow space-y-4">
            <p className="text-xs text-gray-600 italic leading-relaxed">
              &ldquo;Pour notre clinique, la fiabilité des moniteurs de réanimation est vitale. Le contrat de maintenance préventive avec RyHaD nous évite toute interruption technique. Une équipe très réactive.&rdquo;
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="font-bold text-xs text-brand-dark block">Dr. Paul E.</span>
              <span className="text-[11px] text-gray-500">Haie Vive, Clinique Médicale</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 subtle-shadow space-y-4">
            <p className="text-xs text-gray-600 italic leading-relaxed">
              &ldquo;Nous avons fait appel à eux pour le câblage réseau et l&apos;installation de caméras IP dans notre agence. Travail soigné et nous pouvons suivre chaque maintenance depuis leur plateforme.&rdquo;
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="font-bold text-xs text-brand-dark block">M. Roland H.</span>
              <span className="text-[11px] text-gray-500">Ganhi, Responsable Moyens Généraux</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BANNIÈRE FINALE CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-brand-blue via-brand-blue-dark to-brand-dark text-white rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-extrabold">Besoin d&apos;un diagnostic immédiat ?</h3>
            <p className="text-xs sm:text-sm text-brand-blue-light/80 max-w-xl">
              Remplissez le formulaire en 2 minutes ou apportez votre appareil à notre atelier de Gbégamey.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/demande-intervention"
              className="bg-brand-green hover:bg-brand-green-dark text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all text-center"
            >
              Créer une demande d&apos;intervention
            </Link>
            <Link
              href="/contact"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all text-center"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
