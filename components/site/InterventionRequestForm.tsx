"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Tv,
  Projector,
  Activity,
  Compass,
  Network,
  Video,
  Wrench,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { TypeMateriel, ModeIntervention } from "@prisma/client";

interface Props {
  initialType?: string;
}

export function InterventionRequestForm({ initialType }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ numero: string; type: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Échec du téléversement du fichier.");
      }

      setFormData((prev) => ({ ...prev, photoUrl: resData.url }));
    } catch (err: any) {
      setError(err.message || "Erreur de téléversement");
    } finally {
      setUploading(false);
    }
  };

  const [formData, setFormData] = useState<{
    nom: string;
    telephone: string;
    email: string;
    adresse: string;
    typeMateriel: TypeMateriel;
    panneDeclaree: string;
    modeIntervention: ModeIntervention;
    photoUrl: string;
  }>({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    typeMateriel: (initialType && Object.values(TypeMateriel).includes(initialType as TypeMateriel))
      ? (initialType as TypeMateriel)
      : TypeMateriel.PC_PORTABLE,
    panneDeclaree: "",
    modeIntervention: ModeIntervention.DEPOT_ATELIER,
    photoUrl: "",
  });

  const materialOptions = [
    { value: TypeMateriel.PC_PORTABLE, label: "PC Portable (Laptop)", icon: Laptop },
    { value: TypeMateriel.PC_BUREAU, label: "PC de Bureau / Fixe / iMac", icon: Laptop },
    { value: TypeMateriel.TV, label: "Téléviseur (LED / Smart TV)", icon: Tv },
    { value: TypeMateriel.VIDEOPROJECTEUR, label: "Vidéoprojecteur", icon: Projector },
    { value: TypeMateriel.APPAREIL_MEDICAL, label: "Appareil Biomédical (Santé)", icon: Activity },
    { value: TypeMateriel.EQUIPEMENT_TOPOGRAPHIE, label: "Matériel de Topographie", icon: Compass },
    { value: TypeMateriel.EQUIPEMENT_RESEAU, label: "Réseau / Switch / Serveur", icon: Network },
    { value: TypeMateriel.CAMERA_VIDEOSURVEILLANCE, label: "Caméras Vidéosurveillance", icon: Video },
    { value: TypeMateriel.AUTRE, label: "Autre équipement électronique", icon: Wrench },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demande-intervention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Une erreur est survenue lors de la soumission.");
      }

      setSuccessData({ numero: data.numero, type: data.type });
    } catch (err: any) {
      setError(err.message || "Impossible de joindre le serveur. Veuillez vérifier votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 subtle-shadow text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center mx-auto shadow">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-brand-dark">
            Demande Enregistrée avec Succès !
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Votre dossier a été transmis à notre équipe technique.
          </p>
        </div>

        {/* Encadré numéro de référence */}
        <div className="bg-brand-slate p-6 rounded-xl border border-brand-blue/20 inline-block w-full text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Numéro de Suivi Unique
            </span>
            <span className="text-xs font-bold bg-brand-blue-light text-brand-blue px-2.5 py-1 rounded">
              {successData.type === "CONTRACTUEL" ? "Client Sous Contrat" : "Parcours Ponctuel"}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-brand-blue tracking-wide">
            {successData.numero}
          </div>
          <p className="text-xs text-gray-600">
            Conservez précieusement ce numéro. Vous pouvez l&apos;utiliser à tout moment sur notre site pour suivre l&apos;avancement du diagnostic et de la réparation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => router.push(`/suivi/${successData.numero}`)}
            className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-md transition-all"
          >
            <span>Accéder au suivi en direct</span>
            <ArrowRight className="w-4 h-4 text-brand-green" />
          </button>
          <button
            onClick={() => {
              setSuccessData(null);
              setFormData({
                nom: "",
                telephone: "",
                email: "",
                adresse: "",
                typeMateriel: TypeMateriel.PC_PORTABLE,
                panneDeclaree: "",
                modeIntervention: ModeIntervention.DEPOT_ATELIER,
                photoUrl: "",
              });
            }}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-brand-slate text-gray-700 font-semibold py-3 px-6 rounded-xl border border-gray-300 text-xs sm:text-sm transition-all"
          >
            Déposer une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-200 subtle-shadow space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Coordonnées du déclarant */}
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs flex items-center justify-center">1</span>
            <span>Vos Coordonnées</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pour vous contacter lors de la validation du devis et vous notifier de la fin de l&apos;intervention.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nom complet ou Raison sociale *
            </label>
            <input
              type="text"
              required
              placeholder="Nom ou raison sociale"
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
            <p className="text-[10px] text-gray-500 mt-1">
              Si vous avez un contrat actif, nous le détecterons automatiquement via ce numéro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Adresse Email (recommandée)
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
              Adresse ou Quartier
            </label>
            <input
              type="text"
              placeholder="Adresse"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Type de matériel & Description de panne */}
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs flex items-center justify-center">2</span>
            <span>Matériel & Symptômes de la Panne</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Sélectionnez votre type d&apos;appareil pour orienter le dossier vers le technicien spécialisé.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Catégorie de matériel *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {materialOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = formData.typeMateriel === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, typeMateriel: opt.value })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                    isSelected
                      ? "border-brand-blue bg-brand-blue-light/70 ring-2 ring-brand-blue/30 text-brand-dark"
                      : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-brand-blue" : "text-gray-500"}`} />
                  <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Description de la panne *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Description de la panne constatée"
            value={formData.panneDeclaree}
            onChange={(e) => setFormData({ ...formData, panneDeclaree: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all"
          ></textarea>
        </div>
      </div>

      {/* 3. Mode d'intervention & Photo */}
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs flex items-center justify-center">3</span>
            <span>Mode d&apos;Intervention Souhaité</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
              formData.modeIntervention === ModeIntervention.DEPOT_ATELIER
                ? "border-brand-blue bg-brand-blue-light/60 ring-2 ring-brand-blue/30"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="modeIntervention"
              value={ModeIntervention.DEPOT_ATELIER}
              checked={formData.modeIntervention === ModeIntervention.DEPOT_ATELIER}
              onChange={() => setFormData({ ...formData, modeIntervention: ModeIntervention.DEPOT_ATELIER })}
              className="mt-1"
            />
            <div>
              <span className="text-xs font-bold text-brand-dark block">Dépôt à notre Atelier (Recommandé)</span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Gbégamey, rue avant le collège Clé de la réussite. Prise en charge immédiate avec banc de test outillé.
              </p>
            </div>
          </label>

          <label
            className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
              formData.modeIntervention === ModeIntervention.DOMICILE
                ? "border-brand-blue bg-brand-blue-light/60 ring-2 ring-brand-blue/30"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="modeIntervention"
              value={ModeIntervention.DOMICILE}
              checked={formData.modeIntervention === ModeIntervention.DOMICILE}
              onChange={() => setFormData({ ...formData, modeIntervention: ModeIntervention.DOMICILE })}
              className="mt-1"
            />
            <div>
              <span className="text-xs font-bold text-brand-dark block">Déplacement sur Site / À Domicile</span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Pour matériel lourd, baies réseaux, cliniques et installations fixes à Cotonou et environs.
              </p>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Photo de la panne / Plaque signalétique de l&apos;appareil (Optionnel)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-brand-slate hover:bg-gray-200 border border-gray-300 text-brand-dark px-4 py-2.5 rounded-xl text-xs font-bold transition-all">
              <Upload className="w-4 h-4 text-brand-blue" />
              <span>{uploading ? "Téléversement en cours..." : "Téléverser une photo / document"}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>

            {formData.photoUrl && (
              <span className="text-xs text-brand-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fichier joint avec succès</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Formats acceptés : JPG, PNG, WEBP, PDF (max 10 Mo).</p>
        </div>
      </div>

      {/* Soumission */}
      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
          <span>Données traitées en toute confidentialité sous protocole sécurisé.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-8 rounded-xl text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Enregistrement du dossier...</span>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>Valider et obtenir mon numéro de ticket</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
