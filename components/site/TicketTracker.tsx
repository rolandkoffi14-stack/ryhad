"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Laptop,
  AlertCircle,
  Phone,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileText,
  Download,
  Check,
  XCircle,
  Receipt,
  Sparkles,
  Lock,
  Printer,
} from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { PrintDocumentModal } from "@/components/crm/PrintDocumentModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PieceItem {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

interface DevisInfo {
  numero: string;
  montant: number;
  statutPaiement: string;
}

interface TicketData {
  id?: string;
  numero: string;
  type: string;
  typeMateriel: string;
  panneDeclaree: string;
  modeIntervention: string;
  clientNom: string;
  dateCreation: string;
  dateCloture: string | null;
  statut: string;
  isUnlocked: boolean;
  statusInfo: {
    label: string;
    description: string;
    stepIndex: number;
    totalSteps: number;
    isComplete: boolean;
  };
  devis?: DevisInfo | null;
  pieces?: PieceItem[];
}

interface Props {
  initialNumero?: string;
}

export function TicketTracker({ initialNumero }: Props) {
  const router = useRouter();
  const [numero, setNumero] = useState(initialNumero || "");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchTicket = async (numToSearch: string, phoneCode: string = phoneSuffix) => {
    if (!numToSearch.trim()) return;
    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const url = `/api/suivi/${encodeURIComponent(numToSearch.trim())}${
        phoneCode ? `?phone=${encodeURIComponent(phoneCode.trim())}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Dossier introuvable.");
      }

      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || "Impossible de trouver ce dossier.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialNumero) {
      fetchTicket(initialNumero);
    }
  }, [initialNumero]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) return;
    router.push(`/suivi/${numero.toUpperCase().trim()}`);
    fetchTicket(numero, phoneSuffix);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !phoneSuffix.trim()) return;
    fetchTicket(numero, phoneSuffix);
  };

  const handleClientAction = async (action: "accept_devis" | "refuse_devis") => {
    if (!ticket) return;
    if (!phoneSuffix.trim()) {
      setError("Veuillez saisir les 4 derniers chiffres de votre téléphone pour confirmer votre accord.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/suivi/${encodeURIComponent(ticket.numero)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phoneSuffix }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de l'enregistrement de votre décision.");
      }
      setActionSuccess(data.message);
      // Recharger les données du ticket déverrouillé
      await fetchTicket(ticket.numero, phoneSuffix);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const stepsList = [
    { title: "Demande reçue", step: 1 },
    { title: "Diagnostic technique", step: 2 },
    { title: "Devis & Accord", step: 3 },
    { title: "Réparation & Tests", step: 4 },
    { title: "Prêt en atelier", step: 5 },
    { title: "Livré / Clôturé", step: 6 },
  ];

  return (
    <div className="space-y-8">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-2">
        <div className="bg-white p-2 rounded-2xl border border-gray-200 subtle-shadow flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Numéro de suivi"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-xl border-0 focus:ring-2 focus:ring-brand-blue outline-none text-brand-dark"
            />
          </div>
          <div className="relative w-full sm:w-44">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="4 chiffres téléphone"
              value={phoneSuffix}
              maxLength={10}
              onChange={(e) => setPhoneSuffix(e.target.value)}
              className="w-full pl-9 pr-3 py-3 text-xs font-semibold rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none text-brand-dark"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <span>Recherche...</span>
            ) : (
              <>
                <span>Consulter</span>
                <ArrowRight className="w-4 h-4 text-brand-green" />
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-500 text-center">
          Les 4 derniers chiffres du téléphone client permettent de déverrouiller le devis chiffré et l&apos;accord en ligne.
        </p>
      </form>

      {/* Message d'erreur ou succès */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-3 font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-emerald-50 border border-brand-green/30 text-brand-green-dark text-xs flex items-center gap-3 font-bold">
          <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Résultat du ticket */}
      {ticket && (
        <div className="bg-white rounded-2xl border border-gray-200 subtle-shadow p-6 sm:p-10 space-y-8 max-w-4xl mx-auto">
          {/* Header Ticket */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Dossier de réparation
                </span>
                <span className="text-xs font-bold bg-brand-blue-light text-brand-blue px-2 py-0.5 rounded">
                  {ticket.type === "CONTRACTUEL" ? "Contrat Entreprise" : "Particulier / Ponctuel"}
                </span>
                {ticket.isUnlocked ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Dossier Déverrouillé</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gray-500" />
                    <span>Vue Publique</span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-blue tracking-tight">
                {ticket.numero}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Bénéficiaire : <strong>{ticket.clientNom}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-500 space-y-1">
              <div className="flex sm:justify-end items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-green" />
                <span>
                  Déposé le {format(new Date(ticket.dateCreation), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="font-semibold text-brand-dark">
                Appareil : {ticket.typeMateriel.replace(/_/g, " ")}
              </div>
            </div>
          </div>

          {/* Timeline Visuelle des étapes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Progression de la prise en charge
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 pt-2">
              {stepsList.map((stepItem) => {
                const isPassed = ticket.statusInfo.stepIndex >= stepItem.step;
                const isCurrent = ticket.statusInfo.stepIndex === stepItem.step;

                return (
                  <div key={stepItem.step} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? "bg-brand-green text-white shadow-sm ring-4 ring-brand-green-light"
                          : "bg-gray-100 text-gray-400"
                      } ${isCurrent ? "scale-110 ring-4 ring-brand-blue/30 bg-brand-blue" : ""}`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{stepItem.step}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs leading-tight font-medium ${
                        isPassed ? "text-brand-dark font-bold" : "text-gray-400"
                      }`}
                    >
                      {stepItem.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statut actuel & Explication */}
          <div className="p-6 rounded-2xl bg-brand-blue-light/50 border border-brand-blue/20 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-brand-green animate-ping"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                État actuel du dossier
              </span>
            </div>
            <h4 className="text-xl font-extrabold text-brand-dark">
              {ticket.statusInfo.label}
            </h4>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {ticket.statusInfo.description}
            </p>
          </div>

          {/* INVITATION AU DÉVERROUILLAGE SÉCURISÉ (Si non déverrouillé) */}
          {!ticket.isUnlocked && (
            <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-900">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <h4 className="font-extrabold text-xs sm:text-sm">
                  Confidentialité du devis et des pièces
                </h4>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Pour des raisons de sécurité et de confidentialité, les montants chiffrés, pièces et boutons d&apos;accord sont protégés. Saisissez les 4 derniers chiffres de votre numéro de téléphone pour déverrouiller l&apos;accès complet :
              </p>
              <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  placeholder="4 chiffres téléphone"
                  value={phoneSuffix}
                  maxLength={10}
                  onChange={(e) => setPhoneSuffix(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !phoneSuffix.trim()}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shrink-0 disabled:opacity-50"
                >
                  Déverrouiller
                </button>
              </form>
            </div>
          )}

          {/* SECTION D'ACCORD DU CLIENT SUR LE DEVIS (Si DEVIS_ENVOYE & Déverrouillé) */}
          {ticket.isUnlocked && ticket.statut === "DEVIS_ENVOYE" && ticket.devis && (
            <div className="p-6 sm:p-8 rounded-2xl bg-brand-blue-light/40 border border-brand-blue/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-blue/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-100 px-2 py-0.5 rounded">
                      Action Requise
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark mt-1">
                      Proposition de Devis : {ticket.devis.numero}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Consultez les détails ci-dessous et validez votre accord pour autoriser la réparation.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Estimatif</span>
                  <span className="text-2xl font-extrabold text-brand-blue">
                    {formatFCFA(ticket.devis.montant)}
                  </span>
                </div>
              </div>

              {/* Détail des lignes */}
              {ticket.pieces && ticket.pieces.length > 0 && (
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Détail des pièces et prestations chiffrées :
                  </span>
                  <div className="divide-y divide-gray-100 text-xs">
                    {ticket.pieces.map((p, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-brand-dark">{p.designation}</span>
                          <span className="text-gray-500 ml-2">x{p.quantite}</span>
                        </div>
                        <span className="font-bold text-brand-blue">
                          {formatFCFA(p.prixUnitaire * p.quantite)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boutons d'action client */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>🖨️ Imprimer / Sauvegarder</span>
                  </button>

                  <a
                    href={`/api/documents/${ticket.devis.numero}/pdf?download=true&phoneSuffix=${encodeURIComponent(phoneSuffix.trim())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-brand-dark px-3 py-3 rounded-xl text-xs font-bold shadow-xs transition-all"
                    title="Télécharger le fichier PDF officiel"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span className="hidden md:inline">PDF</span>
                  </a>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleClientAction("refuse_devis")}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Décliner / Refuser</span>
                  </button>

                  <button
                    onClick={() => handleClientAction("accept_devis")}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider & Accepter le Devis</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Détail de la panne déclarée (uniquement si déverrouillé) */}
          {ticket.isUnlocked && (
            <div className="p-4 rounded-xl bg-brand-slate border border-gray-100 text-xs space-y-1">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                Problème signalé au dépôt :
              </span>
              <p className="text-gray-700 italic">&ldquo;{ticket.panneDeclaree}&rdquo;</p>
            </div>
          )}

          {/* Contact d'assistance */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Besoin d&apos;informations complémentaires sur ce dossier ?</span>
            </div>
            <a
              href="tel:+2290190881314"
              className="inline-flex items-center gap-2 text-brand-blue font-bold hover:underline"
            >
              <Phone className="w-3.5 h-3.5 text-brand-green" />
              <span>Contacter l&apos;atelier : +229 01 90 88 13 14</span>
            </a>
          </div>
        </div>
      )}

      {/* Modale d'impression immédiate client */}
      {ticket?.devis && (
        <PrintDocumentModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentNumero={ticket.devis.numero}
          defaultFormat="a4"
          titre={`Devis Estimatif : ${ticket.devis.numero}`}
        />
      )}
    </div>
  );
}
