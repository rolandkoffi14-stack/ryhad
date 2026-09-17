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
  Loader2,
  Image as ImageIcon,
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

interface PhotoItem {
  id: string;
  url: string;
  type?: string;
}

interface TicketData {
  id?: string;
  numero: string;
  type: string;
  typeMateriel: string;
  panneDeclaree: string;
  diagnosticTechnicien?: string | null;
  modeIntervention: string;
  clientNom: string;
  clientTelephoneMasque?: string;
  dateCreation: string;
  dateCloture: string | null;
  statut: string;
  statusInfo: {
    label: string;
    description: string;
    stepIndex: number;
    totalSteps: number;
    isComplete: boolean;
  };
  devis?: DevisInfo | null;
  pieces?: PieceItem[];
  photos?: PhotoItem[];
}

interface Props {
  initialNumero?: string;
  initialPhone?: string;
}

export function TicketTracker({ initialNumero, initialPhone }: Props) {
  const router = useRouter();
  const [numero, setNumero] = useState(initialNumero || "");
  const [phoneSuffix, setPhoneSuffix] = useState(initialPhone || "");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [requiresPhoneForTicket, setRequiresPhoneForTicket] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchTicket = async (numToSearch: string, phoneCode: string) => {
    const cleanNum = numToSearch.trim().toUpperCase();
    const cleanPhone = phoneCode.trim().replace(/\D/g, "");

    if (!cleanNum) return;

    // Si aucun téléphone n'est fourni, on bascule en demande de confirmation
    if (cleanPhone.length < 4) {
      setRequiresPhoneForTicket(cleanNum);
      setTicket(null);
      return;
    }

    setLoading(true);
    setError(null);
    setActionSuccess(null);
    setRequiresPhoneForTicket(null);

    try {
      const url = `/api/suivi/${encodeURIComponent(cleanNum)}?t=${encodeURIComponent(cleanPhone.slice(-4))}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.requiresPhone) {
          setRequiresPhoneForTicket(cleanNum);
          throw new Error(data.message || "Confirmation requise.");
        }
        if (data.invalidPhone) {
          setRequiresPhoneForTicket(cleanNum);
          throw new Error("Les 4 chiffres du téléphone ne correspondent pas à ce dossier.");
        }
        throw new Error(data.message || "Dossier introuvable.");
      }

      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || "Impossible d'accéder à ce dossier.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  // Chargement automatique au montage (Lien magique avec ?t=...)
  useEffect(() => {
    if (initialNumero) {
      if (initialPhone && initialPhone.replace(/\D/g, "").length >= 4) {
        fetchTicket(initialNumero, initialPhone);
      } else {
        setRequiresPhoneForTicket(initialNumero.trim().toUpperCase());
      }
    }
  }, [initialNumero, initialPhone]);

  // Soumission manuelle depuis la barre de recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = numero.trim().toUpperCase();
    const cleanPhone = phoneSuffix.trim().replace(/\D/g, "");

    if (!cleanNum) {
      setError("Veuillez saisir votre référence de dossier (ex: INT-2026-XXXX).");
      return;
    }

    if (cleanPhone.length < 4) {
      setError("Veuillez saisir les 4 derniers chiffres du numéro de téléphone associé à ce dossier.");
      setRequiresPhoneForTicket(cleanNum);
      return;
    }

    // Naviguer avec le lien magique
    router.push(`/suivi/${cleanNum}?t=${cleanPhone.slice(-4)}`);
    fetchTicket(cleanNum, cleanPhone);
  };

  // Soumission du formulaire d'invite sécurisée (quand accès sans paramètre t)
  const handleConfirmPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = requiresPhoneForTicket || numero;
    const cleanPhone = phoneSuffix.trim().replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 4) {
      setError("Veuillez saisir les 4 derniers chiffres de votre numéro de téléphone.");
      return;
    }

    router.push(`/suivi/${targetNum.trim().toUpperCase()}?t=${cleanPhone.slice(-4)}`);
    fetchTicket(targetNum, cleanPhone);
  };

  // Accord ou Refus du devis en un clic
  const handleClientAction = async (action: "accept_devis" | "refuse_devis") => {
    if (!ticket) return;
    const cleanPhone = phoneSuffix.trim().replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 4) {
      setError("Veuillez confirmer les 4 derniers chiffres de votre téléphone.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/suivi/${encodeURIComponent(ticket.numero)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phoneSuffix: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de l'enregistrement de votre décision.");
      }
      setActionSuccess(data.message);
      // Recharger les données complètes à jour
      await fetchTicket(ticket.numero, cleanPhone);
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
      {/* 1. BARRE DE RECHERCHE UNIFIÉE (Si aucun ticket n'est affiché) */}
      {!ticket && !requiresPhoneForTicket && (
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto space-y-3">
          <div className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-md flex flex-col sm:flex-row items-center gap-2">
            {/* Champ N° de dossier */}
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="N° de dossier (ex: INT-2026-XXXX)"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-xl border-0 focus:ring-2 focus:ring-brand-blue outline-none text-brand-dark placeholder:text-gray-400 placeholder:normal-case"
              />
            </div>

            {/* Champ 4 chiffres téléphone obligatoire */}
            <div className="relative w-full sm:w-56">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="4 derniers chiffres tél."
                value={phoneSuffix}
                maxLength={4}
                onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, ""))}
                className="w-full pl-10 pr-3 py-3 text-xs sm:text-sm font-bold tracking-widest rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none text-brand-dark"
              />
            </div>

            {/* Bouton de recherche */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <span>Consulter mon dossier</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <Lock className="w-3.5 h-3.5 text-brand-blue shrink-0" />
            <span>Accès sécurisé : la combinaison du N° de dossier et des 4 derniers chiffres du téléphone garantit la confidentialité de votre appareil.</span>
          </div>
        </form>
      )}

      {/* 2. INVITE SÉCURISÉE SI ACCÈS PAR LIEN SANS TÉLÉPHONE */}
      {!ticket && requiresPhoneForTicket && (
        <div className="max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-brand-blue" />
          </div>

          <div className="text-center space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-brand-blue-light px-3 py-1 rounded-full">
              Dossier Protégé
            </span>
            <h2 className="text-xl font-extrabold text-brand-dark pt-2">
              Dossier N° {requiresPhoneForTicket}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pour des raisons de confidentialité, veuillez saisir les <strong>4 derniers chiffres du numéro de téléphone</strong> associé à ce matériel pour afficher le suivi et vos documents.
            </p>
          </div>

          <form onSubmit={handleConfirmPhone} className="space-y-4 pt-1">
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Ex: 9101"
                value={phoneSuffix}
                maxLength={4}
                onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, ""))}
                className="w-full pl-12 pr-4 py-3.5 text-base sm:text-lg font-bold tracking-widest text-center rounded-2xl border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-brand-dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading || phoneSuffix.trim().length < 4}
              className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3.5 px-6 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Afficher mon dossier complet</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setRequiresPhoneForTicket(null);
                setNumero("");
                setPhoneSuffix("");
                setError(null);
                router.push("/suivi");
              }}
              className="text-xs text-gray-500 hover:text-brand-blue font-medium transition-colors"
            >
              ← Consulter un autre dossier
            </button>
          </div>
        </div>
      )}

      {/* 3. ALERTES D'ERREUR OU DE SUCCÈS */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-3 font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-brand-red" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-emerald-50 border border-brand-green/30 text-brand-green-dark text-xs flex items-center gap-3 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4. DOSSIER COMPLET DÉVERROUILLÉ (100% VISIBLE) */}
      {ticket && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-10 space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
          {/* Header Ticket */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Dossier de réparation
                </span>
                <span className="text-xs font-bold bg-brand-blue-light text-brand-blue px-2.5 py-0.5 rounded-full">
                  {ticket.type === "CONTRACTUEL" ? "Contrat Entreprise" : "Particulier / Ponctuel"}
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-brand-green px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-brand-green/20">
                  <ShieldCheck className="w-3 h-3 text-brand-green" />
                  <span>Accès Validé</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-blue tracking-tight">
                {ticket.numero}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Propriétaire : <strong>{ticket.clientNom}</strong> {ticket.clientTelephoneMasque && `(${ticket.clientTelephoneMasque})`}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-500 space-y-1">
              <div className="flex sm:justify-end items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                <span>
                  Déposé le {format(new Date(ticket.dateCreation), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="font-semibold text-brand-dark">
                Matériel : {ticket.typeMateriel.replace(/_/g, " ")}
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
          <div className="p-6 rounded-2xl bg-brand-blue-light/50 border border-brand-blue/20 space-y-2">
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

          {/* Diagnostics & Panne Déclarée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-brand-slate border border-gray-100 text-xs space-y-2">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
                Problème signalé lors du dépôt :
              </span>
              <p className="text-gray-800 font-medium leading-relaxed italic">
                &ldquo;{ticket.panneDeclaree}&rdquo;
              </p>
            </div>

            {ticket.diagnosticTechnicien && (
              <div className="p-5 rounded-2xl bg-brand-slate border border-gray-100 text-xs space-y-2">
                <span className="font-bold text-brand-blue uppercase tracking-wider text-[10px] block">
                  Diagnostic technique de l&apos;atelier :
                </span>
                <p className="text-gray-800 font-medium leading-relaxed">
                  {ticket.diagnosticTechnicien}
                </p>
              </div>
            )}
          </div>

          {/* Photos de l'appareil (si présentes) */}
          {ticket.photos && ticket.photos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                <ImageIcon className="w-4 h-4 text-brand-blue" />
                <span>Photos de l&apos;appareil en atelier ({ticket.photos.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ticket.photos.map((ph) => (
                  <a
                    key={ph.id}
                    href={ph.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md transition-all block"
                  >
                    <img
                      src={ph.url}
                      alt={`Photo matériel ${ticket.numero}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      Agrandir
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* SECTION D'ACCORD SUR LE DEVIS (Si DEVIS_ENVOYE) */}
          {ticket.statut === "DEVIS_ENVOYE" && ticket.devis && (
            <div className="p-6 sm:p-8 rounded-3xl bg-brand-blue-light/40 border border-brand-blue/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-blue/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue bg-brand-blue-light px-2.5 py-0.5 rounded-full">
                      Décision Requise
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark mt-1">
                      Devis Estimatif : {ticket.devis.numero}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Prenez connaissance des pièces et du coût ci-dessous, puis validez pour autoriser la réparation.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Devis</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-blue">
                    {formatFCFA(ticket.devis.montant)}
                  </span>
                </div>
              </div>

              {/* Détail des pièces et prestations */}
              {ticket.pieces && ticket.pieces.length > 0 && (
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Détail des pièces & réparations prévues :
                  </span>
                  <div className="divide-y divide-gray-100 text-xs">
                    {ticket.pieces.map((p, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
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

              {/* Boutons d'action client en direct */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-brand-blue" />
                  <span>Imprimer le devis</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleClientAction("refuse_devis")}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Refuser le devis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClientAction("accept_devis")}
                    disabled={actionLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Valider & Accepter le devis</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contact & Assistance */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              <span>Une question sur votre réparation ou besoin d&apos;aide ?</span>
            </div>
            <a
              href="tel:+2290190881314"
              className="inline-flex items-center gap-2 text-brand-blue font-bold hover:underline"
            >
              <Phone className="w-3.5 h-3.5 text-brand-blue" />
              <span>Atelier RyHaD : +229 01 90 88 13 14</span>
            </a>
          </div>
        </div>
      )}

      {/* Modale d'impression officielle client */}
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
