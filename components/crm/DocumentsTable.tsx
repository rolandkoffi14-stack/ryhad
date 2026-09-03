"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Download,
  Filter,
  Check,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  Calculator,
  ShieldCheck,
  Search,
  Eye,
  CreditCard,
} from "lucide-react";
import { DocumentType, FactureType, StatutPaiement, InterventionStatut } from "@prisma/client";
import { formatFCFA } from "@/lib/format";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { PaymentConfirmationModal } from "@/components/crm/PaymentConfirmationModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DocItem {
  id: string;
  numero: string;
  type: DocumentType;
  typeFacture?: FactureType | null;
  montant: number;
  statutPaiement: StatutPaiement;
  modePaiement?: string | null;
  referencePaiement?: string | null;
  dateEmission: string;
  intervention: {
    id: string;
    numero: string;
    statut: InterventionStatut;
    client: { nom: string; telephone?: string };
  } | null;
  contract: {
    id: string;
    client: { nom: string; telephone?: string };
  } | null;
  demandeCommerciale: {
    id: string;
    typeDemande: string;
    client: { nom: string; telephone?: string } | null;
  } | null;
}

interface Props {
  documents: DocItem[];
}

export function DocumentsTable({ documents }: Props) {
  const router = useRouter();
  const [mainFilter, setMainFilter] = useState<"ALL" | "DEVIS" | "FACTURE">("ALL");
  const [factureSubFilter, setFactureSubFilter] = useState<"ALL" | FactureType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Quick View Modal
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Payment Confirmation Modal
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    docId: string | null;
    numero: string;
    montant: number;
  }>({
    isOpen: false,
    docId: null,
    numero: "",
    montant: 0,
  });

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Filtre principal
      if (mainFilter === "DEVIS" && doc.type !== DocumentType.DEVIS) return false;
      if (
        mainFilter === "FACTURE" &&
        doc.type !== DocumentType.FACTURE &&
        doc.type !== DocumentType.RECU_DIAGNOSTIC &&
        doc.type !== DocumentType.FACTURE_PERIODIQUE
      )
        return false;

      // Sous-filtre factures
      if (mainFilter === "FACTURE" && factureSubFilter !== "ALL") {
        if (doc.typeFacture !== factureSubFilter) {
          if (factureSubFilter === FactureType.DIAGNOSTIC && doc.type === DocumentType.RECU_DIAGNOSTIC)
            return true;
          if (factureSubFilter === FactureType.CONTRAT && doc.type === DocumentType.FACTURE_PERIODIQUE)
            return true;
          return false;
        }
      }

      // Recherche texte
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clientNom = (
          doc.intervention?.client?.nom ||
          doc.contract?.client?.nom ||
          doc.demandeCommerciale?.client?.nom ||
          ""
        ).toLowerCase();
        const num = doc.numero.toLowerCase();
        const intNum = (doc.intervention?.numero || "").toLowerCase();
        const mode = (doc.modePaiement || "").toLowerCase();
        const ref = (doc.referencePaiement || "").toLowerCase();

        if (
          !clientNom.includes(term) &&
          !num.includes(term) &&
          !intNum.includes(term) &&
          !mode.includes(term) &&
          !ref.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [documents, mainFilter, factureSubFilter, searchTerm]);

  // Pagination
  const totalItems = filteredDocs.length;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage, pageSize]);

  const getDocDisplayInfo = (doc: DocItem) => {
    if (doc.type === DocumentType.DEVIS) {
      return {
        label: doc.demandeCommerciale ? "Devis Commercial" : "Devis Estimatif",
        badgeColor: "bg-blue-100 text-brand-blue border-blue-200",
      };
    }

    const subType = doc.typeFacture;
    if (subType === FactureType.DIAGNOSTIC || doc.type === DocumentType.RECU_DIAGNOSTIC) {
      return {
        label: "Facture Diag.",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }
    if (subType === FactureType.CONTRAT || doc.type === DocumentType.FACTURE_PERIODIQUE) {
      return {
        label: "Facture Contrat",
        badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      };
    }
    if (subType === FactureType.COMMERCIALE || doc.demandeCommerciale) {
      return {
        label: "Facture Commerciale",
        badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      };
    }
    return {
      label: "Facture Réparation",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  };

  const getDocumentStatusBadge = (doc: DocItem) => {
    if (doc.type === DocumentType.DEVIS) {
      if (doc.statutPaiement === StatutPaiement.REFUSE || String(doc.statutPaiement) === "REFUSE") {
        return {
          label: "REFUSÉ",
          className: "bg-red-50 text-red-800 border-red-300 font-extrabold",
        };
      }
      if (doc.statutPaiement === StatutPaiement.PAYE) {
        return {
          label: "ACCEPTÉ",
          className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold",
        };
      }
      return {
        label: "ÉMIS",
        className: "bg-blue-50 text-brand-blue border-blue-300 font-extrabold",
      };
    }

    if (doc.statutPaiement === StatutPaiement.PAYE) {
      return {
        label: "ENCAISSÉE",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold",
      };
    }
    if (doc.statutPaiement === StatutPaiement.PARTIEL) {
      return {
        label: "PARTIEL",
        className: "bg-amber-100 text-amber-800 border-amber-300 font-extrabold",
      };
    }
    if (doc.statutPaiement === StatutPaiement.ANNULE) {
      return {
        label: "ANNULÉE",
        className: "bg-gray-100 text-gray-700 border-gray-300 font-extrabold",
      };
    }
    return {
      label: "EN ATTENTE",
      className: "bg-amber-50 text-amber-900 border-amber-400 font-extrabold",
    };
  };

  const handleConfirmPayment = async (modePaiement: string, referencePaiement?: string) => {
    if (!paymentModalState.docId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/crm/documents/generate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: paymentModalState.docId,
          statutPaiement: "PAYE",
          modePaiement,
          referencePaiement,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur encaissement.");

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuickView = (doc: DocItem) => {
    const displayInfo = getDocDisplayInfo(doc);
    const statusBadge = getDocumentStatusBadge(doc);
    const clientNom =
      doc.intervention?.client?.nom ||
      doc.contract?.client?.nom ||
      doc.demandeCommerciale?.client?.nom ||
      "Client non spécifié";
    const clientTel =
      doc.intervention?.client?.telephone ||
      doc.contract?.client?.telephone ||
      doc.demandeCommerciale?.client?.telephone;

    setQuickViewData({
      type: "DOCUMENT",
      title: `${displayInfo.label} : ${doc.numero}`,
      subtitle: `Émis le ${format(new Date(doc.dateEmission), "dd/MM/yyyy", { locale: fr })}`,
      badge: statusBadge,
      pdfUrl: `/api/documents/${doc.numero}/pdf`,
      clientName: clientNom,
      clientPhone: clientTel,
      linkHref: doc.intervention
        ? `/crm/tickets/${doc.intervention.id}`
        : doc.demandeCommerciale
        ? `/crm/demandes-commerciales/${doc.demandeCommerciale.id}`
        : `/crm/contrats`,
      linkLabel: "Voir le dossier lié →",
      details: [
        { label: "Numéro officiel", value: doc.numero },
        { label: "Type de document", value: displayInfo.label },
        { label: "Client / Entreprise", value: clientNom },
        { label: "Montant total", value: formatFCFA(doc.montant) },
        { label: "Statut du règlement", value: statusBadge.label },
        {
          label: "Mode de règlement",
          value: doc.modePaiement ? doc.modePaiement.replace(/_/g, " ") : "Non spécifié",
        },
        {
          label: "Référence transaction",
          value: doc.referencePaiement || "Aucune",
        },
        {
          label: "Dossier rattaché",
          value: doc.intervention?.numero || doc.demandeCommerciale?.typeDemande || "Contrat de maintenance",
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
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Filtres Devis / Factures */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: "DEVIS", label: "Devis" },
            { id: "FACTURE", label: "Factures" },
          ].map((tab) => {
            const isActive = mainFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setMainFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isActive
                    ? "bg-brand-blue text-white shadow-2xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {mainFilter === "FACTURE" && (
            <select
              value={factureSubFilter}
              onChange={(e) => {
                setFactureSubFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-brand-blue ml-1"
            >
              <option value="ALL">Toutes les factures</option>
              <option value={FactureType.DIAGNOSTIC}>Factures Diagnostic</option>
              <option value={FactureType.REPARATION}>Factures Réparation</option>
              <option value={FactureType.CONTRAT}>Factures Contrat</option>
              <option value={FactureType.COMMERCIALE}>Factures Commerciales</option>
            </select>
          )}
        </div>
      </div>

      {/* Tableau Allégé */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-slate text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-5 py-3.5">Numéro & Type</th>
              <th className="px-5 py-3.5">Client & Dossier</th>
              <th className="px-5 py-3.5">Date Émission</th>
              <th className="px-5 py-3.5">Montant</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {paginatedDocs.map((doc) => {
              const displayInfo = getDocDisplayInfo(doc);
              const statusBadge = getDocumentStatusBadge(doc);
              const clientNom =
                doc.intervention?.client?.nom ||
                doc.contract?.client?.nom ||
                doc.demandeCommerciale?.client?.nom ||
                "Client non spécifié";

              return (
                <tr key={doc.id} className="hover:bg-brand-slate/40 transition-colors">
                  {/* 1. Numéro & Type */}
                  <td className="px-5 py-3.5">
                    <div className="font-extrabold text-brand-dark text-xs">{doc.numero}</div>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${displayInfo.badgeColor}`}
                    >
                      {displayInfo.label}
                    </span>
                  </td>

                  {/* 2. Client & Dossier lié */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-brand-dark">{clientNom}</div>
                    {doc.intervention && (
                      <Link
                        href={`/crm/tickets/${doc.intervention.id}`}
                        className="text-[11px] text-brand-blue hover:underline font-semibold flex items-center gap-0.5 mt-0.5"
                      >
                        <span>{doc.intervention.numero}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-brand-green" />
                      </Link>
                    )}
                    {doc.demandeCommerciale && (
                      <Link
                        href={`/crm/demandes-commerciales/${doc.demandeCommerciale.id}`}
                        className="text-[11px] text-purple-700 hover:underline font-semibold flex items-center gap-0.5 mt-0.5"
                      >
                        <span>{doc.demandeCommerciale.typeDemande.replace(/_/g, " ")}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-brand-green" />
                      </Link>
                    )}
                  </td>

                  {/* 3. Date Émission */}
                  <td className="px-5 py-3.5 text-gray-500">
                    {format(new Date(doc.dateEmission), "dd/MM/yyyy", { locale: fr })}
                  </td>

                  {/* 4. Montant */}
                  <td className="px-5 py-3.5 font-extrabold text-brand-blue text-xs">
                    {formatFCFA(doc.montant)}
                  </td>

                  {/* 5. Statut */}
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] border inline-block ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* 6. Actions (Œil, Télécharger PDF, Encaisser si en attente) */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Bouton ŒIL d'aperçu rapide */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(doc)}
                        title="Aperçu rapide"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Télécharger PDF */}
                      <a
                        href={`/api/documents/${doc.numero}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        title="Télécharger PDF"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-brand-blue hover:text-white transition-all shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-brand-green" />
                      </a>

                      {/* Bouton Encaisser direct si facture impayée */}
                      {doc.type !== DocumentType.DEVIS && doc.statutPaiement !== StatutPaiement.PAYE && (
                        <button
                          onClick={() =>
                            setPaymentModalState({
                              isOpen: true,
                              docId: doc.id,
                              numero: doc.numero,
                              montant: doc.montant,
                            })
                          }
                          title="Encaisser cette facture"
                          className="inline-flex items-center gap-1 bg-brand-green hover:bg-brand-green-dark text-white px-2 py-1 rounded-xl font-extrabold text-[11px] shadow-2xs transition-all"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Encaisser</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedDocs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Aucun document financier trouvé.
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

      <PaymentConfirmationModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false, docId: null, numero: "", montant: 0 })}
        onConfirm={handleConfirmPayment}
        montant={paymentModalState.montant}
        titre={`Encaissement Facture ${paymentModalState.numero}`}
        description="Veuillez renseigner le mode de paiement utilisé pour régler cette facture."
        loading={loading}
      />
    </div>
  );
}
