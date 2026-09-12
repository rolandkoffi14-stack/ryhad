"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  Download,
  MessageCircle,
  FileText,
  Receipt,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { DocumentPrintData } from "@/types/documents";
import { DocumentPrintTemplate } from "@/components/documents/DocumentPrintTemplate";
import { formatFCFA } from "@/lib/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentNumero?: string | null;
  documentData?: DocumentPrintData | null;
  defaultFormat?: "a4" | "ticket";
  titre?: string;
}

export function PrintDocumentModal({
  isOpen,
  onClose,
  documentNumero,
  documentData: initialData,
  defaultFormat = "a4",
  titre,
}: Props) {
  const [format, setFormat] = useState<"a4" | "ticket">(defaultFormat);
  const [data, setData] = useState<DocumentPrintData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (defaultFormat) {
      setFormat(defaultFormat);
    }
  }, [defaultFormat, isOpen]);

  // Si on a initialData, l'utiliser immédiatement
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setError(null);
    }
  }, [initialData]);

  // Si on a seulement documentNumero sans initialData, fetcher via l'API JSON
  useEffect(() => {
    if (isOpen && documentNumero && !initialData) {
      setLoading(true);
      setError(null);
      fetch(`/api/documents/${encodeURIComponent(documentNumero.trim())}`)
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Erreur lors du chargement du document.");
          }
          setData(json.data);
        })
        .catch((err: any) => {
          setError(err.message || "Impossible de récupérer les détails du document.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, documentNumero, initialData]);

  // Gestion de la touche Échap
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

  if (!isOpen || !mounted) return null;

  const handleTriggerPrint = () => {
    // Déclenchement de l'impression native du navigateur
    window.print();
  };

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://ryhad.bj";
  const docNum = data?.numero || documentNumero || "";

  // Préparation du message WhatsApp officiel RyHaD
  let waText = "";
  if (data) {
    const clientNom = data.client.nom;
    const typeLibelle = data.typeFacture === "DIAGNOSTIC" ? "Reçu de diagnostic" : data.type === "DEVIS" ? "Devis" : "Facture";
    waText = `Bonjour ${clientNom},\n\nVoici votre ${typeLibelle} officiel RyHaD Tic-Medic :\n📄 N° : ${data.numero}\n💰 Montant : ${formatFCFA(data.montant)}\n\n👉 Télécharger votre document officiel :\n${appOrigin}/api/documents/${data.numero}/pdf`;
    if (data.intervention?.numero) {
      waText += `\n\n🔍 Suivi de votre matériel en direct :\n${appOrigin}/suivi/${data.intervention.numero}`;
    }
    waText += `\n\nRyHaD Tic-Medic • Gbégamey, Cotonou\nTél : +229 01 90 88 13 14`;
  }

  return createPortal(
    <div className="print-modal-overlay fixed inset-0 z-[99999] flex flex-col items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Styles d'impression globaux pour isoler le document lors de window.print() */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Masquer tout le corps du site CRM et de la page */
          body * {
            visibility: hidden !important;
          }
          /* Afficher uniquement la zone imprimable */
          .printable-document-area, .printable-document-area * {
            visibility: visible !important;
          }
          .printable-document-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .no-print, .print-modal-overlay > :not(.print-content-wrapper), .modal-header-actions {
            display: none !important;
          }
        }
      `}} />

      <div className="print-content-wrapper bg-slate-100 sm:rounded-3xl shadow-2xl border border-slate-300 w-full max-w-4xl h-full sm:h-[94vh] flex flex-col overflow-hidden">
        {/* Barre Supérieure d'Actions (Masquée à l'impression) */}
        <div className="no-print modal-header-actions bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 truncate">
                {titre || `Impression : ${docNum}`}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {data ? `${data.client.nom} • ${formatFCFA(data.montant)}` : "Chargement..."}
              </p>
            </div>
          </div>

          {/* Commutateur de formats A4 / Ticket */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFormat("a4")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                format === "a4"
                  ? "bg-white text-brand-blue shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format A4</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("ticket")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                format === "ticket"
                  ? "bg-white text-brand-blue shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ticket 80 mm</span>
            </button>
          </div>

          {/* Boutons d'Action Clés */}
          <div className="flex items-center gap-2">
            {/* GROS BOUTON VERT D'IMPRESSION IMMÉDIATE */}
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Imprimer Immédiatement</span>
            </button>

            {/* Partager WhatsApp */}
            {data && data.client.telephone && (
              <a
                href={`https://wa.me/${data.client.telephone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                title="Transmettre au client sur WhatsApp"
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-[#25D366]/30"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Télécharger PDF binaire officiel */}
            {docNum && (
              <a
                href={`/api/documents/${encodeURIComponent(docNum)}/pdf?download=true`}
                target="_blank"
                rel="noreferrer"
                title="Télécharger fichier PDF officiel"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </a>
            )}

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps avec Aperçu Live & Zone Imprimable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/80">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3 m-auto">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
              <p className="text-xs font-bold">Génération de l&apos;aperçu imprimable...</p>
            </div>
          )}

          {error && (
            <div className="m-auto max-w-md p-5 rounded-2xl bg-white border border-red-200 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Erreur de chargement</h3>
              <p className="text-xs text-slate-600">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Fermer
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="printable-document-area w-full flex justify-center">
              <DocumentPrintTemplate data={data} format={format} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
