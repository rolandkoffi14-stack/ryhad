"use client";

import { useState, useEffect } from "react";
import { DocumentPrintData } from "@/types/documents";
import { DocumentPrintTemplate } from "@/components/documents/DocumentPrintTemplate";
import { Printer, FileText, Receipt, ArrowLeft, MessageCircle, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatFCFA } from "@/lib/format";

interface Props {
  data: DocumentPrintData;
  initialFormat: "a4" | "ticket";
  autoPrint: boolean;
}

export function PublicDocumentClient({ data, initialFormat, autoPrint }: Props) {
  const [format, setFormat] = useState<"a4" | "ticket">(initialFormat);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const docTitle =
    data.typeFacture === "DIAGNOSTIC"
      ? "Reçu de diagnostic"
      : data.type === "DEVIS"
      ? "Devis estimatif"
      : "Facture officielle";

  const waSupportText = `Bonjour RyHaD Tic-Medic, je vous contacte concernant mon document N° ${data.numero} (${formatFCFA(data.montant)}).`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4">
      {/* Barre d'actions supérieure flottante (Masquée à l'impression) */}
      <header className="no-print w-full max-w-4xl mb-6 sticky top-3 z-50 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-300 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
            title="Retour à l'accueil RyHaD"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Accueil</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 truncate">
                {docTitle} N° {data.numero}
              </span>
              <span title="Document officiel RyHaD Tic-Medic" className="inline-flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {data.client.nom} • {formatFCFA(data.montant)}
            </p>
          </div>
        </div>

        {/* Boutons d'Action Clés */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Commutateur de formats A4 / Ticket */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFormat("a4")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                format === "a4"
                  ? "bg-white text-brand-blue shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("ticket")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                format === "ticket"
                  ? "bg-white text-brand-blue shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ticket 80mm</span>
            </button>
          </div>

          {/* GROS BOUTON VERT D'IMPRESSION / SAUVEGARDE PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ Imprimer / PDF</span>
          </button>

          {/* Bouton Suivi en Direct (si intervention liée) */}
          {data.intervention?.numero && (
            <Link
              href={`/suivi/${data.intervention.numero}`}
              className="inline-flex items-center gap-1.5 bg-brand-blue/10 hover:bg-brand-blue hover:text-white text-brand-blue px-3 py-2 rounded-xl text-xs font-bold transition-all border border-brand-blue/20"
              title="Suivre votre matériel en atelier"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Suivi</span>
            </Link>
          )}

          {/* Contacter RyHaD sur WhatsApp */}
          <a
            href={`https://wa.me/2290190881314?text=${encodeURIComponent(waSupportText)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#128C7E] px-3 py-2 rounded-xl text-xs font-bold transition-all border border-[#25D366]/30"
            title="Contacter RyHaD sur WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </header>

      {/* Rendu imprimable haute fidélité */}
      <main className="w-full flex justify-center">
        <DocumentPrintTemplate data={data} format={format} />
      </main>

      {/* Footer public discret (Masqué à l'impression) */}
      <footer className="no-print mt-8 text-center text-xs text-slate-500 pb-6 space-y-1">
        <p className="font-bold text-slate-700">RyHaD Tic-Medic • Cotonou, Bénin</p>
        <p className="text-[11px] text-slate-400">
          Document électronique certifié conforme • Tél : +229 01 90 88 13 14
        </p>
      </footer>
    </div>
  );
}
