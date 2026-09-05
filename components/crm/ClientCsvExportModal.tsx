"use client";

import { useState } from "react";
import { X, Download, CheckSquare, Square, FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { ClientType } from "@prisma/client";

interface ClientExportData {
  id: string;
  type: ClientType;
  nom: string;
  contactNom: string | null;
  telephone: string;
  email: string | null;
  adresse: string | null;
  _count: {
    interventions: number;
    contrats: number;
    demandes?: number;
  };
  contrats?: {
    id: string;
    periodicite: string;
    equipementsCouverts: string;
  }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientExportData[];
}

interface ColumnOption {
  id: string;
  label: string;
  category: "Identité" | "Coordonnées" | "Activité & Contrats";
  getValue: (c: ClientExportData) => string;
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  {
    id: "type",
    label: "Type de client (Particulier / Entreprise)",
    category: "Identité",
    getValue: (c) => (c.type === ClientType.ENTREPRISE ? "Entreprise" : "Particulier"),
  },
  {
    id: "nom",
    label: "Nom complet / Raison sociale",
    category: "Identité",
    getValue: (c) => c.nom || "",
  },
  {
    id: "contactNom",
    label: "Personne de contact (Entreprises)",
    category: "Identité",
    getValue: (c) => c.contactNom || "",
  },
  {
    id: "telephone",
    label: "Numéro de téléphone",
    category: "Coordonnées",
    getValue: (c) => c.telephone || "",
  },
  {
    id: "email",
    label: "Adresse e-mail",
    category: "Coordonnées",
    getValue: (c) => c.email || "",
  },
  {
    id: "adresse",
    label: "Adresse géographique / Quartier",
    category: "Coordonnées",
    getValue: (c) => c.adresse || "",
  },
  {
    id: "interventions",
    label: "Nombre total d'interventions",
    category: "Activité & Contrats",
    getValue: (c) => String(c._count?.interventions || 0),
  },
  {
    id: "hasContrat",
    label: "Contrat de maintenance actif (Oui / Non)",
    category: "Activité & Contrats",
    getValue: (c) => (c.contrats && c.contrats.length > 0 ? "Oui" : "Non"),
  },
  {
    id: "periodiciteContrat",
    label: "Périodicité du contrat",
    category: "Activité & Contrats",
    getValue: (c) =>
      c.contrats && c.contrats.length > 0
        ? c.contrats.map((con) => con.periodicite).join(" | ")
        : "Aucun",
  },
  {
    id: "equipementsContrat",
    label: "Équipements couverts par contrat",
    category: "Activité & Contrats",
    getValue: (c) =>
      c.contrats && c.contrats.length > 0
        ? c.contrats.map((con) => con.equipementsCouverts).join(" | ")
        : "Aucun",
  },
];

const DEFAULT_SELECTED_COLUMNS = [
  "type",
  "nom",
  "contactNom",
  "telephone",
  "email",
  "adresse",
  "interventions",
  "hasContrat",
];

export function ClientCsvExportModal({ isOpen, onClose, clients }: Props) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);
  const [separator, setSeparator] = useState<";" | ",">(";");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const selectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map((col) => col.id));
  };

  const selectStandard = () => {
    setSelectedColumns(DEFAULT_SELECTED_COLUMNS);
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const handleDownloadCsv = () => {
    if (selectedColumns.length === 0) return;
    setIsExporting(true);

    try {
      const activeColumns = AVAILABLE_COLUMNS.filter((col) => selectedColumns.includes(col.id));

      // En-têtes CSV
      const headers = activeColumns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(separator);

      // Lignes de données
      const rows = clients.map((client) => {
        return activeColumns
          .map((col) => {
            const val = col.getValue(client).replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(separator);
      });

      // Contenu CSV avec BOM UTF-8 (\uFEFF) pour compatibilité Excel
      const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `clients_ryhad_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error("Erreur lors de l'export CSV:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const categories = ["Identité", "Coordonnées", "Activité & Contrats"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Exporter les Clients en CSV
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {clients.length} client(s) sélectionné(s) pour l&apos;exportation Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Actions de sélection rapide */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-blue" />
              Colonnes à inclure ({selectedColumns.length}/{AVAILABLE_COLUMNS.length}) :
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectStandard}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                Standard
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Tout cocher
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Tout décocher
              </button>
            </div>
          </div>

          {/* Liste des colonnes par catégorie */}
          <div className="space-y-4">
            {categories.map((cat) => {
              const catCols = AVAILABLE_COLUMNS.filter((col) => col.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {cat}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {catCols.map((col) => {
                      const isChecked = selectedColumns.includes(col.id);
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => toggleColumn(col.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs ${
                            isChecked
                              ? "bg-brand-blue/5 border-brand-blue/30 text-slate-900 font-semibold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className="leading-snug">{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Format & Séparateur */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Séparateur CSV</p>
              <p className="text-[11px] text-slate-400">
                Point-virgule recommandé pour Microsoft Excel en français
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeparator(";")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  separator === ";"
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Point-virgule ( ; )
              </button>
              <button
                type="button"
                onClick={() => setSeparator(",")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  separator === ","
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Virgule ( , )
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={selectedColumns.length === 0 || isExporting}
            className="inline-flex items-center gap-2 bg-brand-green hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? "Génération en cours..."
                : `Télécharger le CSV (${selectedColumns.length} colonnes)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
