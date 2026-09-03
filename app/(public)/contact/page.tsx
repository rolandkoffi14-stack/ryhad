"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, ArrowRight } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    email: "",
    sujet: "Renseignement général",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-16 py-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-green-light text-brand-green-dark px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>Contact & Localisation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark">
            Une Question ? Notre Équipe Vous Répond
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Rendez-vous à notre atelier de Gbégamey à Cotonou ou écrivez-nous pour toute demande technique ou commerciale.
          </p>
        </div>
      </section>

      {/* Main Grid: Info + Formulaire */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne Coordonnées */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-brand-blue text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold border-b border-white/20 pb-3">
                Coordonnées de l&apos;Atelier
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Adresse physique</span>
                    <span className="text-brand-blue-light/90">
                      Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Téléphone & WhatsApp</span>
                    <a
                      href="tel:+2290190881314"
                      className="text-brand-green font-bold text-base hover:underline"
                    >
                      +229 01 90 88 13 14
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Email officiel</span>
                    <a
                      href="mailto:ryhadticmedic@gmail.com"
                      className="text-brand-blue-light/90 hover:underline"
                    >
                      ryhadticmedic@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                  <Clock className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Horaires de réception</span>
                    <span className="text-brand-blue-light/90">
                      Lundi à Vendredi : 9h00 – 20h00
                    </span>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      Interventions urgentes sur site pour structures sous contrat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Encadré d'action rapide */}
            <div className="bg-brand-slate rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <h3 className="text-sm font-bold text-brand-dark">Besoin d&apos;un dépannage immédiat ?</h3>
              <p className="text-xs text-gray-600">
                Vous pouvez créer directement un ticket de prise en charge en ligne pour accélérer le diagnostic lors de votre passage.
              </p>
              <Link
                href="/demande-intervention"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-blue hover:text-brand-green transition-colors"
              >
                <span>Accéder au formulaire de panne</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Colonne Formulaire de contact */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 subtle-shadow">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">Message bien reçu !</h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                  Merci de nous avoir contactés. Un membre de l&apos;équipe RyHaD Tic-Medic reviendra vers vous très rapidement.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-bold text-brand-blue hover:underline"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark mb-1">Envoyez-nous un message</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Renseignez vos coordonnées pour être recontacté par nos conseillers techniques.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Votre Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Numéro de Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Numéro de téléphone"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Adresse Email (optionnelle)
                    </label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Objet de votre demande
                    </label>
                    <select
                      value={formData.sujet}
                      onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none bg-white transition-all"
                    >
                      <option value="Renseignement général">Renseignement général</option>
                      <option value="Devis maintenance PME">Devis contrat de maintenance</option>
                      <option value="Biomédical & Santé">Appareils biomédicaux</option>
                      <option value="Achat matériel">Achat matériel ou pièces</option>
                      <option value="Location vidéoprojecteur">Location vidéoprojecteur</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Votre Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-md active:scale-[0.99] transition-all"
                  >
                    <Send className="w-4 h-4 text-brand-green" />
                    <span>Envoyer mon message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
