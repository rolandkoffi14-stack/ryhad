"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileCheck2,
  Plus,
  Calendar,
  AlertTriangle,
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Eye,
  CreditCard,
  Download,
} from "lucide-react";
import { Periodicite, ContractStatus, VisiteStatus } from "@prisma/client";
import { formatFCFA } from "@/lib/format";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { PaymentConfirmationModal } from "@/components/crm/PaymentConfirmationModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContractItem {
  id: string;
  clientId: string;
  dateDebut: string;
  dateFin: string | null;
  periodicite: Periodicite;
  montantMainOeuvre: number;
  equipementsCouverts: string;
  statut: ContractStatus;
  client: { nom: string; telephone: string };
  visitesPlanifiees: {
    id: string;
    datePrevue: string;
    statut: VisiteStatus;
    interventionId: string | null;
  }[];
  facturesPeriodiques: {
    id: string;
    numero: string;
    montant: number;
    statutPaiement: string;
  }[];
}

interface Props {
  contracts: ContractItem[];
  clients: { id: string; nom: string }[];
}

export function ContractManager({ contracts, clients }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const [formData, setFormData] = useState<{
    clientId: string;
    dateDebut: string;
    dateFin: string;
    periodicite: Periodicite;
    montantMainOeuvre: number;
    equipementsCouverts: string;
  }>({
    clientId: clients[0]?.id || "",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
    periodicite: Periodicite.MENSUEL,
    montantMainOeuvre: 150000,
    equipementsCouverts: "",
  });

  // Filtrage
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== "ALL" && c.statut !== statusFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clientNom = (c.client?.nom || "").toLowerCase();
        const clientTel = (c.client?.telephone || "").toLowerCase();
        const equip = c.equipementsCouverts.toLowerCase();
        const per = c.periodicite.toLowerCase();

        if (
          !clientNom.includes(term) &&
          !clientTel.includes(term) &&
          !equip.includes(term) &&
          !per.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Pagination
  const totalItems = filteredContracts.length;
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage, pageSize]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/crm/contrats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur lors de la création.");

      setSuccessMsg("Contrat de maintenance créé avec succès.");
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (contractId: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/crm/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, type: "FACTURE" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur émission facture.");

      setSuccessMsg(`Facture périodique ${data.document.numero} générée avec succès.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur validation paiement.");

      setSuccessMsg(`Facture ${paymentModalState.numero} encaissée avec succès.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuickView = (c: ContractItem) => {
    setQuickViewData({
      type: "CONTRAT",
      title: `Contrat : ${c.client.nom}`,
      subtitle: `Périodicité ${c.periodicite} — Depuis le ${format(
        new Date(c.dateDebut),
        "dd/MM/yyyy",
        { locale: fr }
      )}`,
      badge: {
        label: c.statut,
        className: c.statut === ContractStatus.ACTIF ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-700 border-gray-300",
      },
      clientName: c.client.nom,
      clientPhone: c.client.telephone,
      details: [
        { label: "Entreprise", value: `${c.client.nom} (${c.client.telephone})` },
        { label: "Périodicité", value: c.periodicite },
        { label: "Montant par période", value: formatFCFA(c.montantMainOeuvre) },
        {
          label: "Période de couverture",
          value: `Du ${format(new Date(c.dateDebut), "dd/MM/yyyy", { locale: fr })} au ${
            c.dateFin ? format(new Date(c.dateFin), "dd/MM/yyyy", { locale: fr }) : "Indéterminée (Tacite reconduction)"
          }`,
        },
        { label: "Équipements couverts", value: c.equipementsCouverts },
        {
          label: "Factures périodiques",
          value: c.facturesPeriodiques.length > 0 ? (
            <div className="space-y-1">
              {c.facturesPeriodiques.map((f) => (
                <div key={f.id}>
                  {f.numero} : {formatFCFA(f.montant)} ({f.statutPaiement === "PAYE" ? "Payée" : "En attente"})
                </div>
              ))}
            </div>
          ) : (
            "Aucune facture émise"
          ),
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header aéré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Contrats de Maintenance PME & Entreprises
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestion des parcs sous contrat, planification des visites périodiques et émission des factures récurrentes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Contrat</span>
        </button>
      </div>

      {/* Alertes & Toasts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-2 font-bold shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tableau Allégé & Filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 subtle-shadow overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un contrat..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
            {[
              { id: "ALL", label: "Tous" },
              { id: ContractStatus.ACTIF, label: "Actifs" },
              { id: ContractStatus.EXPIRE, label: "Expirés" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-brand-blue text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Entreprise / Client</th>
                <th className="px-5 py-3.5">Périodicité & Forfait</th>
                <th className="px-5 py-3.5">Dernière Facture</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedContracts.map((c) => {
                const lastInvoice = c.facturesPeriodiques[0];

                return (
                  <tr key={c.id} className="hover:bg-brand-slate/40 transition-colors">
                    {/* 1. Entreprise & Équipements */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green-dark flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-brand-dark block text-xs">{c.client.nom}</span>
                          <span className="text-[11px] text-gray-500 truncate max-w-xs block">
                            {c.equipementsCouverts}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Périodicité & Forfait */}
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-brand-dark text-xs">
                        {formatFCFA(c.montantMainOeuvre)}
                      </div>
                      <span className="text-[11px] text-gray-500 font-semibold">{c.periodicite}</span>
                    </td>

                    {/* 3. Dernière Facture */}
                    <td className="px-5 py-3.5">
                      {lastInvoice ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-bold text-brand-blue block">{lastInvoice.numero}</span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                                lastInvoice.statutPaiement === "PAYE"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}
                            >
                              {lastInvoice.statutPaiement === "PAYE" ? "RÉGLÉE" : "EN ATTENTE"}
                            </span>
                          </div>
                          {lastInvoice.statutPaiement !== "PAYE" && (
                            <button
                              onClick={() =>
                                setPaymentModalState({
                                  isOpen: true,
                                  docId: lastInvoice.id,
                                  numero: lastInvoice.numero,
                                  montant: lastInvoice.montant,
                                })
                              }
                              title="Encaisser cette facture périodique"
                              className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Aucune</span>
                      )}
                    </td>

                    {/* 4. Statut */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                          c.statut === ContractStatus.ACTIF
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {c.statut}
                      </span>
                    </td>

                    {/* 5. Actions (Bouton Œil, Facturer, Nouvelle Intervention) */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Bouton ŒIL d'aperçu rapide */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickView(c)}
                          title="Aperçu rapide"
                          className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-green hover:border-brand-green hover:bg-brand-green/5 transition-all shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Émettre facture périodique */}
                        <button
                          onClick={() => handleGenerateInvoice(c.id)}
                          disabled={loading}
                          title="Émettre la facture de la période"
                          className="inline-flex items-center gap-1 bg-brand-slate hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-xl font-bold text-xs transition-all border border-gray-200 shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5 text-brand-green" />
                          <span>Facturer</span>
                        </button>

                        {/* Nouvelle intervention */}
                        <Link
                          href={`/crm/tickets/contractuel?new=true&contractId=${c.id}&clientId=${c.clientId}`}
                          title="Planifier une intervention pour ce contrat"
                          className="inline-flex items-center gap-1 bg-brand-green hover:bg-brand-green-dark text-white px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs"
                        >
                          <span>Intervention</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedContracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Aucun contrat de maintenance ne correspond aux critères.
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
      </div>

      {/* Modale d'aperçu rapide */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={quickViewData}
      />

      {/* Modale d'encaissement avec mode de paiement */}
      <PaymentConfirmationModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false, docId: null, numero: "", montant: 0 })}
        onConfirm={handleConfirmPayment}
        montant={paymentModalState.montant}
        titre={`Encaissement Facture ${paymentModalState.numero}`}
        description="Confirmez le mode de règlement de la facture périodique du contrat."
        loading={loading}
      />

      {/* Modale de création d'un contrat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-brand-slate/60 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-brand-dark">Nouveau Contrat de Maintenance</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Client / Entreprise <span className="text-brand-red">*</span>
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                >
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Périodicité</label>
                  <select
                    value={formData.periodicite}
                    onChange={(e) =>
                      setFormData({ ...formData, periodicite: e.target.value as Periodicite })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                  >
                    <option value={Periodicite.MENSUEL}>MENSUEL</option>
                    <option value={Periodicite.TRIMESTRIEL}>TRIMESTRIEL</option>
                    <option value={Periodicite.ANNUEL}>ANNUEL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Forfait Périodique (FCFA) <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step={5000}
                    min={10000}
                    value={formData.montantMainOeuvre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        montantMainOeuvre: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none font-bold text-brand-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Date de Début</label>
                  <input
                    type="date"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Date de Fin <span className="text-gray-400 font-normal">(Optionnelle)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Équipements & Périmètre Couvert <span className="text-brand-red">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Liste des équipements couverts"
                  value={formData.equipementsCouverts}
                  onChange={(e) =>
                    setFormData({ ...formData, equipementsCouverts: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold shadow-sm disabled:opacity-50"
                >
                  {loading ? "Création..." : "Valider le Contrat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
