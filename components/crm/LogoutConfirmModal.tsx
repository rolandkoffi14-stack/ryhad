"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function LogoutConfirmModal({
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-red-light text-brand-red flex items-center justify-center shrink-0 border border-brand-red/20">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-brand-dark tracking-tight">
                Confirmation de déconnexion
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                RyHaD CRM
              </p>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-gray-600 leading-relaxed pl-1">
          <p>
            Êtes-vous sûr de vouloir vous déconnecter de votre session de travail ?
          </p>
          <p className="mt-1 text-gray-500">
            Toute modification non enregistrée sera perdue. Vous devrez vous ré-authentifier pour accéder à vos dossiers.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-brand-red hover:bg-red-700 text-white shadow-sm shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Déconnexion en cours...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
