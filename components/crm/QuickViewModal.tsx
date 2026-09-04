"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  X,
  ArrowRight,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  User,
  Wrench,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { TicketStatusBadge } from "@/components/crm/TicketStatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface QuickViewData {
  type: "TICKET" | "CLIENT" | "CONTRAT" | "COMMERCIAL" | "DOCUMENT" | "UTILISATEUR";
  title: string;
  subtitle?: string;
  badge?: { label: string; className: string } | null;
  status?: any;
  linkHref?: string;
  linkLabel?: string;
  details: { label: string; value: React.ReactNode }[];
  clientPhone?: string;
  clientName?: string;
  pdfUrl?: string;
  raw?: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: QuickViewData | null;
}

export function QuickViewModal({ isOpen, onClose, data }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const clientCleanPhone = data.clientPhone ? data.clientPhone.replace(/[^0-9]/g, "") : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header de la modale */}
        <div className="p-5 border-b border-gray-100 bg-brand-slate/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-brand-dark tracking-tight truncate">
                  {data.title}
                </h2>
                {data.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${data.badge.className}`}>
                    {data.badge.label}
                  </span>
                )}
                {data.status && data.type === "TICKET" && (
                  <TicketStatusBadge statut={data.status} />
                )}
              </div>
              {data.subtitle && (
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{data.subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps avec les détails essentiels */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Action rapide WhatsApp / Appel si téléphone disponible */}
          {data.clientPhone && (
            <div className="p-3 rounded-2xl bg-brand-slate border border-gray-100 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Contact Rapide
                </span>
                <span className="font-extrabold text-brand-dark text-xs truncate block">
                  {data.clientName || data.clientPhone}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`https://wa.me/${clientCleanPhone}?text=${encodeURIComponent(
                    `Bonjour ${data.clientName || ""}, nous vous contactons concernant votre dossier chez RyHaD Tic-Medic.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] transition-all border border-[#25D366]/30 shadow-2xs"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${data.clientPhone}`}
                  className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all border border-gray-200"
                >
                  <Phone className="w-3 h-3 text-gray-500" />
                  <span>Appeler</span>
                </a>
              </div>
            </div>
          )}

          {/* Grille des champs */}
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
            {data.details.map((item, idx) => (
              <div
                key={`detail-${idx}`}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-brand-slate/30 transition-colors"
              >
                <span className="font-bold text-gray-500 text-[11px] shrink-0 sm:w-1/3">
                  {item.label}
                </span>
                <div className="font-semibold text-brand-dark text-xs sm:text-right sm:w-2/3 break-words">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Téléchargement PDF si applicable */}
          {data.pdfUrl && (
            <div className="pt-2">
              <a
                href={data.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs shadow-2xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-brand-green" />
                <span>Télécharger Document PDF</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer avec lien vers la fiche complète */}
        <div className="p-4 border-t border-gray-100 bg-brand-slate/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-white transition-colors"
          >
            Fermer
          </button>

          {data.linkHref && (
            <Link
              href={data.linkHref}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-extrabold shadow-2xs transition-all"
            >
              <span>{data.linkLabel || "Ouvrir la fiche complète"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-green" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
