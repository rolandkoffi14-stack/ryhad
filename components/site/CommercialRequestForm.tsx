"use client";

import { useState } from "react";
import { ShoppingBag, Tv, GraduationCap, Wrench, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { TypeDemandeCommerciale } from "@prisma/client";

interface Props {
  initialType?: string;
}

export function CommercialRequestForm({ initialType }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<{
    nom: string;
    telephone: string;
    email: string;
    entreprise: string;
    typeDemande: TypeDemandeCommerciale;
    description: string;
  }>({
    nom: "",
    telephone: "",
    email: "",
    entreprise: "",
    typeDemande: (initialType && Object.values(TypeDemandeCommerciale).includes(initialType as TypeDemandeCommerciale))
      ? (initialType as TypeDemandeCommerciale)
      : TypeDemandeCommerciale.VENTE_MATERIEL,
    description: "",
  });

  const options = [
    {
      value: TypeDemandeCommerciale.VENTE_MATERIEL,
      label: "Achat de Matériel / Composants",
      desc: "PC portables, unités centrales, serveurs, pièces détachées, consommables.",
      icon: ShoppingBag,
    },
    {
      value: TypeDemandeCommerciale.LOCATION_VIDEOPROJECTEUR,
      label: "Location de Vidéoprojecteur",
      desc: "Équipements haute luminosité avec écran et accessoires pour événements.",
      icon: Tv,
    },
    {
      value: TypeDemandeCommerciale.FORMATION,
      label: "Formation Technique & IT",
      desc: "Sessions de formation pratique en maintenance informatique ou réseaux.",
      icon: GraduationCap,
    },
    {
      value: TypeDemandeCommerciale.AUTRE,
      label: "Autre Prestation / Audit Spécialisé",
      desc: "Audit réseau, installation vidéosurveillance, contrat sur mesure.",
      icon: Wrench,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demande-commerciale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Une erreur est survenue lors de la soumission.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 subtle-shadow text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center mx-auto shadow">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-brand-dark">Demande Commerciale Transmise !</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Notre service commercial étudie votre besoin et vous contactera sous 24 heures avec une proposition chiffrée.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                nom: "",
                telephone: "",
                email: "",
                entreprise: "",
                typeDemande: TypeDemandeCommerciale.VENTE_MATERIEL,
                description: "",
              });
            }}
            className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm shadow"
          >
            Faire une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-200 subtle-shadow space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sélection du type de demande */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2">
          Objet de votre demande commerciale *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = formData.typeDemande === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setFormData({ ...formData, typeDemande: opt.value })}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? "border-brand-blue bg-brand-blue-light/70 ring-2 ring-brand-blue/30 text-brand-dark"
                    : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coordonnées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Votre Nom et Prénom *
          </label>
          <input
            type="text"
            required
            placeholder="Nom et prénom"
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
            Adresse Email
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
            Entreprise / Institution (si applicable)
          </label>
          <input
            type="text"
            placeholder="Nom de l'entreprise"
            value={formData.entreprise}
            onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
          />
        </div>
      </div>

      {/* Description du besoin */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Détails et spécifications du besoin *
        </label>
        <textarea
          rows={4}
          required
          placeholder="Détails de votre demande"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
        ></textarea>
      </div>

      {/* Bouton de soumission */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Envoi en cours...</span>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>Transmettre ma demande commerciale</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
