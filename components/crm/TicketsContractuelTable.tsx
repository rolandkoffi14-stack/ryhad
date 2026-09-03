"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  ArrowRight,
  Phone,
  MessageCircle,
  Building2,
  CheckCircle2,
  Wrench,
  Clock,
} from "lucide-react";
import { InterventionStatut } from "@prisma/client";
import { formatFCFA } from "@/lib/format";
import { TicketStatusBadge } from "@/components/crm/TicketStatusBadge";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContractuelTicketItem {
  id: string;
  numero: string;
  typeMateriel: string;
  panneDeclaree: string;
  modeIntervention: string;
  statut: InterventionStatut;
  diagnosticTechnicien: string | null;
  dateCreation: string;
  client: {
    id: string;
    nom: string;
    telephone: string;
    email: string | null;
    adresse: string | null;
  } | null;
  contract: {
    id: string;
    periodicite: string;
    equipementsCouverts: string;
  } | null;
  technicienAssigne: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  documents: {
    id: string;
    numero: string;
    type: string;
    montant: number;
    statutPaiement: string;
  }[];
}

interface Props {
  tickets: ContractuelTicketItem[];
  isTechnician?: boolean;
}

export function TicketsContractuelTable({ tickets, isTechnician = false }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // État de la modale d'aperçu rapide Œil
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Filtrage
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Filtre statut
      if (statusFilter !== "ALL") {
        if (statusFilter === "NOUVEAU" && t.statut !== InterventionStatut.NOUVEAU) {
          return false;
        }
        if (
          statusFilter === "EN_COURS" &&
          t.statut !== InterventionStatut.EN_INTERVENTION &&
          t.statut !== InterventionStatut.EN_DIAGNOSTIC &&
          t.statut !== InterventionStatut.DIAGNOSTIC_TERMINE
        ) {
          return false;
        }
        if (statusFilter === "TERMINE" && t.statut !== InterventionStatut.TERMINE) {
          return false;
        }
        if (statusFilter === "CLOTURE" && t.statut !== InterventionStatut.CLOTURE) {
          return false;
        }
      }

      // Recherche texte
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const num = t.numero.toLowerCase();
        const clientNom = (t.client?.nom || "").toLowerCase();
        const clientTel = (t.client?.telephone || "").toLowerCase();
        const mat = t.typeMateriel.toLowerCase();
        const equip = (t.contract?.equipementsCouverts || "").toLowerCase();
        const tech = (
          t.technicienAssigne
            ? `${t.technicienAssigne.firstName} ${t.technicienAssigne.lastName}`
            : ""
        ).toLowerCase();

        if (
          !num.includes(term) &&
          !clientNom.includes(term) &&
          !clientTel.includes(term) &&
          !mat.includes(term) &&
          !equip.includes(term) &&
          !tech.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, searchTerm, statusFilter]);

  // Pagination
  const totalItems = filteredTickets.length;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const handleOpenQuickView = (t: ContractuelTicketItem) => {
    const devisDoc = t.documents.find((d) => d.type === "DEVIS");
    const repDoc = t.documents.find((d) => d.type === "FACTURE");

    setQuickViewData({
      type: "TICKET",
      title: `Intervention ${t.numero} (Contrat)`,
      subtitle: `${t.typeMateriel.replace(/_/g, " ")} — Ouvert le ${format(
        new Date(t.dateCreation),
        "dd/MM/yyyy",
        { locale: fr }
      )}`,
      status: t.statut,
      linkHref: `/crm/tickets/${t.id}`,
      linkLabel: "Gérer l'intervention complète →",
      clientName: t.client?.nom,
      clientPhone: t.client?.telephone,
      details: [
        { label: "Matériel", value: t.typeMateriel.replace(/_/g, " ") },
        { label: "Entreprise / Client", value: `${t.client?.nom || "Non renseigné"}` },
        {
          label: "Contrat lié",
          value: t.contract
            ? `Périodicité ${t.contract.periodicite} (${t.contract.equipementsCouverts})`
            : "Contrat entreprise",
        },
        {
          label: "Technicien assigné",
          value: t.technicienAssigne
            ? `${t.technicienAssigne.firstName} ${t.technicienAssigne.lastName}`
            : "Non assigné",
        },
        { label: "Objet / Panne", value: t.panneDeclaree },
        {
          label: "Rapport d'intervention",
          value: t.diagnosticTechnicien || "En cours ou non consigné",
        },
        {
          label: "Main d'œuvre & Déplacements",
          value: "Inclus au forfait du contrat (0 FCFA supplémentaire)",
        },
        {
          label: "Pièces de rechange",
          value: devisDoc
            ? `Devis pièces ${devisDoc.numero} (${formatFCFA(devisDoc.montant)})`
            : "Aucune pièce facturée",
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
      {/* Barre supérieure : Recherche & Filtres */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Recherche texte */}
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
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        {/* Filtres par statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "NOUVEAU", label: "Nouveaux" },
            { id: "EN_COURS", label: "En Intervention" },
            { id: "TERMINE", label: "Terminés" },
            { id: "CLOTURE", label: "Clôturés" },
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
                    ? "bg-brand-green text-white shadow-2xs"
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
              <th className="px-5 py-3.5">Réf. & Matériel</th>
              <th className="px-5 py-3.5">Entreprise / Client</th>
              <th className="px-5 py-3.5">Technicien</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {paginatedTickets.map((t) => {
              const clientPhone = t.client?.telephone || "";
              const clientCleanPhone = clientPhone.replace(/[^0-9]/g, "");

              return (
                <tr key={t.id} className="hover:bg-brand-slate/40 transition-colors">
                  {/* 1. Réf. & Matériel */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green-dark flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/crm/tickets/${t.id}`}
                          className="font-extrabold text-brand-dark hover:text-brand-blue transition-colors text-xs"
                        >
                          {t.numero}
                        </Link>
                        <span className="text-[11px] text-gray-500 block">
                          {t.typeMateriel.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Entreprise / Client */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-brand-dark">{t.client?.nom || "Entreprise non identifiée"}</div>
                    {clientPhone && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-500">{clientPhone}</span>
                        <a
                          href={`https://wa.me/${clientCleanPhone}?text=${encodeURIComponent(
                            `Bonjour ${t.client?.nom}, point concernant l'intervention contractuelle ${t.numero} chez RyHaD Tic-Medic.`
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

                  {/* 3. Technicien */}
                  <td className="px-5 py-3.5">
                    {t.technicienAssigne ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-green-dark font-extrabold text-[10px] flex items-center justify-center shrink-0">
                          {t.technicienAssigne.firstName.charAt(0)}
                        </div>
                        <span className="font-semibold text-brand-dark text-xs">
                          {t.technicienAssigne.firstName} {t.technicienAssigne.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-bold">
                        Non assigné
                      </span>
                    )}
                  </td>

                  {/* 4. Statut */}
                  <td className="px-5 py-3.5">
                    <TicketStatusBadge statut={t.statut} />
                  </td>

                  {/* 5. Actions (Œil + Lien Gérer) */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(t)}
                        title="Aperçu rapide"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/crm/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 bg-brand-slate hover:bg-brand-green hover:text-white px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all text-brand-dark shadow-2xs"
                      >
                        <span>Gérer</span>
                        <ArrowRight className="w-3 h-3 text-brand-green group-hover:text-white" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedTickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Aucune intervention contractuelle ne correspond aux critères."
                    : "Aucune intervention contractuelle pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination unifiée */}
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

      {/* Modale d'aperçu rapide */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={quickViewData}
      />
    </div>
  );
}
