"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, Loader2 } from "lucide-react";

export type ConfirmationModalVariant = "danger" | "warning" | "info" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationModalVariant;
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "warning",
  loading = false,
}: Props) {
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

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-6 h-6 text-brand-red" />,
          iconBg: "bg-brand-red-light text-brand-red",
          btnClass: "bg-brand-red hover:bg-red-700 text-white shadow-brand-red/20",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: "bg-amber-100 text-amber-700",
          btnClass: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-brand-green" />,
          iconBg: "bg-brand-green/10 text-brand-green",
          btnClass: "bg-brand-green hover:bg-emerald-700 text-white shadow-brand-green/20",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-6 h-6 text-brand-blue" />,
          iconBg: "bg-brand-blue-light text-brand-blue",
          btnClass: "bg-brand-blue hover:bg-brand-blue-dark text-white shadow-brand-blue/20",
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-brand-dark tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-gray-600 leading-relaxed pl-1">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50 ${styles.btnClass}`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
