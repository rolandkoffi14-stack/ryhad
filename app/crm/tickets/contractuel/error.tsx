"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ContractuelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur sur l'espace Contrats / Tickets contractuels:", error);
  }, [error]);

  return (
    <div className="p-4 sm:p-8 flex items-center justify-center min-h-[50vh]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-extrabold text-brand-dark tracking-tight">
            Chargement des contrats interrompu
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            La synchronisation des dossiers d'entreprises sous contrat a pris plus de temps que prévu avec la base de données.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Relancer</span>
          </button>

          <Link
            href="/crm/tickets/ponctuel"
            prefetch={false}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tickets ponctuels</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
