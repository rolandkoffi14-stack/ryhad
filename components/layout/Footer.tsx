import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-300 mt-auto border-t border-gray-800">
      {/* Top Banner / Trust */}
      <div className="bg-brand-blue py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-green shrink-0" />
            <div>
              <h4 className="font-bold text-base">Atelier Technique Spécialisé à Cotonou</h4>
              <p className="text-xs text-brand-blue-light/80">
                Diagnostics certifiés, pièces garanties et suivi de dossier en ligne sans appel obligatoire.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demande-intervention"
              className="bg-brand-green text-white hover:bg-brand-green-dark px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all"
            >
              Déposer un appareil
            </Link>
            <a
              href="tel:+2290190881314"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              +229 01 90 88 13 14
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Entreprise & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1 border border-gray-700 shadow-md">
                <Image
                  src="/images/logo.jpg"
                  alt="RyHaD Tic-Medic Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">RyHaD</span>
                <span className="text-xs font-bold uppercase ml-1.5 bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded">
                  Tic-Medic
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              Votre partenaire de référence au Bénin pour la maintenance informatique, biomédicale, audiovisuelle, les infrastructures réseaux, la vidéosurveillance et la vente de matériel professionnel.
            </p>
            <div className="pt-2 text-xs space-y-1 text-gray-400">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                Interventions pour particuliers & entreprises
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                Contrats de maintenance préventive
              </p>
            </div>
          </div>

          {/* Col 2: Services & Domaines */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand-green pl-2">
              Nos Expertises
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/services#informatique" className="hover:text-white transition-colors">
                  Maintenance Informatique (PC & Serveurs)
                </Link>
              </li>
              <li>
                <Link href="/services#biomedical" className="hover:text-white transition-colors">
                  Maintenance Équipements Biomédicaux
                </Link>
              </li>
              <li>
                <Link href="/services#audiovisuel" className="hover:text-white transition-colors">
                  Réparation TV & Vidéoprojecteurs
                </Link>
              </li>
              <li>
                <Link href="/services#topographie" className="hover:text-white transition-colors">
                  Matériel de Topographie
                </Link>
              </li>
              <li>
                <Link href="/services#reseaux-securite" className="hover:text-white transition-colors">
                  Réseaux & Caméras de Vidéosurveillance
                </Link>
              </li>
              <li>
                <Link href="/devis" className="hover:text-white transition-colors">
                  Vente & Location de Vidéoprojecteurs
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Liens & Suivi */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand-green pl-2">
              Accès Rapide
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/demande-intervention" className="hover:text-white transition-colors">
                  Demande d&apos;intervention en ligne
                </Link>
              </li>
              <li>
                <Link href="/suivi" className="hover:text-white transition-colors">
                  Suivre l&apos;état de ma réparation
                </Link>
              </li>
              <li>
                <Link href="/devis" className="hover:text-white transition-colors">
                  Demande de devis commercial
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="hover:text-white transition-colors">
                  Grille des forfaits et diagnostics
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="hover:text-white transition-colors">
                  Qui sommes-nous ?
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Horaires */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand-green pl-2">
              Atelier & Contact
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-green shrink-0" />
                <a href="tel:+2290190881314" className="hover:text-white">
                  +229 01 90 88 13 14
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <a href="mailto:ryhadticmedic@gmail.com" className="hover:text-white">
                  ryhadticmedic@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Lundi – Vendredi : 9h00 – 20h00</span>
                  <p className="text-[11px] text-gray-400">Permanence technique sur rendez-vous</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RyHaD Tic-Medic. Tous droits réservés. Cotonou, Bénin.</p>
          <div className="flex items-center gap-4">
            <Link href="/mentions-legales" className="hover:text-gray-400">
              Mentions Légales & Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
