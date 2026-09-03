"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Tv,
  GraduationCap,
  Wrench,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
  Search,
  Eye,
} from "lucide-react";
import { TypeDemandeCommerciale, DemandeStatut } from "@prisma/client";
import { formatFCFA } from "@/lib/format";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RequestItem {
  id: string;
  typeDemande: TypeDemandeCommerciale;
  description: string;
  statut: DemandeStatut;
  montantTotal?: number | null;
  lignesCotation?: string | null;
  notesInternes?: string | null;
  createdAt: string;
  client: {
    nom: string;
    telephone: string;
    email: string | null;
    adresse?: string | null;
  } | null;
}

interface Props {
  demandes: RequestItem[];
}

export function CommercialRequestsTable({ demandes }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick View Modal
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const getTypeIcon = (type: TypeDemandeCommerciale) => {
    switch (type) {
      case TypeDemandeCommerciale.VENTE_MATERIEL:
        return <ShoppingBag className="w-4 h-4 text-brand-blue" />;
      case TypeDemandeCommerciale.LOCATION_VIDEOPROJECTEUR:
        return <Tv className="w-4 h-4 text-purple-600" />;
      case TypeDemandeCommerciale.FORMATION:
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Wrench className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (statut: DemandeStatut) => {
    switch (statut) {
      case DemandeStatut.NOUVEAU:
        return {
          label: "Nouveau",
          className: "bg-amber-100 text-amber-800 border-amber-300 font-extrabold",
        };
      case DemandeStatut.EN_COURS:
        return {
          label: "En cours",
          className: "bg-blue-100 text-brand-blue border-blue-300 font-extrabold",
        };
      case DemandeStatut.DEVIS_ENVOYE:
        return {
          label: "Devis émis",
          className: "bg-purple-100 text-purple-800 border-purple-300 font-extrabold",
        };
      case DemandeStatut.DEVIS_ACCEPTE:
        return {
          label: "Devis validé",
          className: "bg-amber-50 text-amber-900 border-amber-400 font-extrabold",
        };
      case DemandeStatut.DEVIS_REFUSE:
        return {
          label: "Devis refusé",
          className: "bg-red-100 text-red-800 border-red-300 font-extrabold",
        };
      case DemandeStatut.FACTURE_PAYEE:
        return {
          label: "Facture réglée",
          className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold",
        };
      case DemandeStatut.TRAITE:
        return {
          label: "Traité",
          className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold",
        };
      case DemandeStatut.CLOS:
        return {
          label: "Clôturé",
          className: "bg-gray-100 text-gray-700 border-gray-300 font-bold",
        };
      default:
        return {
          label: statut,
          className: "bg-gray-100 text-gray-700 border-gray-300 font-bold",
        };
    }
  };

  // Filtrage
  const filteredDemandes = useMemo(() => {
    return demandes.filter((d) => {
      if (statusFilter !== "ALL" && d.statut !== statusFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clientNom = (d.client?.nom || "").toLowerCase();
        const clientTel = (d.client?.telephone || "").toLowerCase();
        const type = d.typeDemande.toLowerCase();
        const desc = d.description.toLowerCase();

        if (
          !clientNom.includes(term) &&
          !clientTel.includes(term) &&
          !type.includes(term) &&
          !desc.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [demandes, searchTerm, statusFilter]);

  // Pagination
  const totalItems = filteredDemandes.length;
  const paginatedDemandes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDemandes.slice(start, start + pageSize);
  }, [filteredDemandes, currentPage, pageSize]);

  const handleOpenQuickView = (d: RequestItem) => {
    const badge = getStatusBadge(d.statut);
    let parsedArticles: any[] = [];
    if (d.lignesCotation) {
      try {
        parsedArticles = JSON.parse(d.lignesCotation);
      } catch (e) {}
    }

    setQuickViewData({
      type: "COMMERCIAL",
      title: `Demande : ${d.typeDemande.replace(/_/g, " ")}`,
      subtitle: `${d.client?.nom || "Prospect"} — Reçue le ${format(
        new Date(d.createdAt),
        "dd/MM/yyyy",
        { locale: fr }
      )}`,
      badge,
      linkHref: `/crm/demandes-commerciales/${d.id}`,
      linkLabel: "Traiter la demande complète →",
      clientName: d.client?.nom,
      clientPhone: d.client?.telephone,
      details: [
        { label: "Type de besoin", value: d.typeDemande.replace(/_/g, " ") },
        { label: "Prospect / Contact", value: `${d.client?.nom || "Non identifié"} (${d.client?.telephone || "N/A"})` },
        { label: "Description du besoin", value: d.description },
        {
          label: "Montant cotation",
          value: d.montantTotal ? formatFCFA(d.montantTotal) : "Non chiffré pour le moment",
        },
        {
          label: "Articles / Lignes cotées",
          value: parsedArticles.length > 0 ? (
            <div className="space-y-1">
              {parsedArticles.map((a, i) => (
                <div key={i}>
                  {a.designation} ({a.quantite} x {formatFCFA(a.prixUnitaire)})
                </div>
              ))}
            </div>
          ) : (
            "Aucun article saisi"
          ),
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
      {/* Barre supérieure : Recherche & Filtres */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une demande..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: DemandeStatut.NOUVEAU, label: "Nouveaux" },
            { id: DemandeStatut.EN_COURS, label: "En Cours" },
            { id: DemandeStatut.DEVIS_ENVOYE, label: "Devis Émis" },
            { id: DemandeStatut.DEVIS_ACCEPTE, label: "Devis Validés" },
            { id: DemandeStatut.FACTURE_PAYEE, label: "Payés" },
            { id: DemandeStatut.CLOS, label: "Clôturés" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-brand-blue text-white shadow-2xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau Allégé */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-slate text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-5 py-3.5">Type & Date</th>
              <th className="px-5 py-3.5">Contact / Prospect</th>
              <th className="px-5 py-3.5">Montant Devis</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {paginatedDemandes.map((d) => {
              const badge = getStatusBadge(d.statut);
              const clientPhone = d.client?.telephone || "";
              const clientCleanPhone = clientPhone.replace(/[^0-9]/g, "");

              return (
                <tr key={d.id} className="hover:bg-brand-slate/40 transition-colors">
                  {/* 1. Type & Date */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-brand-slate shrink-0">{getTypeIcon(d.typeDemande)}</div>
                      <div>
                        <span className="font-extrabold text-brand-dark block text-xs">
                          {d.typeDemande.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(d.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Contact & WhatsApp */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-brand-dark">{d.client?.nom || "Prospect non identifié"}</div>
                    {clientPhone && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-500">{clientPhone}</span>
                        <a
                          href={`https://wa.me/${clientCleanPhone}?text=${encodeURIComponent(
                            `Bonjour ${d.client?.nom}, nous faisons suite à votre demande "${d.typeDemande.replace(
                              /_/g,
                              " "
                            )}" chez RyHaD Tic-Medic.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                          className="text-[#25D366] hover:opacity-80 p-0.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </td>

                  {/* 3. Montant */}
                  <td className="px-5 py-3.5">
                    {d.montantTotal ? (
                      <span className="font-extrabold text-brand-blue text-xs">
                        {formatFCFA(d.montantTotal)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">Non chiffré</span>
                    )}
                  </td>

                  {/* 4. Statut */}
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] border inline-block ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>

                  {/* 5. Actions (Œil + Lien Traiter) */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(d)}
                        title="Aperçu rapide"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/crm/demandes-commerciales/${d.id}`}
                        className="inline-flex items-center gap-1 bg-brand-slate hover:bg-brand-blue hover:text-white px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all text-brand-dark shadow-2xs"
                      >
                        <span>Traiter</span>
                        <ArrowRight className="w-3 h-3 text-brand-green" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedDemandes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Aucune demande ne correspond aux critères de recherche."
                    : "Aucune demande commerciale en attente."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={quickViewData}
      />
    </div>
  );
}
