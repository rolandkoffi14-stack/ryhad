"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Eye, ArrowRight, Ticket, ClipboardList, Phone } from "lucide-react";
import { InterventionStatut, InterventionType, StaffRole } from "@prisma/client";
import { TicketStatusBadge } from "@/components/crm/TicketStatusBadge";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TicketItem {
  id: string;
  numero: string;
  type: InterventionType;
  statut: InterventionStatut;
  typeMateriel: string;
  panneDeclaree: string;
  modeIntervention: string;
  dateCreation: string;
  client: {
    nom: string;
    telephone: string;
    adresse?: string | null;
  };
  contract?: {
    id: string;
    equipementsCouverts: string;
  } | null;
  technicienAssigne?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  documents?: {
    id: string;
    numero: string;
    type: string;
    typeFacture?: string | null;
    statutPaiement: string;
    montant: number;
  }[];
}

interface Props {
  tickets: TicketItem[];
  userRole: StaffRole;
}

export function DashboardRecentTicketsTable({ tickets, userRole }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick View Modal
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (typeFilter === "PONCTUEL" && t.type !== InterventionType.PONCTUEL) return false;
      if (typeFilter === "CONTRACTUEL" && t.type !== InterventionType.CONTRACTUEL) return false;
      if (typeFilter === "EN_COURS" && (t.statut === InterventionStatut.LIVRE_CLOTURE || t.statut === InterventionStatut.CLOTURE)) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const num = t.numero.toLowerCase();
        const clientNom = (t.client?.nom || "").toLowerCase();
        const clientTel = (t.client?.telephone || "").toLowerCase();
        const mat = t.typeMateriel.toLowerCase();
        const panne = t.panneDeclaree.toLowerCase();
        const tech = t.technicienAssigne ? `${t.technicienAssigne.firstName} ${t.technicienAssigne.lastName}`.toLowerCase() : "";

        if (
          !num.includes(term) &&
          !clientNom.includes(term) &&
          !clientTel.includes(term) &&
          !mat.includes(term) &&
          !panne.includes(term) &&
          !tech.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, searchTerm, typeFilter]);

  const totalItems = filteredTickets.length;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const handleOpenQuickView = (t: TicketItem) => {
    const isContract = t.type === InterventionType.CONTRACTUEL;
    const repDoc = t.documents?.find(
      (d) => d.type === "FACTURE" && d.typeFacture === "REPARATION"
    );
    const isRepPaid = !repDoc || repDoc.statutPaiement === "PAYE";

    setQuickViewData({
      type: "TICKET",
      title: `${t.numero} — ${t.typeMateriel.replace(/_/g, " ")}`,
      subtitle: `${t.client.nom} — Créé le ${format(new Date(t.dateCreation), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
      badge: {
        label: t.statut.replace(/_/g, " "),
        className: "bg-blue-100 text-brand-blue border-blue-300 font-bold",
      },
      linkHref: `/crm/tickets/${t.id}`,
      linkLabel: "Ouvrir la fiche complète du dossier →",
      clientName: t.client.nom,
      clientPhone: t.client.telephone,
      details: [
        { label: "Numéro de référence", value: t.numero },
        { label: "Parcours", value: isContract ? "Intervention Contrat Entreprise" : "Réparation Atelier Ponctuel" },
        { label: "Client / Bénéficiaire", value: `${t.client.nom} (${t.client.telephone})` },
        { label: "Type d'appareil", value: t.typeMateriel.replace(/_/g, " ") },
        { label: "Mode d'intervention", value: t.modeIntervention },
        { label: "Panne déclarée au dépôt", value: t.panneDeclaree },
        {
          label: "Technicien assigné",
          value: t.technicienAssigne ? `${t.technicienAssigne.firstName} ${t.technicienAssigne.lastName}` : "Non assigné pour le moment",
        },
        {
          label: "Règlement réparation",
          value: isContract ? "Inclus dans le forfait contrat" : isRepPaid ? "Réglé / Payé" : "En attente de paiement",
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
      {/* Header & Filtres */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une intervention..."
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
            { id: "EN_COURS", label: "Actifs en cours" },
            { id: "PONCTUEL", label: "Ponctuels" },
            { id: "CONTRACTUEL", label: "Contrats" },
          ].map((tab) => {
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTypeFilter(tab.id);
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
              <th className="px-5 py-3.5">Référence & Parcours</th>
              <th className="px-5 py-3.5">Client & Appareil</th>
              {userRole !== StaffRole.TECHNICIEN && <th className="px-5 py-3.5">Technicien</th>}
              <th className="px-5 py-3.5">Statut Actuel</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {paginatedTickets.map((t) => {
              const isContract = t.type === InterventionType.CONTRACTUEL;
              const repDoc = t.documents?.find(
                (d) => d.type === "FACTURE" && d.typeFacture === "REPARATION"
              );
              const isRepPaid = !repDoc || repDoc.statutPaiement === "PAYE";

              return (
                <tr key={t.id} className="hover:bg-brand-slate/40 transition-colors">
                  {/* 1. Référence & Parcours */}
                  <td className="px-5 py-3.5">
                    <div className="font-extrabold text-brand-dark text-xs">{t.numero}</div>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${
                        isContract
                          ? "bg-brand-green-light text-brand-green-dark border-brand-green/30"
                          : "bg-brand-blue-light text-brand-blue border-brand-blue/30"
                      }`}
                    >
                      {isContract ? "Contrat Entreprise" : "Atelier Ponctuel"}
                    </span>
                  </td>

                  {/* 2. Client & Appareil */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-brand-dark">{t.client.nom}</div>
                    <div className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                      <strong className="text-brand-dark font-semibold">{t.typeMateriel.replace(/_/g, " ")}</strong>
                      {" — "}{t.panneDeclaree}
                    </div>
                  </td>

                  {/* 3. Technicien */}
                  {userRole !== StaffRole.TECHNICIEN && (
                    <td className="px-5 py-3.5">
                      {t.technicienAssigne ? (
                        <span className="font-bold text-brand-dark text-xs">
                          {t.technicienAssigne.firstName} {t.technicienAssigne.lastName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Non assigné</span>
                      )}
                    </td>
                  )}

                  {/* 4. Statut */}
                  <td className="px-5 py-3.5">
                    <TicketStatusBadge statut={t.statut} isPaid={isRepPaid} />
                  </td>

                  {/* 5. Actions (Œil + Bouton Gérer) */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Bouton ŒIL d'aperçu rapide */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(t)}
                        title="Aperçu rapide"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Lien Fiche complète */}
                      <Link
                        href={`/crm/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 bg-brand-slate hover:bg-brand-blue hover:text-white px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all text-brand-dark shadow-2xs"
                      >
                        <span>{userRole === StaffRole.TECHNICIEN ? "Traiter" : "Gérer"}</span>
                        <ArrowRight className="w-3 h-3 text-brand-green" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedTickets.length === 0 && (
              <tr>
                <td colSpan={userRole !== StaffRole.TECHNICIEN ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                  {userRole === StaffRole.TECHNICIEN
                    ? "Aucune intervention ne vous est actuellement assignée."
                    : "Aucun dossier ne correspond aux critères de recherche."}
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
