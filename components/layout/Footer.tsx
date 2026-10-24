import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-300 mt-auto border-t border-gray-800">
      {/* Contenu Principal du Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Entreprise & Activités Réelles complètes */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group" title="RyHaD Tic-Medic - Accueil">
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
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-brand-blue-light transition-colors">
                  RyHaD
                </span>
                <span className="text-xs font-bold uppercase ml-1.5 bg-brand-blue/30 text-brand-blue-light px-1.5 py-0.5 rounded">
                  Tic-Medic
                </span>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-gray-400">
              Votre partenaire de référence au Bénin pour la maintenance informatique, biomédicale, audiovisuelle, les infrastructures réseaux, la vidéosurveillance, les formations techniques et la vente/location de matériel.
            </p>

            <div className="pt-1 text-xs space-y-1.5 text-gray-400">
              <p>• Interventions particuliers, entreprises &amp; structures de santé</p>
              <p>• Contrats de maintenance préventive &amp; curative</p>
              <p>• Formations professionnelles &amp; ateliers pratiques</p>
            </div>
          </div>

          {/* Col 2: Services & Domaines (liens directs sans ancres) */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Nos Expertises
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Maintenance Informatique (PC &amp; Serveurs)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Maintenance Équipements Biomédicaux
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Réparation TV &amp; Vidéoprojecteurs
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Réseaux &amp; Caméras de Vidéosurveillance
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Maintenance Matériel de Topographie
                </Link>
              </li>
              <li>
                <Link href="/vente-location" className="hover:text-white transition-colors">
                  Vente de Matériel &amp; Location Vidéoprojecteurs
                </Link>
              </li>
              <li>
                <Link href="/vente-location" className="hover:text-white transition-colors">
                  Formations Techniques &amp; Pratiques
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Accès Rapide */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Accès Rapide
            </h4>
            <ul className="space-y-2.5 text-xs">
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
                <Link href="/vente-location" className="hover:text-white transition-colors">
                  Vente, Location &amp; Devis commercial
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Foire Aux Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="hover:text-white transition-colors">
                  À propos de l&apos;atelier
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Atelier & Contact Réel */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Atelier &amp; Contact
            </h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-blue-light shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-blue-light shrink-0" />
                <a href="tel:+2290190881314" className="hover:text-white font-medium">
                  +229 01 90 88 13 14
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-blue-light shrink-0" />
                <a href="mailto:ryhadticmedic@gmail.com" className="hover:text-white">
                  ryhadticmedic@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-brand-blue-light shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    Lundi – Vendredi : 9h00 – 20h00
                  </span>
                  <p className="text-[11px] text-gray-400">Permanence technique sur rendez-vous</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne du bas */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RyHaD Tic-Medic. Tous droits réservés. Gbégamey, Cotonou, Bénin.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">
              Mentions Légales
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/conditions-generales" className="hover:text-gray-300 transition-colors">
              Conditions d&apos;Intervention
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/confidentialite" className="hover:text-gray-300 transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
