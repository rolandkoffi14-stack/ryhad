"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, ArrowRight, Phone, MessageCircle, AlertCircle, RefreshCw } from "lucide-react";
import { DocumentPrintData } from "@/types/documents";

interface Props {
  documentNumero: string;
  documentType: string;
  maskedClientName: string;
  onUnlocked: (data: DocumentPrintData) => void;
}

export function DocumentUnlockGate({
  documentNumero,
  documentType,
  maskedClientName,
  onUnlocked,
}: Props) {
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = digits.trim().replace(/\D/g, "");
    if (cleanDigits.length < 4) {
      setError("Veuillez saisir au moins les 4 derniers chiffres de votre numéro de téléphone.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/documents/${encodeURIComponent(documentNumero.trim())}?phone=${cleanDigits}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur lors de la vérification.");
      }

      if (json.isUnlocked && json.data) {
        // Mettre à jour l'URL de manière transparente pour persister le déverrouillage
        if (typeof window !== "undefined") {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set("phone", cleanDigits);
          window.history.replaceState(null, "", currentUrl.toString());
        }
        onUnlocked(json.data);
      } else {
        setError(
          "Les 4 chiffres saisis ne correspondent pas au numéro de téléphone enregistré sur ce dossier. Veuillez vérifier ou contacter notre atelier."
        );
      }
    } catch (err: any) {
      setError(err.message || "Impossible de vérifier votre identité. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const typeLabel =
    documentType === "DEVIS"
      ? "Devis estimatif officiel"
      : documentType === "RECU_DIAGNOSTIC"
      ? "Reçu de diagnostic officiel"
      : "Facture officielle";

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
      {/* Badge & Titre */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-4 ring-8 ring-brand-blue/5">
          <Lock className="w-7 h-7 text-brand-blue" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
          <span>Espace Client Sécurisé • RyHaD Tic-Medic</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Consultation Confidentielle
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm">
          Pour protéger vos données personnelles et le détail de vos prestations, veuillez confirmer votre identité.
        </p>
      </div>

      {/* Détails du document masqué */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6 text-xs space-y-2">
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-500">Document :</span>
          <span className="font-bold text-slate-900">{typeLabel}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-500">Numéro de référence :</span>
          <span className="font-mono font-bold text-brand-blue bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {documentNumero}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-500">Bénéficiaire :</span>
          <span className="font-bold text-slate-800">{maskedClientName}</span>
        </div>
      </div>

      {/* Formulaire de saisie des 4 chiffres */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="phone-digits"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Saisissez les 4 derniers chiffres de votre téléphone
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="phone-digits"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={12}
              value={digits}
              onChange={(e) => {
                setDigits(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="Ex : 1314"
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-300 focus:border-brand-blue rounded-xl text-center text-lg sm:text-xl font-mono font-black text-slate-900 tracking-widest outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:ring-4 focus:ring-brand-blue/10"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Exemple : Si votre numéro est le +229 01 90 88 <strong>13 14</strong>, entrez <strong>1314</strong>.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || digits.replace(/\D/g, "").length < 4}
          className="w-full py-3.5 px-4 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Vérification sécurisée...</span>
            </>
          ) : (
            <>
              <span>Afficher mon document officiel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Support WhatsApp en cas de difficulté */}
      <div className="mt-6 pt-5 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500 mb-2">Un souci pour accéder à votre document ?</p>
        <a
          href={`https://wa.me/2290190881314?text=${encodeURIComponent(
            `Bonjour RyHaD Tic-Medic, j'ai une question concernant l'accès à mon document N° ${documentNumero}.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#128C7E] hover:underline"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Assistance atelier sur WhatsApp (+229 01 90 88 13 14)</span>
        </a>
      </div>
    </div>
  );
}
