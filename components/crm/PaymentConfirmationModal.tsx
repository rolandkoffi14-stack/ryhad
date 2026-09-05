"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  CheckCircle2,
  X,
  Banknote,
  Smartphone,
  Building2,
  FileCheck2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatFCFA } from "@/lib/format";

export interface PaymentMethodOption {
  id: string;
  label: string;
  sublabel: string;
  icon: any;
  colorClass: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "ESPECES",
    label: "Espèces (Cash)",
    sublabel: "Paiement direct au comptoir",
    icon: Banknote,
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-300 peer-checked:bg-emerald-100 peer-checked:border-emerald-600",
  },
  {
    id: "MTN_MOMO",
    label: "MTN Mobile Money",
    sublabel: "MoMo Pay / Transfert direct",
    icon: Smartphone,
    colorClass: "bg-amber-50 text-amber-900 border-amber-300 peer-checked:bg-amber-100 peer-checked:border-amber-600",
  },
  {
    id: "MOOV_MONEY",
    label: "Moov Money",
    sublabel: "Flooz / Moov Money Bénin",
    icon: Smartphone,
    colorClass: "bg-blue-50 text-blue-900 border-blue-300 peer-checked:bg-blue-100 peer-checked:border-blue-600",
  },
  {
    id: "CARTE_BANCAIRE",
    label: "Carte Bancaire (TPE)",
    sublabel: "Terminal de paiement électronique",
    icon: CreditCard,
    colorClass: "bg-indigo-50 text-indigo-900 border-indigo-300 peer-checked:bg-indigo-100 peer-checked:border-indigo-600",
  },
  {
    id: "VIREMENT",
    label: "Virement Bancaire",
    sublabel: "Compte entreprise RyHaD",
    icon: Building2,
    colorClass: "bg-purple-50 text-purple-900 border-purple-300 peer-checked:bg-purple-100 peer-checked:border-purple-600",
  },
  {
    id: "CHEQUE",
    label: "Chèque Bancaire",
    sublabel: "À l'ordre de RyHaD Tic-Medic",
    icon: FileCheck2,
    colorClass: "bg-gray-50 text-gray-800 border-gray-300 peer-checked:bg-gray-100 peer-checked:border-gray-600",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: string, reference?: string) => Promise<void> | void;
  montant: number;
  titre?: string;
  description?: string;
  loading?: boolean;
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  montant,
  titre = "Confirmation de l'Encaissement",
  description = "Veuillez sélectionner le moyen par lequel le client a effectué le règlement.",
  loading = false,
}: Props) {
  const [selectedMethod, setSelectedMethod] = useState("ESPECES");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onConfirm(selectedMethod, reference.trim() || undefined);
      setReference("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'encaissement.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-brand-slate/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-green/20 text-brand-green-dark flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-dark tracking-tight">{titre}</h2>
              <p className="text-[11px] text-gray-500">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Montant mis en avant */}
          <div className="p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 text-center space-y-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Montant à Encaisser
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-blue tracking-tight">
              {formatFCFA(montant)}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grille des modes de paiement */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-brand-dark block">
              Sélectionnez le mode de règlement <span className="text-brand-red">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-blue/10 border-brand-blue text-brand-dark shadow-2xs ring-1 ring-brand-blue"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => setSelectedMethod(method.id)}
                      className="sr-only"
                    />
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold leading-tight">{method.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate">{method.sublabel}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Référence ou transaction facultative */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-gray-700 block">
              Référence / ID de transaction / N° Chèque{" "}
              <span className="text-gray-400 font-normal">(Facultatif)</span>
            </label>
            <input
              type="text"
              placeholder="Référence de paiement"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
            />
          </div>

          {/* Boutons d'action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Validation en cours..." : "Valider l'Encaissement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
