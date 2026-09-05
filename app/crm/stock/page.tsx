import { db } from "@/lib/db";
import { Package, AlertTriangle, CheckCircle2, Plus } from "lucide-react";

export const metadata = {
  title: "Stock & Pièces",
};

export const dynamic = "force-dynamic";

export default async function CrmStockPage() {
  let pieces: any[] = [];

  try {
    pieces = await db.piece.findMany({
      orderBy: { nom: "asc" },
    });
  } catch (e) {
    console.error("Error loading stock:", e);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Inventaire & Stock de Pièces Détachées
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestion des composants électroniques, dalles, lampes de vidéoprojecteur et consommables biomédicaux en atelier.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 subtle-shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-brand-slate/40 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">
            {pieces.length} référence(s) en catalogue atelier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Référence / Désignation Pièce</th>
                <th className="px-6 py-3.5 text-center">Quantité en Stock</th>
                <th className="px-6 py-3.5 text-center">Seuil d&apos;Alerte</th>
                <th className="px-6 py-3.5">État du Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {pieces.map((p) => {
                const isLow = p.quantiteStock <= p.seuilAlerte;
                return (
                  <tr key={p.id} className="hover:bg-brand-slate/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-dark">{p.nom}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-sm text-brand-dark">
                      {p.quantiteStock}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-semibold">
                      {p.seuilAlerte}
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-red bg-brand-red-light px-2.5 py-1 rounded-md border border-brand-red/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Stock Critique (Réapprovisionner)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Disponible</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {pieces.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Aucune pièce enregistrée. Les pièces sont automatiquement ajoutées lors de la saisie sur les tickets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
