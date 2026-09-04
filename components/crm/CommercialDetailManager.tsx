"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  Download,
  Receipt,
  CreditCard,
  Ban,
  Archive,
  Lock,
} from "lucide-react";
import {
  DemandeStatut,
  TypeDemandeCommerciale,
  DocumentType,
  FactureType,
  StaffRole,
} from "@prisma/client";
import { PaymentConfirmationModal } from "@/components/crm/PaymentConfirmationModal";
import { formatFCFA, formatNumber } from "@/lib/format";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArticleLine {
  id?: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

interface Props {
  demande: {
    id: string;
    clientId: string | null;
    typeDemande: TypeDemandeCommerciale;
    description: string;
    statut: DemandeStatut;
    lignesCotation: string | null;
    montantTotal: number | null;
    notesInternes: string | null;
    createdAt: string;
    updatedAt: string;
    client: {
      id: string;
      nom: string;
      telephone: string;
      email: string | null;
      adresse: string | null;
    } | null;
    documents: {
      id: string;
      numero: string;
      type: DocumentType;
      typeFacture: FactureType | null;
      montant: number;
      statutPaiement: string;
      dateEmission: string;
    }[];
  };
  userRole: StaffRole;
  userName: string;
}

export function CommercialDetailManager({ demande, userRole, userName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Initialisation des lignes d'articles
  const [articles, setArticles] = useState<ArticleLine[]>(() => {
    if (demande.lignesCotation) {
      try {
        const parsed = JSON.parse(demande.lignesCotation);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    // Ligne initiale par défaut selon le type
    if (demande.typeDemande === TypeDemandeCommerciale.VENTE_MATERIEL) {
      return [{ designation: "Fourniture matériel informatique", quantite: 1, prixUnitaire: 0 }];
    }
    if (demande.typeDemande === TypeDemandeCommerciale.LOCATION_VIDEOPROJECTEUR) {
      return [{ designation: "Location vidéoprojecteur + écran (par jour)", quantite: 1, prixUnitaire: 0 }];
    }
    if (demande.typeDemande === TypeDemandeCommerciale.FORMATION) {
      return [{ designation: "Session de formation technique", quantite: 1, prixUnitaire: 0 }];
    }
    return [{ designation: "Prestation / Fourniture", quantite: 1, prixUnitaire: 0 }];
  });

  const [newLine, setNewLine] = useState<ArticleLine>({
    designation: "",
    quantite: 1,
    prixUnitaire: 0,
  });

  const [notesInternes, setNotesInternes] = useState(demande.notesInternes || "");

  const totalCalculated = articles.reduce(
    (acc, item) => acc + (Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0),
    0
  );

  const devisDoc = demande.documents.find((d) => d.type === DocumentType.DEVIS);
  const factDoc = demande.documents.find((d) => d.type === DocumentType.FACTURE);

  const isEditable =
    demande.statut === DemandeStatut.NOUVEAU ||
    demande.statut === DemandeStatut.EN_COURS;

  const handleAction = async (actionType: string, extraBody: any = {}) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/crm/demandes-commerciales/${demande.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          lignes: articles,
          notesInternes,
          ...extraBody,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de l'opération.");
      }

      setSuccessMsg(data.message || "Opération effectuée avec succès.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine.designation.trim() || newLine.prixUnitaire <= 0) {
      setError("Veuillez renseigner une désignation et un prix unitaire supérieur à 0 FCFA.");
      return;
    }
    setArticles([...articles, { ...newLine }]);
    setNewLine({ designation: "", quantite: 1, prixUnitaire: 0 });
    setError(null);
  };

  const handleRemoveLine = (idx: number) => {
    setArticles(articles.filter((_, i) => i !== idx));
  };

  const getTypeIcon = (type: TypeDemandeCommerciale) => {
    switch (type) {
      case TypeDemandeCommerciale.VENTE_MATERIEL:
        return <ShoppingBag className="w-5 h-5 text-brand-blue" />;
      case TypeDemandeCommerciale.LOCATION_VIDEOPROJECTEUR:
        return <Tv className="w-5 h-5 text-purple-600" />;
      case TypeDemandeCommerciale.FORMATION:
        return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      default:
        return <Wrench className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (demande.statut) {
      case DemandeStatut.NOUVEAU:
        return {
          label: "Demande reçue (Nouveau)",
          className: "bg-amber-100 text-amber-800 border-amber-300 font-extrabold",
        };
      case DemandeStatut.EN_COURS:
        return {
          label: "En cours d'étude & cotation",
          className: "bg-blue-100 text-brand-blue border-blue-300 font-extrabold",
        };
      case DemandeStatut.DEVIS_ENVOYE:
        return {
          label: "Devis émis & transmis",
          className: "bg-purple-100 text-purple-800 border-purple-300 font-extrabold",
        };
      case DemandeStatut.DEVIS_ACCEPTE:
        return {
          label: "Devis validé (Facture en attente)",
          className: "bg-amber-50 text-amber-900 border-amber-400 font-extrabold",
        };
      case DemandeStatut.DEVIS_REFUSE:
        return {
          label: "Devis refusé",
          className: "bg-red-100 text-red-800 border-red-300 font-extrabold",
        };
      case DemandeStatut.FACTURE_PAYEE:
        return {
          label: "Facture réglée (Payée)",
          className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold",
        };
      case DemandeStatut.CLOS:
        return {
          label: "Dossier commercial clôturé",
          className: "bg-gray-100 text-gray-700 border-gray-300 font-bold",
        };
      default:
        return {
          label: demande.statut,
          className: "bg-gray-100 text-gray-700 border-gray-300 font-bold",
        };
    }
  };

  const statusBadge = getStatusBadge();
  const clientPhone = demande.client?.telephone || "";
  const clientCleanPhone = clientPhone.replace(/[^0-9]/g, "");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Navigation retour */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/demandes-commerciales"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux demandes commerciales</span>
        </Link>
      </div>

      {/* Messages d'alerte & Toasts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2.5 font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-2.5 font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL & ACTION BAR UNIFIÉE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 subtle-shadow space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-brand-slate inline-flex items-center justify-center">
                {getTypeIcon(demande.typeDemande)}
              </span>
              <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">
                {demande.typeDemande.replace(/_/g, " ")}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-lg border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              Demande Commerciale : {demande.client?.nom || "Prospect non identifié"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Reçue le {format(new Date(demande.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>

          {/* Action Bar Supérieure */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Action suivante :
            </span>

            {/* 1. Statut NOUVEAU */}
            {demande.statut === DemandeStatut.NOUVEAU && (
              <button
                onClick={() => handleAction("traiter")}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-xs transition-all bg-brand-blue hover:bg-brand-blue-dark text-white disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5 text-white" />
                <span>Prendre en Charge & Cotation</span>
              </button>
            )}

            {/* 2. Statut EN_COURS */}
            {demande.statut === DemandeStatut.EN_COURS && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAction("sauvegarder_lignes")}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sauvegarder</span>
                </button>
                <button
                  onClick={() => handleAction("emettre_devis")}
                  disabled={loading || totalCalculated <= 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-xs transition-all bg-brand-blue hover:bg-brand-blue-dark text-white disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Émettre Devis ({formatFCFA(totalCalculated)})</span>
                </button>
              </div>
            )}

            {/* 3. Statut DEVIS_ENVOYE */}
            {demande.statut === DemandeStatut.DEVIS_ENVOYE && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAction("refuser_devis")}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-600" />
                  <span>Refuser Devis</span>
                </button>
                <button
                  onClick={() => handleAction("valider_accord")}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-xs transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valider Accord Client</span>
                </button>
              </div>
            )}

            {/* 4. Statut DEVIS_ACCEPTE */}
            {demande.statut === DemandeStatut.DEVIS_ACCEPTE && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-xs transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Encaisser Facture ({formatFCFA(factDoc?.montant || demande.montantTotal || 0)})</span>
              </button>
            )}

            {/* 5. Statut FACTURE_PAYEE */}
            {demande.statut === DemandeStatut.FACTURE_PAYEE && (
              <button
                onClick={() => handleAction("cloturer")}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-sm transition-all bg-brand-blue hover:bg-brand-blue-dark text-white disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5 text-brand-green" />
                <span>Clôturer la Prestation / Vente</span>
              </button>
            )}

            {/* 6. Statut DEVIS_REFUSE */}
            {demande.statut === DemandeStatut.DEVIS_REFUSE && (
              <button
                onClick={() => handleAction("cloturer")}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archiver Dossier</span>
              </button>
            )}

            {/* 7. Statut CLOS */}
            {demande.statut === DemandeStatut.CLOS && (
              <span className="text-xs font-bold text-gray-600 bg-white px-3.5 py-2 rounded-lg border border-gray-200 flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                <span>Dossier commercial finalisé et archivé</span>
              </span>
            )}
          </div>
        </div>

        {/* FICHE CLIENT & EXPRESSION DU BESOIN */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          <div className="md:col-span-5 space-y-2 p-5 rounded-2xl bg-brand-slate/60 border border-gray-100">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
              Contact Prospect / Client
            </span>
            <div className="font-extrabold text-brand-dark text-sm">
              {demande.client?.nom || "Prospect non enregistré"}
            </div>
            <div className="text-gray-600 font-semibold">{demande.client?.telephone}</div>
            {demande.client?.email && <div className="text-gray-500">{demande.client.email}</div>}
            {demande.client?.adresse && <div className="text-gray-500">{demande.client.adresse}</div>}

            {clientPhone && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/${clientCleanPhone}?text=${encodeURIComponent(
                    `Bonjour ${demande.client?.nom}, nous faisons suite à votre demande concernant "${demande.typeDemande.replace(
                      /_/g,
                      " "
                    )}" chez RyHaD Tic-Medic.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white font-extrabold px-3 py-1.5 rounded-lg text-[11px] transition-all border border-[#25D366]/30 shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Commercial</span>
                </a>
                <a
                  href={`tel:${clientPhone}`}
                  className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all border border-gray-200"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span>Appeler</span>
                </a>
              </div>
            )}
          </div>

          <div className="md:col-span-7 space-y-2 p-5 rounded-2xl bg-brand-slate/60 border border-gray-100">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
              Besoin Exprimé par le Client
            </span>
            <p className="text-gray-800 leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200 font-medium">
              {demande.description}
            </p>
          </div>
        </div>
      </div>

      {/* TABLEAU DE CHIFFRAGE & LIGNES DE COTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 subtle-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-brand-dark">Lignes de Cotation & Articles</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Détaillez les produits, durées de location ou modules de formation inclus au devis.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Cotation</span>
              <span className="text-xl font-extrabold text-brand-blue">{formatFCFA(totalCalculated)}</span>
            </div>
          </div>

          {/* Liste des lignes */}
          <div className="space-y-2.5">
            {articles.map((item, idx) => {
              const lineTotal = (Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0);
              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-brand-slate border border-gray-100 gap-3 text-xs"
                >
                  <div className="flex-1">
                    <span className="font-bold text-brand-dark block text-xs">{item.designation}</span>
                    <span className="text-gray-500 text-[11px]">
                      {item.quantite} x {formatFCFA(item.prixUnitaire)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-extrabold text-brand-dark text-sm">{formatFCFA(lineTotal)}</span>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={loading}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {articles.length === 0 && (
              <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs">
                Aucun article ou prestation n&apos;est actuellement renseigné.
              </div>
            )}
          </div>

          {/* Formulaire d'ajout de ligne */}
          {isEditable && (
            <form onSubmit={handleAddLine} className="pt-4 border-t border-gray-100 space-y-3">
              <span className="text-xs font-extrabold text-gray-700 block">+ Ajouter un Article / Prestation</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Désignation"
                  value={newLine.designation}
                  onChange={(e) => setNewLine({ ...newLine, designation: e.target.value })}
                  className="sm:col-span-6 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none"
                />
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="Quantité"
                  value={newLine.quantite}
                  onChange={(e) =>
                    setNewLine({ ...newLine, quantite: parseInt(e.target.value, 10) || 1 })
                  }
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none text-center"
                />
                <input
                  type="number"
                  min={0}
                  step={500}
                  required
                  placeholder="Prix unitaire"
                  value={newLine.prixUnitaire || ""}
                  onChange={(e) =>
                    setNewLine({ ...newLine, prixUnitaire: parseInt(e.target.value, 10) || 0 })
                  }
                  className="sm:col-span-3 px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none text-right font-bold text-brand-blue"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-1 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl flex items-center justify-center p-2.5 shadow-2xs transition-all"
                  title="Ajouter la ligne"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* DOCUMENTS FINANCIERS ÉMIS (Devis & Factures) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 subtle-shadow space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Receipt className="w-5 h-5 text-brand-green" />
              <h2 className="text-base font-extrabold text-brand-dark">Documents Officiels</h2>
            </div>

            <div className="space-y-3">
              {demande.documents.map((doc) => {
                const isDocDevis = doc.type === DocumentType.DEVIS;
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-brand-slate border border-gray-100 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-brand-blue text-sm">{doc.numero}</span>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                          doc.statutPaiement === "PAYE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : doc.statutPaiement === "REFUSE"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {doc.statutPaiement === "PAYE"
                          ? "PAYÉE"
                          : doc.statutPaiement === "REFUSE"
                          ? "REFUSÉ"
                          : isDocDevis
                          ? "DEVIS ÉMIS"
                          : "EN ATTENTE"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span>{isDocDevis ? "Devis Estimatif" : "Facture Commerciale"}</span>
                      <span className="font-extrabold text-brand-dark text-sm">
                        {formatFCFA(doc.montant)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-end">
                      <a
                        href={`/api/documents/${doc.numero}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-2xs transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-brand-green" />
                        <span>Télécharger PDF</span>
                      </a>
                    </div>
                  </div>
                );
              })}

              {demande.documents.length === 0 && (
                <div className="p-4 text-center text-gray-400 italic text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Aucun devis ni facture émis pour le moment.
                </div>
              )}
            </div>
          </div>

          {/* Notes Internes */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 subtle-shadow space-y-3">
            <h3 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider">
              Notes & Suivi Réception
            </h3>
            <textarea
              rows={3}
              placeholder="Notes et observations"
              value={notesInternes}
              onChange={(e) => setNotesInternes(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
            {isEditable && (
              <button
                type="button"
                onClick={() => handleAction("sauvegarder_lignes")}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
              >
                <Save className="w-3.5 h-3.5 text-gray-500" />
                <span>Enregistrer Notes</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modale d'encaissement avec mode de paiement */}
      <PaymentConfirmationModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={(modePaiement, referencePaiement) =>
          handleAction("encaisser_facture", { modePaiement, referencePaiement })
        }
        montant={factDoc?.montant || demande.montantTotal || 0}
        titre={`Encaissement Facture Commerciale ${factDoc?.numero || ""}`}
        description="Confirmez le mode de règlement de la prestation/vente commerciale."
        loading={loading}
      />
    </div>
  );
}
