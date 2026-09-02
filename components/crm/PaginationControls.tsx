"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: Props) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= pageSize && totalItems <= (pageSizeOptions[0] || 10)) {
    // Si moins d'éléments que la plus petite taille de page et 1 seule page, simple info sans boutons inutiles
    return (
      <div className="p-3.5 border-t border-gray-100 bg-brand-slate/30 flex items-center justify-between text-xs text-gray-500">
        <span>
          {totalItems} élément{totalItems > 1 ? "s" : ""} au total
        </span>
      </div>
    );
  }

  // Génération des numéros de pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="p-3.5 border-t border-gray-100 bg-brand-slate/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      {/* Informations de pagination */}
      <div className="flex items-center gap-2 text-gray-600">
        <span>
          Affichage de <strong className="text-brand-dark">{startItem}</strong> à{" "}
          <strong className="text-brand-dark">{endItem}</strong> sur{" "}
          <strong className="text-brand-dark">{totalItems}</strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[11px] text-gray-400">| Par page :</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-brand-blue"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Page précédente"
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-bold">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(Number(page))}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                isCurrent
                  ? "bg-brand-blue text-white shadow-2xs"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Page suivante"
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
