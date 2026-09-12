"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  Building2,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Banknote,
  Smartphone,
  Receipt,
  FileText,
  Wrench,
  Cpu,
} from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { PaymentConfirmationModal } from "@/components/crm/PaymentConfirmationModal";
import { useRouter } from "next/navigation";

interface FinancialDoc {
  id: string;
  numero: string;
  type: string;
  typeFacture: string | null;
  montant: number;
  statutPaiement: string;
  modePaiement: string | null;
  referencePaiement: string | null;
  datePaiement: string | null;
  dateEmission: string;
  pdfUrl: string | null;
  intervention: {
    id: string;
    numero: string;
    type: string;
    typeMateriel: string;
    montantMainOeuvre?: number | null;
    piecesUtilisees?: { id: string; designation: string; quantite: number; prixUnitaire: number }[];
    client: { id: string; nom: string; telephone: string; type: string; email: string | null } | null;
  } | null;
  contract: {
    id: string;
    periodicite: string;
    equipementsCouverts: string;
    client: { id: string; nom: string; telephone: string; type: string; email: string | null } | null;
  } | null;
  demandeCommerciale: {
    id: string;
    typeDemande: string;
    client: { id: string; nom: string; telephone: string; type: string; email: string | null } | null;
  } | null;
}

interface Props {
  documents: FinancialDoc[];
}

export function AccountingManager({ documents }: Props) {
  const router = useRouter();
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "MONTH" | "QUARTER" | "YEAR">("MONTH");
  const [activeTab, setActiveTab] = useState<"JOURNAL" | "DEVIS" | "CREANCES">("JOURNAL");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal d'encaissement de paiement
  const [paymentModal, setPaymentModal] = useState<{
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

  // Filtrage selon la période
  const periodFilteredDocs = useMemo(() => {
    const now = new Date();
    return documents.filter((doc) => {
      if (periodFilter === "ALL") return true;
      const docDate = new Date(doc.dateEmission);

      if (periodFilter === "MONTH") {
        return (
          docDate.getMonth() === now.getMonth() &&
          docDate.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === "QUARTER") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const docQuarter = Math.floor(docDate.getMonth() / 3);
        return docQuarter === currentQuarter && docDate.getFullYear() === now.getFullYear();
      }
      if (periodFilter === "YEAR") {
        return docDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [documents, periodFilter]);

  // Calcul des métriques financières avec séparation Pièces vs Main d'œuvre
  const metrics = useMemo(() => {
    let totalEncaisse = 0;
    let totalFacture = 0;
    let totalCreances = 0;
    let totalDevisEnAttente = 0;

    // Répartition par activité
    let caPonctuel = 0;
    let caContrats = 0;
    let caCommercial = 0;

    // Ventilation Main d'œuvre vs Pièces
    let caMainOeuvre = 0;
    let caPieces = 0;

    // Répartition par mode de paiement
    const parMode: Record<string, number> = {
      MTN_MOMO: 0,
      MOOV_MONEY: 0,
      ESPECES: 0,
      VIREMENT: 0,
      CHEQUE: 0,
      AUTRE: 0,
    };

    periodFilteredDocs.forEach((doc) => {
      const isFacture =
        doc.type === "FACTURE" ||
        doc.type === "RECU_DIAGNOSTIC" ||
        doc.type === "FACTURE_PERIODIQUE";

      if (isFacture) {
        totalFacture += doc.montant;

        if (doc.statutPaiement === "PAYE") {
          totalEncaisse += doc.montant;

          // Ventilation par pôle et par nature (Main d'œuvre vs Pièces)
          if (doc.contract) {
            caContrats += doc.montant;
            caMainOeuvre += doc.montant; // Maintenance préventive sous contrat = 100% Main d'œuvre
          } else if (doc.demandeCommerciale) {
            caCommercial += doc.montant;
            if (doc.demandeCommerciale.typeDemande === "VENTE_MATERIEL") {
              caPieces += doc.montant;
            } else {
              caMainOeuvre += doc.montant;
            }
          } else if (doc.intervention) {
            caPonctuel += doc.montant;
            if (doc.typeFacture === "DIAGNOSTIC" || doc.type === "RECU_DIAGNOSTIC") {
              caMainOeuvre += doc.montant; // Frais de diagnostic = 100% prestation technique
            } else {
              const piecesTotal = (doc.intervention.piecesUtilisees || []).reduce(
                (acc, p) => acc + p.quantite * p.prixUnitaire,
                0
              );
              const partPieces = Math.min(piecesTotal, doc.montant);
              const partMO = doc.montant - partPieces;
              caPieces += partPieces;
              caMainOeuvre += partMO;
            }
          } else {
            caMainOeuvre += doc.montant;
          }

          // Ventilation par mode
          const mode = doc.modePaiement || "AUTRE";
          if (parMode[mode] !== undefined) {
            parMode[mode] += doc.montant;
          } else {
            parMode.AUTRE += doc.montant;
          }
        } else if (doc.statutPaiement === "EN_ATTENTE" || doc.statutPaiement === "PARTIEL") {
          totalCreances += doc.montant;
        }
      } else if (doc.type === "DEVIS") {
        if (doc.statutPaiement === "EN_ATTENTE") {
          totalDevisEnAttente += doc.montant;
        }
      }
    });

    const tauxRecouvrement =
      totalFacture > 0 ? Math.round((totalEncaisse / totalFacture) * 100) : 100;

    const pctMainOeuvre = totalEncaisse > 0 ? Math.round((caMainOeuvre / totalEncaisse) * 100) : 0;
    const pctPieces = totalEncaisse > 0 ? Math.round((caPieces / totalEncaisse) * 100) : 0;

    return {
      totalEncaisse,
      totalFacture,
      totalCreances,
      totalDevisEnAttente,
      tauxRecouvrement,
      caPonctuel,
      caContrats,
      caCommercial,
      caMainOeuvre,
      caPieces,
      pctMainOeuvre,
      pctPieces,
      parMode,
    };
  }, [periodFilteredDocs]);

  // Liste des créances / impayés
  const creancesList = useMemo(() => {
    return periodFilteredDocs
      .filter(
        (doc) =>
          (doc.type === "FACTURE" ||
            doc.type === "RECU_DIAGNOSTIC" ||
            doc.type === "FACTURE_PERIODIQUE") &&
          (doc.statutPaiement === "EN_ATTENTE" || doc.statutPaiement === "PARTIEL")
      )
      .map((doc) => {
        const emitDate = new Date(doc.dateEmission);
        const daysLate = differenceInDays(new Date(), emitDate);
        const client =
          doc.intervention?.client || doc.contract?.client || doc.demandeCommerciale?.client;
        return {
          ...doc,
          client,
          daysLate,
        };
      })
      .sort((a, b) => b.daysLate - a.daysLate);
  }, [periodFilteredDocs]);

  // Liste filtrée pour le Journal des Ventes (FACTURES RÉELLES UNIQUEMENT - Devis exclus)
  const journalList = useMemo(() => {
    return periodFilteredDocs
      .filter((doc) => doc.type !== "DEVIS")
      .filter((doc) => {
        // Filtre mode paiement
        if (paymentModeFilter !== "ALL") {
          if (doc.modePaiement !== paymentModeFilter) return false;
        }

        // Recherche texte
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const num = doc.numero.toLowerCase();
          const clientNom = (
            doc.intervention?.client?.nom ||
            doc.contract?.client?.nom ||
            doc.demandeCommerciale?.client?.nom ||
            ""
          ).toLowerCase();
          const ref = (doc.referencePaiement || "").toLowerCase();

          if (!num.includes(term) && !clientNom.includes(term) && !ref.includes(term)) {
            return false;
          }
        }

        return true;
      });
  }, [periodFilteredDocs, paymentModeFilter, searchTerm]);

  // Liste dédiée pour les Devis Estimatifs
  const devisList = useMemo(() => {
    return periodFilteredDocs
      .filter((doc) => doc.type === "DEVIS")
      .filter((doc) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const num = doc.numero.toLowerCase();
          const clientNom = (
            doc.intervention?.client?.nom ||
            doc.contract?.client?.nom ||
            doc.demandeCommerciale?.client?.nom ||
            ""
          ).toLowerCase();

          if (!num.includes(term) && !clientNom.includes(term)) {
            return false;
          }
        }
        return true;
      });
  }, [periodFilteredDocs, searchTerm]);

  // Pagination pour le journal, devis et créances
  const totalItems =
    activeTab === "JOURNAL"
      ? journalList.length
      : activeTab === "DEVIS"
      ? devisList.length
      : creancesList.length;

  const paginatedDocs = useMemo(() => {
    const list =
      activeTab === "JOURNAL"
        ? journalList
        : activeTab === "DEVIS"
        ? devisList
        : creancesList;
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [activeTab, journalList, devisList, creancesList, currentPage, pageSize]);

  // Export CSV du grand livre / journal des ventes
  const handleExportJournalCsv = () => {
    const headers = [
      "Date Émission",
      "N° Facture",
      "Type Document",
      "Catégorie",
      "Client",
      "Téléphone",
      "Total TTC (FCFA)",
      "Part Main d'œuvre (FCFA)",
      "Part Pièces (FCFA)",
      "Statut Règlement",
      "Mode Paiement",
      "Réf Paiement",
    ];

    const rows = journalList.map((doc) => {
      const client =
        doc.intervention?.client || doc.contract?.client || doc.demandeCommerciale?.client;
      const dateStr = format(new Date(doc.dateEmission), "yyyy-MM-dd");
      const clientNom = client?.nom || "Client inconnu";
      const tel = client?.telephone || "";
      const categorie = doc.contract
        ? "Contrat Entreprise"
        : doc.demandeCommerciale
        ? "Commercial / Vente"
        : "Atelier Ponctuel";

      let partPieces = 0;
      let partMO = doc.montant;
      if (doc.contract) {
        partMO = doc.montant;
      } else if (doc.demandeCommerciale?.typeDemande === "VENTE_MATERIEL") {
        partPieces = doc.montant;
        partMO = 0;
      } else if (doc.intervention && doc.typeFacture !== "DIAGNOSTIC" && doc.type !== "RECU_DIAGNOSTIC") {
        const pTotal = (doc.intervention.piecesUtilisees || []).reduce(
          (acc, p) => acc + p.quantite * p.prixUnitaire,
          0
        );
        partPieces = Math.min(pTotal, doc.montant);
        partMO = doc.montant - partPieces;
      }

      return [
        `"${dateStr}"`,
        `"${doc.numero}"`,
        `"${doc.type}"`,
        `"${categorie}"`,
        `"${clientNom.replace(/"/g, '""')}"`,
        `"${tel}"`,
        `"${doc.montant}"`,
        `"${partMO}"`,
        `"${partPieces}"`,
        `"${doc.statutPaiement}"`,
        `"${doc.modePaiement || "Non renseigné"}"`,
        `"${(doc.referencePaiement || "").replace(/"/g, '""')}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `journal_ventes_ryhad_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getClientData = (doc: FinancialDoc) => {
    return doc.intervention?.client || doc.contract?.client || doc.demandeCommerciale?.client;
  };

  return (
    <div className="space-y-8">
      {/* En-tête avec titre & sélecteur de période */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Comptabilité & Trésorerie
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tableau de bord financier, flux de caisse, créances et journal des ventes de RyHaD Tic-Medic.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Bouton Export CSV Journal */}
          <button
            type="button"
            onClick={handleExportJournalCsv}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-2xs hover:border-slate-300 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exporter Journal CSV</span>
          </button>

          {/* Filtres de période */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("MONTH");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodFilter === "MONTH"
                  ? "bg-white text-brand-blue shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ce mois
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("QUARTER");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodFilter === "QUARTER"
                  ? "bg-white text-brand-blue shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("YEAR");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodFilter === "YEAR"
                  ? "bg-white text-brand-blue shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cette année
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodFilter === "ALL"
                  ? "bg-white text-brand-blue shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tout
            </button>
          </div>
        </div>
      </div>

      {/* Cartes KPIs Financiers avec séparation Main d'œuvre vs Pièces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CA Encaissé Global */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CA Encaissé (Total)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatFCFA(metrics.totalEncaisse)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metrics.tauxRecouvrement}% de recouvrement</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-green" />
        </div>

        {/* CA Main d'œuvre & Services */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-brand-blue/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CA Main d&apos;œuvre & Services
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-brand-blue tracking-tight">
              {formatFCFA(metrics.caMainOeuvre)}
            </h3>
            <p className="text-xs text-brand-blue font-bold mt-2 flex items-center justify-between">
              <span>Diagnostics, rép. & contrats</span>
              <span className="bg-blue-100 text-brand-blue px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {metrics.pctMainOeuvre}% du CA
              </span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue" />
        </div>

        {/* CA Pièces Détachées & Matériel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CA Pièces & Composants
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-purple-900 tracking-tight">
              {formatFCFA(metrics.caPieces)}
            </h3>
            <p className="text-xs text-purple-700 font-bold mt-2 flex items-center justify-between">
              <span>Composants & vente matériel</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {metrics.pctPieces}% du CA
              </span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
        </div>

        {/* Créances / Impayés */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Créances à Recouvrer
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {formatFCFA(metrics.totalCreances)}
            </h3>
            <p className="text-xs text-amber-700/80 font-bold mt-2">
              {creancesList.length} facture(s) en attente
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* Ventilation Chiffre d'Affaires & Flux de Caisse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition Main d'œuvre vs Pièces & Pôles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-blue" />
            <span>Répartition du CA : Main d&apos;œuvre vs Pièces Détachées</span>
          </h3>

          <div className="space-y-3 pt-2">
            {/* Main d'œuvre & Services */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Main d&apos;œuvre & Services ({metrics.pctMainOeuvre}%)</span>
                </span>
                <span className="text-brand-blue font-extrabold">{formatFCFA(metrics.caMainOeuvre)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-blue rounded-full transition-all"
                  style={{ width: `${metrics.pctMainOeuvre}%` }}
                />
              </div>
            </div>

            {/* Pièces détachées & Composants */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  <span>Pièces détachées & Matériel ({metrics.pctPieces}%)</span>
                </span>
                <span className="text-purple-700 font-extrabold">{formatFCFA(metrics.caPieces)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${metrics.pctPieces}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Total facturé émis : {formatFCFA(metrics.totalFacture)}</span>
              <span>Total devis en cours : {formatFCFA(metrics.totalDevisEnAttente)}</span>
            </div>
          </div>
        </div>

        {/* Moyens de Paiement (MoMo, Moov, Espèces, Virement) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Moyens de Règlement (Flux de Trésorerie)</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* MTN MoMo */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
              <p className="text-[11px] font-extrabold text-amber-900">MTN Mobile Money</p>
              <p className="text-base font-extrabold text-slate-900">
                {formatFCFA(metrics.parMode.MTN_MOMO)}
              </p>
            </div>

            {/* Moov Money */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-1">
              <p className="text-[11px] font-extrabold text-blue-900">Moov Money</p>
              <p className="text-base font-extrabold text-slate-900">
                {formatFCFA(metrics.parMode.MOOV_MONEY)}
              </p>
            </div>

            {/* Espèces */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
              <p className="text-[11px] font-extrabold text-emerald-900">Espèces (Caisse)</p>
              <p className="text-base font-extrabold text-slate-900">
                {formatFCFA(metrics.parMode.ESPECES)}
              </p>
            </div>

            {/* Virement / Chèque */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <p className="text-[11px] font-extrabold text-slate-700">Virement & Chèque</p>
              <p className="text-base font-extrabold text-slate-900">
                {formatFCFA(metrics.parMode.VIREMENT + metrics.parMode.CHEQUE)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets : Journal des Ventes vs Créances & Relances */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("JOURNAL");
                setCurrentPage(1);
              }}
              className={`pb-3 text-sm font-extrabold transition-all border-b-2 ${
                activeTab === "JOURNAL"
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Journal des Ventes ({journalList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("DEVIS");
                setCurrentPage(1);
              }}
              className={`pb-3 text-sm font-extrabold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "DEVIS"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Devis Estimatifs</span>
              {devisList.length > 0 && (
                <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {devisList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("CREANCES");
                setCurrentPage(1);
              }}
              className={`pb-3 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "CREANCES"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Créances & Relances Clients</span>
              {creancesList.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {creancesList.length}
                </span>
              )}
            </button>
          </div>

          {/* Recherche & Filtre rapide */}
          {(activeTab === "JOURNAL" || activeTab === "DEVIS") && (
            <div className="flex items-center gap-3 pb-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher facture, client..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-brand-blue w-60"
                />
              </div>

              <select
                value={paymentModeFilter}
                onChange={(e) => {
                  setPaymentModeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-brand-blue"
              >
                <option value="ALL">Tous règlements</option>
                <option value="MTN_MOMO">MTN MoMo</option>
                <option value="MOOV_MONEY">Moov Money</option>
                <option value="ESPECES">Espèces</option>
                <option value="VIREMENT">Virement bancaire</option>
                <option value="CHEQUE">Chèque</option>
              </select>
            </div>
          )}
        </div>

        {/* Tableau Journal des Ventes */}
        {activeTab === "JOURNAL" ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-4 px-6">N° Pièce</th>
                    <th className="py-4 px-6">Date Émission</th>
                    <th className="py-4 px-6">Client / Entreprise</th>
                    <th className="py-4 px-6">Type & Activité</th>
                    <th className="py-4 px-6">Montant</th>
                    <th className="py-4 px-6">Règlement</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        Aucun document trouvé pour cette période.
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc) => {
                      const client = getClientData(doc);
                      const isPaid = doc.statutPaiement === "PAYE";

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-extrabold text-brand-blue">
                            {doc.numero}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {format(new Date(doc.dateEmission), "dd MMM yyyy", { locale: fr })}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-extrabold text-slate-900">
                              {client?.nom || "Client Divers"}
                            </p>
                            {client?.telephone && (
                              <p className="text-[11px] text-slate-400 font-medium">
                                {client.telephone}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700">
                              {doc.contract
                                ? "Contrat Maintenance"
                                : doc.demandeCommerciale
                                ? "Vente Commerciale"
                                : "Atelier Réparation"}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                            {formatFCFA(doc.montant)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {isPaid ? "RÉGLÉ" : "EN ATTENTE"}
                              </span>
                              {doc.modePaiement && (
                                <p className="text-[10px] font-bold text-slate-400">
                                  {doc.modePaiement}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPaymentModal({
                                      isOpen: true,
                                      docId: doc.id,
                                      numero: doc.numero,
                                      montant: doc.montant,
                                    })
                                  }
                                  className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-brand-green px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  Encaisser
                                </button>
                              )}
                              <a
                                href={`/api/documents/${doc.numero}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-brand-blue p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Télécharger le PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100">
              <PaginationControls
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        ) : activeTab === "DEVIS" ? (
          /* Tableau Devis Estimatifs */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-4 px-6">N° Devis</th>
                    <th className="py-4 px-6">Date Émission</th>
                    <th className="py-4 px-6">Client / Entreprise</th>
                    <th className="py-4 px-6">Appareil / Prestation</th>
                    <th className="py-4 px-6">Montant Estimatif</th>
                    <th className="py-4 px-6">Statut Commercial</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        Aucun devis estimatif émis pour cette période.
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc) => {
                      const client = getClientData(doc);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-extrabold text-purple-700">
                            {doc.numero}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {format(new Date(doc.dateEmission), "dd MMM yyyy", { locale: fr })}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-extrabold text-slate-900">{client?.nom || "Client"}</p>
                            {client?.telephone && (
                              <p className="text-[11px] text-slate-400 font-medium">{client.telephone}</p>
                            )}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-700">
                            {doc.intervention?.typeMateriel?.replace(/_/g, " ") || "Intervention technique"}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                            {formatFCFA(doc.montant)}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                doc.statutPaiement === "PAYE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : doc.statutPaiement === "REFUSE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {doc.statutPaiement === "PAYE"
                                ? "ACCEPTÉ"
                                : doc.statutPaiement === "REFUSE"
                                ? "REFUSÉ"
                                : "EN ATTENTE"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <a
                              href={`/api/documents/${doc.numero}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-brand-blue p-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex"
                              title="Télécharger Devis PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100">
              <PaginationControls
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        ) : (
          /* Tableau Créances & Relances */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-4 px-6">N° Facture</th>
                    <th className="py-4 px-6">Client / Entreprise</th>
                    <th className="py-4 px-6">Date Émission</th>
                    <th className="py-4 px-6">Ancienneté</th>
                    <th className="py-4 px-6">Montant Dû</th>
                    <th className="py-4 px-6 text-right">Actions de Recouvrement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        Aucune créance en retard sur cette période. Toutes les factures sont soldées !
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc: any) => {
                      const client = doc.client;
                      const isVeryLate = doc.daysLate > 30;
                      const isLate = doc.daysLate > 15;

                      // Message WhatsApp pré-rempli pour relance courtoise et professionnelle
                      const whatsappText = encodeURIComponent(
                        `Bonjour ${client?.nom || ""},\nRyHaD Tic-Medic vous rappelle que la facture N° ${
                          doc.numero
                        } d'un montant de ${formatFCFA(
                          doc.montant
                        )} émise le ${format(
                          new Date(doc.dateEmission),
                          "dd/MM/yyyy"
                        )} est en attente de règlement.\nMerci de bien vouloir nous confirmer votre paiement (MoMo/Virement/Espèces). Nous restons à votre entière disposition.`
                      );

                      const whatsappUrl = client?.telephone
                        ? `https://wa.me/229${client.telephone.replace(/\s+/g, "").replace(/^\+229/, "")}?text=${whatsappText}`
                        : null;

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-extrabold text-amber-700">
                            {doc.numero}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-extrabold text-slate-900">{client?.nom || "—"}</p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {client?.telephone || "Pas de téléphone"}
                            </p>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {format(new Date(doc.dateEmission), "dd MMM yyyy", { locale: fr })}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                isVeryLate
                                  ? "bg-red-100 text-red-800"
                                  : isLate
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{doc.daysLate} jour(s)</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 font-extrabold text-red-600 text-sm">
                            {formatFCFA(doc.montant)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Bouton Relance WhatsApp */}
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors shadow-2xs"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Relancer WhatsApp</span>
                                </a>
                              )}

                              {/* Encaisser */}
                              <button
                                type="button"
                                onClick={() =>
                                  setPaymentModal({
                                    isOpen: true,
                                    docId: doc.id,
                                    numero: doc.numero,
                                    montant: doc.montant,
                                  })
                                }
                                className="bg-brand-blue hover:bg-brand-blue-dark text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs"
                              >
                                Encaisser
                              </button>

                              {/* Télécharger PDF */}
                              <a
                                href={`/api/documents/${doc.numero}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100">
              <PaginationControls
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal d'enregistrement de paiement */}
      <PaymentConfirmationModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, docId: null, numero: "", montant: 0 })}
        onConfirm={async (mode, ref) => {
          if (!paymentModal.docId) return;
          try {
            const res = await fetch("/api/crm/documents/generate", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documentId: paymentModal.docId,
                statutPaiement: "PAYE",
                modePaiement: mode,
                referencePaiement: ref,
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Erreur validation paiement.");
            setPaymentModal({ isOpen: false, docId: null, numero: "", montant: 0 });
            router.refresh();
          } catch (err) {
            console.error("Erreur enregistrement paiement:", err);
          }
        }}
        montant={paymentModal.montant}
        titre={`Encaissement Facture ${paymentModal.numero}`}
        description="Confirmez le mode de règlement reçu pour solder cette facture."
      />
    </div>
  );
}
