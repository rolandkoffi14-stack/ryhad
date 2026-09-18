"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function CrmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur interceptée par le CRM Error Boundary:", error);
  }, [error]);

  const is502OrNetwork =
    error?.message?.includes("502") ||
    error?.message?.includes("fetch") ||
    error?.message?.includes("network") ||
    error?.message?.includes("Gateway");

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-brand-red flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-brand-dark tracking-tight">
            {is502OrNetwork
              ? "Communication serveur interrompue"
              : "Une anomalie temporaire est survenue"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {is502OrNetwork
              ? "Le serveur distant a mis trop de temps à répondre ou redémarre (code 502). Vos données enregistrées sont parfaitement sécurisées."
              : "Le chargement de cet écran a rencontré une erreur imprévue. Vous pouvez relancer la requête immédiatement sans perdre votre session."}
          </p>
        </div>

        {error?.digest && (
          <div className="text-[11px] font-mono text-gray-400 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100 select-all">
            Réf : {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>

          <Link
            href="/crm"
            prefetch={false}
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
