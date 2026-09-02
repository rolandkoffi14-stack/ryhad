"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  ArrowRight,
  Phone,
  MessageCircle,
  Filter,
  Clock,
  Wrench,
  CheckCircle2,
  FileText,
  User,
  CreditCard,
  Laptop,
} from "lucide-react";
import { InterventionStatut } from "@prisma/client";
import { formatFCFA } from "@/lib/format";
import { TicketStatusBadge } from "@/components/crm/TicketStatusBadge";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TicketItem {
  id: string;
  numero: string;
  typeMateriel: string;
  panneDeclaree: string;
  modeIntervention: string;
  statut: InterventionStatut;
  montantDiagnostic: number | null;
  montantMainOeuvre: number | null;
  diagnosticTechnicien: string | null;
  dateCreation: string;
  client: {
    id: string;
    nom: string;
    telephone: string;
    email: string | null;
    adresse: string | null;
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
    typeFacture: string | null;
    montant: number;
    statutPaiement: string;
  }[];
}

interface Props {
  tickets: TicketItem[];
  isTechnician?: boolean;
}

export function TicketsPonctuelTable({ tickets, isTechnician = false }: Props) {
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
        if (statusFilter === "ATTENTE_DIAG" && t.statut !== InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE && t.statut !== InterventionStatut.EN_DIAGNOSTIC) {
          return false;
        }
        if (statusFilter === "DEVIS" && t.statut !== InterventionStatut.DIAGNOSTIC_TERMINE && t.statut !== InterventionStatut.DEVIS_ENVOYE) {
          return false;
        }
        if (statusFilter === "REPARATION" && t.statut !== InterventionStatut.DEVIS_ACCEPTE && t.statut !== InterventionStatut.EN_REPARATION) {
          return false;
        }
        if (statusFilter === "TERMINE" && t.statut !== InterventionStatut.TERMINE) {
          return false;
        }
        if (statusFilter === "CLOS" && t.statut !== InterventionStatut.LIVRE_CLOTURE && t.statut !== InterventionStatut.CLOTURE) {
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

  const handleOpenQuickView = (t: TicketItem) => {
    const diagDoc = t.documents.find((d) => d.type === "FACTURE" && d.typeFacture === "DIAGNOSTIC");
    const devisDoc = t.documents.find((d) => d.type === "DEVIS");
    const repDoc = t.documents.find((d) => d.type === "FACTURE" && d.typeFacture === "REPARATION");

    setQuickViewData({
      type: "TICKET",
      title: `Dossier ${t.numero}`,
      subtitle: `${t.typeMateriel.replace(/_/g, " ")} — Déposé le ${format(
        new Date(t.dateCreation),
        "dd/MM/yyyy",
        { locale: fr }
      )}`,
      status: t.statut,
      linkHref: `/crm/tickets/${t.id}`,
      linkLabel: "Gérer le dossier complet →",
      clientName: t.client?.nom,
      clientPhone: t.client?.telephone,
      details: [
        { label: "Matériel", value: t.typeMateriel.replace(/_/g, " ") },
        { label: "Client", value: `${t.client?.nom || "Non renseigné"} (${t.client?.telephone || "N/A"})` },
        {
          label: "Technicien assigné",
          value: t.technicienAssigne
            ? `${t.technicienAssigne.firstName} ${t.technicienAssigne.lastName}`
            : "Non assigné",
        },
        { label: "Panne déclarée", value: t.panneDeclaree },
        {
          label: "Constat diagnostic",
          value: t.diagnosticTechnicien || "En cours ou non consigné",
        },
        {
          label: "Frais de diagnostic",
          value: `${formatFCFA(t.montantDiagnostic || 5000)} (${diagDoc?.statutPaiement === "PAYE" ? "Payé" : "En attente"})`,
        },
        {
          label: "Documents financiers",
          value: (
            <div className="space-y-1">
              {devisDoc && <div>Devis : {devisDoc.numero} ({formatFCFA(devisDoc.montant)})</div>}
              {repDoc && <div>Facture Réparation : {repDoc.numero} ({formatFCFA(repDoc.montant)})</div>}
              {!devisDoc && !repDoc && <span className="text-gray-400">Aucun devis émis pour l'instant</span>}
            </div>
          ),
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
      {/* Barre supérieure : Recherche & Filtres rapides */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Recherche texte */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par n° dossier, client, téléphone, technicien..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Filtres par statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "ATTENTE_DIAG", label: "À Diagnostiquer" },
            { id: "DEVIS", label: "Devis" },
            { id: "REPARATION", label: "En Réparation" },
            { id: "TERMINE", label: "Prêts" },
            { id: "CLOS", label: "Clôturés" },
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
              <th className="px-5 py-3.5">Réf. & Matériel</th>
              <th className="px-5 py-3.5">Client</th>
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
                      <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                        <Laptop className="w-4 h-4" />
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

                  {/* 2. Client & Contact rapide */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-brand-dark">{t.client?.nom || "Client non identifié"}</div>
                    {clientPhone && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-500">{clientPhone}</span>
                        <a
                          href={`https://wa.me/${clientCleanPhone}?text=${encodeURIComponent(
                            `Bonjour ${t.client?.nom}, point concernant votre matériel (${t.typeMateriel.replace(/_/g, " ")}) sous le dossier ${t.numero} chez RyHaD Tic-Medic.`
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

                  {/* 5. Actions (Œil aperçu + Lien Gérer) */}
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

                      {/* Bouton Gérer vers la fiche complète */}
                      <Link
                        href={`/crm/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 bg-brand-slate hover:bg-brand-blue hover:text-white px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all text-brand-dark shadow-2xs"
                      >
                        <span>Gérer</span>
                        <ArrowRight className="w-3 h-3 text-brand-green" />
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
                    ? "Aucun ticket ne correspond aux critères de recherche."
                    : "Aucun ticket ponctuel pour le moment."}
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
