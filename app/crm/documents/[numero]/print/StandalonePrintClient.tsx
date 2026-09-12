"use client";

import { useState, useEffect } from "react";
import { DocumentPrintData } from "@/types/documents";
import { DocumentPrintTemplate } from "@/components/documents/DocumentPrintTemplate";
import { Printer, FileText, Receipt, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  data: DocumentPrintData;
  initialFormat: "a4" | "ticket";
  autoPrint: boolean;
}

export function StandalonePrintClient({ data, initialFormat, autoPrint }: Props) {
  const [format, setFormat] = useState<"a4" | "ticket">(initialFormat);

  useEffect(() => {
    if (autoPrint) {
      // Petite pause pour s'assurer du rendu complet du CSS
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-4 sm:py-8">
      {/* Barre d'outils flottante masquée à l'impression */}
      <div className="no-print mb-6 sticky top-4 z-50 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-300 shadow-lg flex items-center gap-3">
        <Link
          href="/crm/documents"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Retour aux documents</span>
        </Link>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Commutateur A4 / Ticket */}
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

        {/* Gros bouton vert d'impression */}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>🖨️ Imprimer</span>
        </button>
      </div>

      {/* Zone imprimable */}
      <div className="w-full flex justify-center">
        <DocumentPrintTemplate data={data} format={format} />
      </div>
    </div>
  );
}
