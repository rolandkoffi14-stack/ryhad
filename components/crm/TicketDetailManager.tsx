"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { getStatutsAutorises, getCrmStatusLabel, getCrmActionLabel } from "@/lib/interventions/statut-transitions";
import { formatFCFA, formatNumber } from "@/lib/format";
import {
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Plus,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Save,
  Receipt,
  Download,
  Lock,
  CreditCard,
  Ban,
  Send,
  Check,
  XCircle,
  PackageCheck,
  Trash2,
  Sparkles,
  Layers,
  Cpu,
  MessageCircle,
  Printer,
  Phone,
} from "lucide-react";
import { InterventionStatut, InterventionType, DocumentType, FactureType, StaffRole } from "@prisma/client";
import { PaymentConfirmationModal } from "@/components/crm/PaymentConfirmationModal";
import { ConfirmationModal } from "@/components/crm/ConfirmationModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PieceItem {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

interface DocItem {
  id: string;
  numero: string;
  type: DocumentType;
  typeFacture?: FactureType | null;
  montant: number;
  statutPaiement: string;
  dateEmission: string;
}

interface HistoryItem {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
  auteur: { firstName: string; lastName: string } | null;
}

interface TicketDetail {
  id: string;
  numero: string;
  type: InterventionType;
  typeMateriel: string;
  panneDeclaree: string;
  modeIntervention: string;
  statut: InterventionStatut;
  montantDiagnostic: number | null;
  montantMainOeuvre: number | null;
  libelleMainOeuvre: string | null;
  diagnosticTechnicien: string | null;
  dateCreation: string;
  dateProgrammee?: string | null;
  checklistPrevue?: string | null;
  dateCloture: string | null;
  client: {
    id: string;
    nom: string;
    telephone: string;
    email: string | null;
    adresse: string | null;
  };
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
  piecesUtilisees: PieceItem[];
  documents: DocItem[];
  historique: HistoryItem[];
}

interface Props {
  ticket: TicketDetail;
  technicians: { id: string; firstName: string; lastName: string }[];
  userRole: StaffRole;
  currentUserId?: string;
}

export function TicketDetailManager({ ticket, technicians, userRole, currentUserId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAssignedTech =
    ticket.technicienAssigne?.id === currentUserId ||
    (ticket as any).technicienAssigneId === currentUserId;
  const canStartContractuel =
    userRole === StaffRole.ADMIN || (userRole === StaffRole.TECHNICIEN && isAssignedTech);

  // States
  const [diagnostic, setDiagnostic] = useState(ticket.diagnosticTechnicien || "");
  const [techId, setTechId] = useState(ticket.technicienAssigne?.id || "");
  
  // Main d'œuvre obligatoire
  const [montantMO, setMontantMO] = useState<number | string>(
    ticket.montantMainOeuvre !== null && ticket.montantMainOeuvre !== undefined
      ? ticket.montantMainOeuvre
      : ""
  );
  const [libelleMO, setLibelleMO] = useState(
    ticket.libelleMainOeuvre || "Main d'œuvre de réparation & tests"
  );

  // Pièces facultatives
  const [newPiece, setNewPiece] = useState({ designation: "", quantite: 1, prixUnitaire: 0 });

  // Identification des documents liés
  const diagDoc = ticket.documents.find(
    (d) =>
      (d.type === DocumentType.FACTURE && d.typeFacture === FactureType.DIAGNOSTIC) ||
      d.type === DocumentType.RECU_DIAGNOSTIC
  );
  const isDiagPaid = diagDoc?.statutPaiement === "PAYE" || ticket.type === InterventionType.CONTRACTUEL;

  const devisDoc = ticket.documents.find((d) => d.type === DocumentType.DEVIS);
  const repDoc = ticket.documents.find(
    (d) => d.type === DocumentType.FACTURE && d.typeFacture === FactureType.REPARATION
  );
  // La réparation est payée s'il n'y a pas de facture de réparation émise ou si celle-ci porte le statut PAYE
  const isRepPaid = !repDoc || repDoc.statutPaiement === "PAYE";

  const diagAmountFormatted = formatFCFA(diagDoc?.montant || ticket.montantDiagnostic || 1000);

  // Indicateur : Le ticket a-t-il été démarré ?
  const isTicketStarted =
    ticket.statut !== InterventionStatut.NOUVEAU &&
    ticket.statut !== InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE;

  // Verrouillage absolu de la saisie technique :
  // Accessible UNIQUEMENT si le ticket est démarré, et uniquement en phase active (ou admin après démarrage)
  const isDiagnosticEditable =
    isTicketStarted &&
    (ticket.statut === InterventionStatut.EN_DIAGNOSTIC ||
      (ticket.type === InterventionType.CONTRACTUEL &&
        ticket.statut === InterventionStatut.EN_INTERVENTION) ||
      userRole === StaffRole.ADMIN) &&
    userRole !== StaffRole.RECEPTIONNISTE;

  // Calcul des montants
  const currentMO = parseInt(String(montantMO), 10) || 0;
  const sumPieces = ticket.piecesUtilisees.reduce((acc, p) => acc + p.quantite * p.prixUnitaire, 0);
  const totalDevisCalculated = currentMO + sumPieces;

  // Statuts autorisés selon le workflow strict
  const allNextStatuts = getStatutsAutorises(ticket.type, ticket.statut, {
    hasPieces: ticket.piecesUtilisees.length > 0,
    hasMainOeuvre: (ticket.montantMainOeuvre || 0) > 0 || parseInt(String(montantMO), 10) > 0,
  });

  const technicianAllowedStatuts: InterventionStatut[] = [
    InterventionStatut.EN_DIAGNOSTIC,
    InterventionStatut.DIAGNOSTIC_TERMINE,
    InterventionStatut.EN_REPARATION,
    InterventionStatut.EN_INTERVENTION,
    InterventionStatut.TERMINE,
  ];

  const receptionAllowedStatuts: InterventionStatut[] = [
    InterventionStatut.DEVIS_ENVOYE,
    InterventionStatut.DEVIS_ACCEPTE,
    InterventionStatut.DEVIS_REFUSE,
    InterventionStatut.LIVRE_CLOTURE,
    InterventionStatut.CLOTURE,
  ];

  // Filtrer les statuts pour n'afficher QUE les actions réelles exécutables maintenant
  const nextStatuts = Array.from(
    new Set(
      allNextStatuts.filter((st) => {
        // Bloquer si le prérequis financier n'est pas rempli (aucun bouton fantôme)
        if (st === InterventionStatut.EN_DIAGNOSTIC && ticket.type === InterventionType.PONCTUEL && !isDiagPaid) {
          return false;
        }
        if (st === InterventionStatut.EN_REPARATION && !isRepPaid) {
          return false;
        }

        // Règle de verrouillage contractuel : seul le technicien assigné ou l'admin peut démarrer, et uniquement si la date est arrivée
        if (st === InterventionStatut.EN_INTERVENTION && ticket.type === InterventionType.CONTRACTUEL) {
          if (!canStartContractuel) {
            return false;
          }

          if (ticket.dateProgrammee) {
            const targetDay = new Date(ticket.dateProgrammee);
            targetDay.setHours(0, 0, 0, 0);
            const currentDay = new Date();
            currentDay.setHours(0, 0, 0, 0);

            if (currentDay < targetDay) {
              return false;
            }
          }
        }

        if (userRole === StaffRole.ADMIN) return true;
        if (userRole === StaffRole.TECHNICIEN) return technicianAllowedStatuts.includes(st);
        if (userRole === StaffRole.RECEPTIONNISTE) return receptionAllowedStatuts.includes(st);
        return false;
      })
    )
  );

  const getNextActionWaitingMessage = () => {
    if (ticket.statut === InterventionStatut.LIVRE_CLOTURE || ticket.statut === InterventionStatut.CLOTURE) {
      return "Dossier clôturé et archivé";
    }
    if (ticket.statut === InterventionStatut.NOUVEAU && !isDiagPaid) {
      return userRole === StaffRole.TECHNICIEN
        ? "Action suivante réservée à la réception : Encaissement des frais de diagnostic"
        : "Action requise : Encaisser les frais de diagnostic pour lancer l'intervention";
    }
    if (
      ticket.statut === InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE ||
      (ticket.statut === InterventionStatut.NOUVEAU && isDiagPaid && ticket.type === InterventionType.PONCTUEL)
    ) {
      return userRole === StaffRole.TECHNICIEN
        ? "Frais de diagnostic réglés : Cliquez sur 'Démarrer Diagnostic' pour débuter"
        : "Frais de diagnostic réglés : En attente du démarrage du diagnostic par le technicien";
    }
    if (ticket.statut === InterventionStatut.NOUVEAU && ticket.type === InterventionType.CONTRACTUEL) {
      if (ticket.dateProgrammee) {
        const targetDay = new Date(ticket.dateProgrammee);
        targetDay.setHours(0, 0, 0, 0);
        const currentDay = new Date();
        currentDay.setHours(0, 0, 0, 0);

        if (currentDay < targetDay) {
          return `🔒 Intervention programmée pour le ${format(targetDay, "dd MMMM yyyy", {
            locale: fr,
          })} : Démarrage verrouillé jusqu'au jour prévu`;
        }
      }
      if (userRole === StaffRole.RECEPTIONNISTE) {
        return "Intervention contractuelle : Démarrage réservé au technicien assigné ou à l'administrateur.";
      }
      if (userRole === StaffRole.TECHNICIEN && !isAssignedTech) {
        return "Intervention contractuelle : Assignée à un autre technicien.";
      }
      return userRole === StaffRole.TECHNICIEN || userRole === StaffRole.ADMIN
        ? "Action requise : Cliquez sur 'Démarrer Intervention' pour commencer"
        : "En attente de prise en charge par le technicien";
    }
    if (ticket.statut === InterventionStatut.EN_DIAGNOSTIC) {
      return userRole === StaffRole.RECEPTIONNISTE
        ? "Action suivante réservée au technicien : Diagnostic technique & chiffrage du devis"
        : totalDevisCalculated > 0
        ? "Rapport prêt : Cliquez sur 'Émettre le Devis' pour soumettre votre chiffrage"
        : "Diagnostic en cours : Chiffrez la main d'œuvre/pièces ou terminez sans réparation";
    }
    if (ticket.statut === InterventionStatut.EN_INTERVENTION) {
      return userRole === StaffRole.RECEPTIONNISTE
        ? "Action suivante réservée au technicien : Intervention technique sur site / atelier"
        : "Intervention en cours : Rédigez votre rapport et terminez une fois les tests validés";
    }
    if (ticket.statut === InterventionStatut.DIAGNOSTIC_TERMINE) {
      return userRole === StaffRole.TECHNICIEN
        ? "Action suivante réservée à la réception : Envoi du devis au client"
        : "Action requise : Transmettre le devis au client puis marquer 'Envoyer Devis'";
    }
    if (ticket.statut === InterventionStatut.DEVIS_ENVOYE) {
      return userRole === StaffRole.TECHNICIEN
        ? "Action suivante réservée au client / à la réception : Accord sur le devis"
        : "En attente de l'accord du client sur le devis";
    }
    if (ticket.statut === InterventionStatut.DEVIS_ACCEPTE) {
      if (!isRepPaid) {
        return userRole === StaffRole.TECHNICIEN
          ? `Action suivante réservée à la réception : Encaissement de la facture (${repDoc ? formatFCFA(repDoc.montant) : ""})`
          : `Action requise : Encaisser la facture (${repDoc ? formatFCFA(repDoc.montant) : ""}) pour autoriser les travaux`;
      }
      return userRole === StaffRole.TECHNICIEN
        ? "Facture réglée : Cliquez sur 'Démarrer Réparation' pour débuter les travaux"
        : "Facture réglée : En attente du démarrage effectif des travaux par le technicien";
    }
    if (ticket.statut === InterventionStatut.EN_REPARATION) {
      return userRole === StaffRole.RECEPTIONNISTE
        ? "Action suivante réservée au technicien : Réalisation des réparations et tests"
        : "Réparation en cours : Cliquez sur 'Terminer Réparation' une fois les tests OK";
    }
    if (ticket.statut === InterventionStatut.TERMINE) {
      return userRole === StaffRole.TECHNICIEN
        ? "Action suivante réservée à la réception : Clôture du dossier"
        : "Matériel prêt : Clôturer le dossier";
    }
    return "Aucune transition immédiate disponible";
  };

  const handleSaveMainOeuvre = async (overrideAmount?: number, overrideLibelle?: string) => {
    const amountToSave = overrideAmount !== undefined ? overrideAmount : parseInt(String(montantMO), 10);
    const libelleToSave = overrideLibelle !== undefined ? overrideLibelle : libelleMO;

    if (isNaN(amountToSave) || amountToSave < 0) {
      setError("Le montant de la main d'œuvre doit être un nombre valide (>= 0).");
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "update_main_oeuvre",
          montantMainOeuvre: amountToSave,
          libelleMainOeuvre: libelleToSave,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setSuccessMsg("Main d'œuvre enregistrée avec succès.");
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const [isConfirmZeroMOOpen, setIsConfirmZeroMOOpen] = useState(false);

  const proceedUpdateStatus = async (targetStatut: InterventionStatut) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "update_status",
          newStatut: targetStatut,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setSuccessMsg(`Statut mis à jour : ${getCrmStatusLabel(targetStatut)}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (targetStatut: InterventionStatut) => {
    // Vérification stricte lors du passage à DIAGNOSTIC_TERMINE
    if (targetStatut === InterventionStatut.DIAGNOSTIC_TERMINE) {
      if (ticket.type === InterventionType.PONCTUEL) {
        const parsedMO = parseInt(String(montantMO), 10) || 0;
        const sumPieces = ticket.piecesUtilisees.reduce((acc, p) => acc + p.quantite * p.prixUnitaire, 0);
        const totalDevis = parsedMO + sumPieces;

        if (totalDevis <= 0) {
          setError("Impossible d'émettre le devis : veuillez chiffrer la main d'œuvre ou ajouter au moins un accessoire/pièce.");
          return;
        }

        // Si MO = 0 et pièces > 0 : Avertissement de confirmation anti-oubli via modale
        if (parsedMO === 0 && sumPieces > 0) {
          setIsConfirmZeroMOOpen(true);
          return;
        }

        // Sauvegarder d'abord la MO si elle a été modifiée
        if (parsedMO !== ticket.montantMainOeuvre || libelleMO !== ticket.libelleMainOeuvre) {
          const saved = await handleSaveMainOeuvre(parsedMO, libelleMO);
          if (!saved) return;
        }
      } else {
        // En parcours contractuel, le devis ne concerne que les pièces
        if (ticket.piecesUtilisees.length === 0) {
          setError("Pour générer un devis sous contrat, veuillez ajouter au moins une pièce détachée à facturer.");
          return;
        }
      }
    }

    await proceedUpdateStatus(targetStatut);
  };

  // État de la modale de paiement
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    type: "DIAGNOSTIC" | "REPARATION";
    montant: number;
    titre: string;
    description: string;
  }>({
    isOpen: false,
    type: "DIAGNOSTIC",
    montant: 0,
    titre: "",
    description: "",
  });

  const handleConfirmPayment = async (modePaiement: string, referencePaiement?: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const actionType =
        paymentModalState.type === "DIAGNOSTIC" ? "encaisser_diagnostic" : "encaisser_reparation";

      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          modePaiement,
          referencePaiement,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur lors de l'encaissement.");

      setSuccessMsg(
        paymentModalState.type === "DIAGNOSTIC"
          ? `Frais de diagnostic (${diagAmountFormatted}) encaissés via ${modePaiement.replace(/_/g, " ")}. Le technicien peut démarrer.`
          : `Facture encaissée avec succès via ${modePaiement.replace(/_/g, " ")}. Le technicien peut démarrer la réparation.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiagnostic = async () => {
    if (!isDiagnosticEditable) {
      setError("La modification du diagnostic n'est autorisée qu'en phase de diagnostic actif.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "update_diagnostic",
          diagnosticTechnicien: diagnostic,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setSuccessMsg("Diagnostic technique enregistré.");
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (newTechId: string) => {
    if (userRole === StaffRole.TECHNICIEN) return;
    setLoading(true);
    setError(null);
    setTechId(newTechId);
    try {
      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "reassign_technician",
          technicienId: newTechId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setSuccessMsg("Assignation du technicien mise à jour.");
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDiagnosticEditable) {
      setError("L'ajout de pièces est réservé à la phase de diagnostic actif.");
      return;
    }
    if (!newPiece.designation.trim()) return;
    if (newPiece.prixUnitaire < 0) {
      setError("Le prix unitaire ne peut pas être négatif.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "add_piece",
          newPiece,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setNewPiece({ designation: "", quantite: 1, prixUnitaire: 0 });
      setSuccessMsg("Pièce ajoutée au devis.");
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePiece = async (pieceId: string) => {
    if (!isDiagnosticEditable) {
      setError("La suppression de ligne n'est autorisée qu'en phase de diagnostic actif.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "delete_piece",
          pieceId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setSuccessMsg("Pièce retirée du devis.");
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-brand-green/30 text-brand-green-dark text-xs flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* BANNIÈRES CONTEXTUELLES DU CYCLE (Informatif) */}

      {/* 1. Nouveau ticket ponctuel : En attente paiement diagnostic */}
      {ticket.type === InterventionType.PONCTUEL &&
        ticket.statut === InterventionStatut.NOUVEAU &&
        !isDiagPaid && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                Étape 1 : Frais de diagnostic initial ({diagAmountFormatted}) — En attente d&apos;encaissement
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                {userRole === StaffRole.TECHNICIEN
                  ? `Le diagnostic technique débutera dès l'encaissement des ${diagAmountFormatted} par la réception.`
                  : `Encaissez les ${diagAmountFormatted} pour ouvrir l'accès au diagnostic technique.`}
              </p>
            </div>
          </div>
        )}

      {/* 1b. Frais Diagnostic encaissés : En attente démarrage technicien */}
      {ticket.type === InterventionType.PONCTUEL &&
        (ticket.statut === InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE ||
          (ticket.statut === InterventionStatut.NOUVEAU && isDiagPaid)) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                Étape 2 : Frais de diagnostic réglés ({diagAmountFormatted}) — Prêt pour analyse
              </h3>
              <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">
                {userRole === StaffRole.TECHNICIEN
                  ? "Les frais ont été encaissés. Cliquez sur 'Démarrer Diagnostic' lorsque vous prenez le matériel en charge."
                  : "Frais encaissés. En attente du démarrage de l'expertise technique par le technicien."}
              </p>
              {diagDoc && (
                <div className="mt-2.5">
                  <a
                    href={`/api/documents/${diagDoc.numero}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shadow-xs transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Imprimer Reçu de Dépôt PDF ({diagDoc.numero})</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

      {/* 2. Diag. Terminé : Devis généré prêt pour envoi */}
      {ticket.statut === InterventionStatut.DIAGNOSTIC_TERMINE && devisDoc && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
              Étape 3 : Devis {devisDoc.numero} ({formatFCFA(devisDoc.montant)}) prêt pour envoi
            </h3>
            <p className="text-[11px] text-blue-800 mt-0.5 font-medium">
              {userRole === StaffRole.TECHNICIEN
                ? "Rapport technique et devis scellés. La réception va le transmettre au client pour validation."
                : "Transmettez le devis au client (WhatsApp, email, appel) puis cliquez sur 'Envoyer Devis'."}
            </p>
          </div>
        </div>
      )}

      {/* 3. Devis Envoyé : En attente réponse client */}
      {ticket.statut === InterventionStatut.DEVIS_ENVOYE && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
              Étape 4 : Devis transmis au client — En attente de décision
            </h3>
            <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
              Enregistrez la décision du client dans la barre d&apos;action dès réception de sa confirmation.
            </p>
          </div>
        </div>
      )}

      {/* 4. Devis Accepté : Facture de réparation en attente d'encaissement */}
      {ticket.statut === InterventionStatut.DEVIS_ACCEPTE && repDoc && !isRepPaid && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
              Étape 5 : Devis accepté — Facture {repDoc.numero} ({formatFCFA(repDoc.montant)}) à encaisser
            </h3>
            <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">
              {userRole === StaffRole.TECHNICIEN
                ? "La réparation pourra débuter dès confirmation de l'encaissement de la facture par la réception."
                : "Encaissez le règlement pour débloquer le démarrage des travaux par le technicien."}
            </p>
          </div>
        </div>
      )}

      {/* 5. Terminé : Prêt à être livré */}
      {ticket.statut === InterventionStatut.TERMINE && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
              Étape Finale : Travaux validés & Matériel prêt
            </h3>
            <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">
              Le matériel est prêt pour remise au client. Clôturez le dossier lors de la restitution.
            </p>
          </div>
        </div>
      )}

      {/* Header Fiche Ticket */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 subtle-shadow space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  ticket.type === "CONTRACTUEL"
                    ? "bg-brand-green-light text-brand-green-dark"
                    : "bg-brand-blue-light text-brand-blue"
                }`}
              >
                Parcours {ticket.type}
              </span>
              <TicketStatusBadge statut={ticket.statut} isPaid={isRepPaid} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              Fiche Dossier : {ticket.numero}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Enregistré le {format(new Date(ticket.dateCreation), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>

          {/* Action Bar unifiée des transitions directes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Action suivante :
            </span>

            {/* 1. Cas Spécial : Encaissement des frais de diagnostic (Nouveau ticket ponctuel) */}
            {ticket.statut === InterventionStatut.NOUVEAU && ticket.type === InterventionType.PONCTUEL && !isDiagPaid ? (
              userRole !== StaffRole.TECHNICIEN ? (
                <button
                  onClick={() =>
                    setPaymentModalState({
                      isOpen: true,
                      type: "DIAGNOSTIC",
                      montant: diagDoc?.montant || ticket.montantDiagnostic || 5000,
                      titre: "Encaissement Frais Diagnostic",
                      description: "Enregistrez le mode de règlement utilisé par le client pour les frais de diagnostic.",
                    })
                  }
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Encaisser Diagnostic ({diagAmountFormatted})</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Action suivante réservée à la réception : Encaissement des frais de diagnostic</span>
                </span>
              )
            ) : ticket.statut === InterventionStatut.DEVIS_ACCEPTE && repDoc && !isRepPaid ? (
              /* 2. Cas Spécial : Encaissement de la facture de réparation / pièces */
              userRole !== StaffRole.TECHNICIEN ? (
                <button
                  onClick={() =>
                    setPaymentModalState({
                      isOpen: true,
                      type: "REPARATION",
                      montant: repDoc.montant,
                      titre: `Encaissement Facture ${repDoc.numero}`,
                      description: "Enregistrez le mode de règlement de la facture de réparation validée par le client.",
                    })
                  }
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Encaisser Facture ({formatFCFA(repDoc.montant)})</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Action suivante réservée à la réception : Encaissement de la facture ({formatFCFA(repDoc.montant)})</span>
                </span>
              )
            ) : nextStatuts.length > 0 ? (
              /* 3. Cas Standard : Actions exécutables par le rôle actif */
              nextStatuts.map((st, idx) => (
                <button
                  key={`btn-next-status-${st}-${idx}`}
                  onClick={() => handleUpdateStatus(st)}
                  disabled={loading}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all ${
                    st === InterventionStatut.DEVIS_REFUSE
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-brand-blue hover:bg-brand-blue-dark text-white disabled:opacity-50"
                  }`}
                >
                  <span>{getCrmActionLabel(st, ticket.type, ticket.statut)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              ))
            ) : (
              /* 4. En attente d'un autre rôle ou dossier clôturé */
              <span className="text-xs font-bold text-slate-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{getNextActionWaitingMessage()}</span>
              </span>
            )}
          </div>
        </div>

        {/* Détails Client & Matériel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Client</span>
            <div className="font-extrabold text-brand-dark text-sm">{ticket.client.nom}</div>
            <div className="text-gray-600 font-medium">{ticket.client.telephone}</div>
            {ticket.client.adresse && <div className="text-gray-500">{ticket.client.adresse}</div>}

            {ticket.client.telephone && (() => {
              const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://ryhad.bj";
              let waText = `Bonjour ${ticket.client.nom},\n\n`;

              if (devisDoc && (ticket.statut === InterventionStatut.DIAGNOSTIC_TERMINE || ticket.statut === InterventionStatut.DEVIS_ENVOYE)) {
                waText += `Votre devis de réparation RyHaD Tic-Medic est disponible :\n📄 Devis N° : ${devisDoc.numero}\n💰 Montant estimé : ${formatFCFA(devisDoc.montant)}\n⚙️ Matériel : ${ticket.typeMateriel.replace(/_/g, " ")}\n\n👉 Télécharger votre devis PDF officiel :\n${appBaseUrl}/api/documents/${devisDoc.numero}/pdf\n\n🔍 Ou suivre votre dossier en direct :\n${appBaseUrl}/suivi/${ticket.numero}\n\nRyHaD Tic-Medic • Gbégamey, Cotonou`;
              } else if (repDoc && ticket.statut === InterventionStatut.DEVIS_ACCEPTE) {
                waText += `Votre facture de réparation N° ${repDoc.numero} (${formatFCFA(repDoc.montant)}) pour votre ${ticket.typeMateriel.replace(/_/g, " ")} chez RyHaD Tic-Medic est disponible.\n\n👉 Télécharger votre facture PDF :\n${appBaseUrl}/api/documents/${repDoc.numero}/pdf\n\n🔍 Suivre votre dossier en direct :\n${appBaseUrl}/suivi/${ticket.numero}`;
              } else if (ticket.statut === InterventionStatut.TERMINE) {
                waText += `Bonne nouvelle ! Votre ${ticket.typeMateriel.replace(/_/g, " ")} (Dossier ${ticket.numero}) est réparé et disponible à notre atelier de Gbégamey pour retrait.\n\n🔍 Suivre votre dossier :\n${appBaseUrl}/suivi/${ticket.numero}`;
              } else {
                waText += `Votre dossier (${ticket.numero}) pour votre ${ticket.typeMateriel.replace(/_/g, " ")} a bien été enregistré chez RyHaD Tic-Medic.\n\n🔍 Suivez l'avancement technique et vos documents en direct sur :\n${appBaseUrl}/suivi/${ticket.numero}`;
              }

              return (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <a
                    href={`https://wa.me/${ticket.client.telephone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Envoyer le récapitulatif avec lien PDF direct sur WhatsApp"
                    className="inline-flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] transition-all border border-[#25D366]/30 shadow-2xs"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp {devisDoc ? "Devis PDF" : "Suivi"}</span>
                  </a>
                  <a
                    href={`tel:${ticket.client.telephone}`}
                    title="Appeler le client"
                    className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all border border-gray-200"
                  >
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span>Appeler</span>
                  </a>
                </div>
              );
            })()}
          </div>

          <div className="space-y-1 p-4 rounded-xl bg-brand-slate/60 border border-gray-100">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">Appareil & Mode</span>
            <div className="font-extrabold text-brand-dark text-sm">{ticket.typeMateriel.replace(/_/g, " ")}</div>
            <div className="text-gray-600">Mode : {ticket.modeIntervention}</div>
            {ticket.montantDiagnostic && userRole !== StaffRole.TECHNICIEN && (
              <div className="text-brand-blue font-bold">
                Diag. initial : {formatFCFA(ticket.montantDiagnostic)}
              </div>
            )}
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-brand-slate/60 border border-gray-100">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">Technicien Assigné</span>
            {userRole !== StaffRole.TECHNICIEN ? (
              <select
                value={techId}
                onChange={(e) => handleReassign(e.target.value)}
                disabled={loading}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-blue outline-none bg-white"
              >
                <option value="">Non assigné</option>
                {technicians.map((t, idx) => (
                  <option key={`tech-option-${t.id}-${idx}`} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="font-bold text-brand-dark">
                {ticket.technicienAssigne
                  ? `${ticket.technicienAssigne.firstName} ${ticket.technicienAssigne.lastName}`
                  : "Non assigné"}
              </div>
            )}
            <p className="text-[10px] text-gray-400">
              {userRole !== StaffRole.TECHNICIEN
                ? "La réassignation est journalisée sans perte d'historique."
                : "Dossier sous votre responsabilité technique."}
            </p>
          </div>
        </div>

        {/* Panne déclarée au dépôt */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 text-xs space-y-1">
          <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px]">
            Panne signalée au dépôt :
          </span>
          <p className="text-amber-900 leading-relaxed font-medium">&ldquo;{ticket.panneDeclaree}&rdquo;</p>
        </div>
      </div>

      {/* Diagnostic Technicien & Chiffrage du Devis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne Gauche : Diagnostic Technique */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 subtle-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base font-bold text-brand-dark">Rapport de Diagnostic</h2>
            </div>
            {isDiagnosticEditable ? (
              <button
                onClick={handleSaveDiagnostic}
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-brand-green" />
                <span>Enregistrer note</span>
              </button>
            ) : (
              <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>{!isTicketStarted ? "Non démarré" : "Lecture seule"}</span>
              </span>
            )}
          </div>

          {!isTicketStarted && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Intervention non démarrée :</span> Démarrez d&apos;abord le ticket via la barre d&apos;actions ci-dessus pour pouvoir rédiger le rapport technique.
              </div>
            </div>
          )}

          {/* Formulaire de saisie pour technicien/admin ou affichage lecture seule */}
          {isDiagnosticEditable ? (
            <div className="space-y-3">
              <textarea
                rows={6}
                placeholder="Rapport de diagnostic technique"
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-blue outline-none leading-relaxed bg-brand-slate/30"
              />

            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 min-h-[140px] leading-relaxed">
              {ticket.diagnosticTechnicien ? (
                <p className="whitespace-pre-wrap">{ticket.diagnosticTechnicien}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {!isTicketStarted
                    ? "Dossier en attente de démarrage. Le rapport technique sera rédigé une fois le ticket démarré."
                    : "Aucun rapport technique rédigé pour le moment."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Colonne Droite : Chiffrage du Devis (Ponctuel : MO Obligatoire + Pièces | Contractuel : MO Incluse + Pièces) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 subtle-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-green" />
              <div>
                <h2 className="text-base font-bold text-brand-dark">
                  {ticket.type === InterventionType.CONTRACTUEL
                    ? "Fourniture & Pièces sous Contrat"
                    : "Chiffrage du Devis de Réparation"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {ticket.type === InterventionType.CONTRACTUEL
                    ? "Main d'œuvre & déplacements inclus au contrat • Devis uniquement si pièces requises"
                    : "Main d'œuvre obligatoire • Pièces détachées selon besoin"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Devis</span>
              <span className="text-base font-extrabold text-brand-blue">
                {formatFCFA(totalDevisCalculated)}
              </span>
            </div>
          </div>

          {!isTicketStarted && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Chiffrage verrouillé :</span> Le ticket n&apos;a pas encore été démarré. Démarrez d&apos;abord le diagnostic ou l&apos;intervention pour chiffrer la main d&apos;œuvre ou ajouter des pièces au devis.
              </div>
            </div>
          )}

          {/* 🛠️ BLOC 1 : MAIN D'ŒUVRE DE RÉPARATION */}
          {ticket.type === InterventionType.CONTRACTUEL ? (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">Main d&apos;œuvre Technique & Déplacements</div>
                  <div className="text-[11px] text-emerald-700">Couvert à 100% par le forfait du contrat de maintenance</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                0 FCFA (Inclus)
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-brand-blue" />
                  <span className="text-xs font-bold text-brand-dark">
                    1. Forfait Main d&apos;œuvre de Réparation <span className="text-red-500">*</span>
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    !isTicketStarted
                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : currentMO > 0
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-red-100 text-red-700 border border-red-300"
                  }`}
                >
                  {!isTicketStarted
                    ? "Dossier non démarré"
                    : currentMO > 0
                    ? "Main d'œuvre chiffrée"
                    : "Obligatoire pour devis"}
                </span>
              </div>

              {isDiagnosticEditable ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Libellé de la main d'œuvre"
                      value={libelleMO}
                      onChange={(e) => setLibelleMO(e.target.value)}
                      className="sm:col-span-8 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Montant"
                      min={0}
                      step={500}
                      value={montantMO}
                      onChange={(e) => setMontantMO(e.target.value)}
                      className="sm:col-span-4 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none bg-white text-right font-extrabold text-brand-blue"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveMainOeuvre()}
                      disabled={loading}
                      className="inline-flex items-center gap-1 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-brand-green" />
                      <span>Enregistrer la Main d&apos;œuvre</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 text-xs">
                  <span className="font-semibold text-brand-dark">{libelleMO}</span>
                  <span className="font-extrabold text-brand-blue">{formatFCFA(currentMO)}</span>
                </div>
              )}
            </div>
          )}

          {/* 📦 BLOC 2 : PIÈCES DÉTACHÉES (FACULTATIF) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-green" />
                <span className="text-xs font-bold text-brand-dark">
                  2. Pièces détachées & Composants <span className="text-gray-400 font-normal">(Facultatif)</span>
                </span>
              </div>
              <span className="text-xs font-bold text-gray-500">
                Sous-total pièces : {formatFCFA(sumPieces)}
              </span>
            </div>

            {/* Liste des pièces */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ticket.piecesUtilisees.map((p, idx) => {
                const lineTotal = p.quantite * p.prixUnitaire;
                return (
                  <div
                    key={`piece-item-${p.id || idx}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-brand-slate border border-gray-100 text-xs hover:border-gray-200 transition-all"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-brand-dark">{p.designation}</div>
                      <div className="text-gray-500 text-[11px]">
                        {p.quantite} x {formatFCFA(p.prixUnitaire)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-brand-dark text-xs">
                        {formatFCFA(lineTotal)}
                      </span>
                      {isDiagnosticEditable && (
                        <button
                          onClick={() => handleDeletePiece(p.id)}
                          disabled={loading}
                          title="Supprimer cette pièce"
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {ticket.piecesUtilisees.length === 0 && (
                <div className="text-xs text-gray-400 italic py-3 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Aucune pièce détachée ajoutée (intervention en main d&apos;œuvre pure).
                </div>
              )}
            </div>

            {/* Formulaire ajout pièce (TECHNICIEN & ADMIN en EN_DIAGNOSTIC) */}
            {isDiagnosticEditable && (
              <form onSubmit={handleAddPiece} className="pt-2 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Désignation"
                    value={newPiece.designation}
                    onChange={(e) => setNewPiece({ ...newPiece, designation: e.target.value })}
                    className="sm:col-span-6 p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Quantité"
                    min={1}
                    value={newPiece.quantite}
                    onChange={(e) =>
                      setNewPiece({ ...newPiece, quantite: parseInt(e.target.value, 10) || 1 })
                    }
                    className="sm:col-span-2 p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none text-center"
                  />
                  <input
                    type="number"
                    placeholder="Prix unitaire"
                    min={0}
                    step={500}
                    value={newPiece.prixUnitaire || ""}
                    onChange={(e) =>
                      setNewPiece({ ...newPiece, prixUnitaire: parseInt(e.target.value, 10) || 0 })
                    }
                    className="sm:col-span-4 p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none text-right font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPiece.designation.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-slate hover:bg-gray-200 text-brand-dark font-bold py-2 rounded-xl text-xs border border-gray-200 shadow-2xs transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-brand-green" />
                  <span>+ Ajouter une pièce au devis</span>
                </button>
              </form>
            )}
          </div>

          {/* RÉCAPITULATIF CHIFFRÉ */}
          <div className="p-3.5 rounded-xl bg-brand-slate/80 border border-gray-200 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Main d&apos;œuvre :</span>
              <span className="font-bold text-brand-dark">{formatFCFA(currentMO)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pièces détachées :</span>
              <span className="font-bold text-brand-dark">{formatFCFA(sumPieces)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-brand-blue pt-1.5 border-t border-gray-200">
              <span>Total Devis TTC :</span>
              <span>{formatFCFA(totalDevisCalculated)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Financiers & Timeline d'Historique */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Documents Financiers (visible Direction / Réception) */}
        {userRole !== StaffRole.TECHNICIEN && (
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 subtle-shadow space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Receipt className="w-5 h-5 text-brand-green" />
              <h2 className="text-base font-bold text-brand-dark">Documents Financiers Émis</h2>
            </div>

            <div className="space-y-2.5">
              {ticket.documents.map((doc, idx) => {
                const isDevis = doc.type === DocumentType.DEVIS;
                let label = isDevis ? "Devis Estimatif" : "Facture";
                if (doc.typeFacture === FactureType.DIAGNOSTIC || doc.type === DocumentType.RECU_DIAGNOSTIC) {
                  label = "Facture Diagnostic";
                } else if (doc.typeFacture === FactureType.REPARATION) {
                  label = "Facture Réparation";
                } else if (doc.typeFacture === FactureType.CONTRAT) {
                  label = "Facture Contrat";
                } else if (doc.typeFacture === FactureType.COMMERCIALE) {
                  label = "Facture Commerciale";
                }

                // Détermination du statut réel et lisible selon le type de document
                let badgeLabel = "EN ATTENTE";
                let badgeClass = "bg-amber-100 text-amber-800 border-amber-300 font-extrabold";

                if (isDevis) {
                  if (doc.statutPaiement === "REFUSE" || ticket.statut === InterventionStatut.DEVIS_REFUSE) {
                    badgeLabel = "REFUSÉ";
                    badgeClass = "bg-red-100 text-red-800 border-red-300 font-extrabold";
                  } else if (
                    doc.statutPaiement === "PAYE" ||
                    ([
                      InterventionStatut.DEVIS_ACCEPTE,
                      InterventionStatut.EN_REPARATION,
                      InterventionStatut.TERMINE,
                    ] as InterventionStatut[]).includes(ticket.statut)
                  ) {
                    badgeLabel = "ACCEPTÉ";
                    badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
                  } else {
                    badgeLabel = "EN ATTENTE";
                    badgeClass = "bg-amber-100 text-amber-800 border-amber-300 font-extrabold";
                  }
                } else {
                  // Factures
                  if (doc.statutPaiement === "PAYE") {
                    badgeLabel = "PAYÉE";
                    badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
                  } else if (doc.statutPaiement === "PARTIEL") {
                    badgeLabel = "PARTIEL";
                    badgeClass = "bg-amber-100 text-amber-800 border-amber-300 font-extrabold";
                  } else {
                    badgeLabel = "EN ATTENTE";
                    badgeClass = "bg-amber-100 text-amber-800 border-amber-300 font-extrabold";
                  }
                }

                return (
                  <div
                    key={`doc-item-${doc.id || doc.numero}-${idx}`}
                    className="p-3.5 rounded-xl bg-brand-slate border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-brand-blue text-xs flex items-center gap-1.5">
                        <span>{doc.numero}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border inline-block mt-1 ${
                          isDevis
                            ? "bg-blue-100 text-brand-blue border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-extrabold text-brand-dark text-xs">
                        {formatFCFA(doc.montant)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded border ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                        {ticket.client.telephone && (
                          <a
                            href={`https://wa.me/${ticket.client.telephone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Bonjour ${ticket.client.nom},\n\nVoici votre ${label} RyHaD Tic-Medic :\n📄 Réf : ${doc.numero}\n💰 Montant : ${formatFCFA(doc.montant)}\n\n👉 Télécharger votre document PDF :\n${typeof window !== "undefined" ? window.location.origin : "https://ryhad.bj"}/api/documents/${doc.numero}/pdf\n\n🔍 Suivi de votre dossier : ${typeof window !== "undefined" ? window.location.origin : "https://ryhad.bj"}/suivi/${ticket.numero}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Partager ce document sur WhatsApp"
                            className="p-1 rounded bg-white hover:bg-[#25D366] hover:text-white text-[#128C7E] border border-gray-200 transition-all inline-flex items-center shadow-xs"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        )}
                        <a
                          href={`/api/documents/${doc.numero}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Télécharger le PDF officiel"
                          className="p-1 rounded bg-white hover:bg-brand-blue hover:text-white text-brand-blue border border-gray-200 transition-all inline-flex items-center shadow-xs"
                        >
                          <Download className="w-3 h-3 text-brand-green" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {ticket.documents.length === 0 && (
                <div className="text-xs text-gray-400 italic py-4 text-center">
                  Aucun devis ou facture émis pour le moment.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historique chronologique (Audit Trail) */}
        <div
          className={`${
            userRole === StaffRole.TECHNICIEN ? "lg:col-span-12" : "lg:col-span-7"
          } bg-white rounded-2xl p-6 border border-gray-200 subtle-shadow space-y-4`}
        >
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-brand-blue" />
            <h2 className="text-base font-bold text-brand-dark">Journal d&apos;Audit & Historique</h2>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {ticket.historique.map((h, idx) => (
              <div
                key={`hist-item-${h.id || idx}-${idx}`}
                className="flex items-start gap-3 text-xs border-l-2 border-brand-green pl-3 py-1"
              >
                <div className="flex-1">
                  <span className="font-bold text-brand-dark block">{h.action}</span>
                  {h.note && <p className="text-gray-600 text-[11px] mt-0.5">{h.note}</p>}
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {format(new Date(h.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                    {h.auteur && ` • par ${h.auteur.firstName} ${h.auteur.lastName}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modale d'encaissement avec mode de paiement */}
      <PaymentConfirmationModal
        isOpen={paymentModalState.isOpen}
        onClose={() =>
          setPaymentModalState({
            isOpen: false,
            type: "DIAGNOSTIC",
            montant: 0,
            titre: "",
            description: "",
          })
        }
        onConfirm={handleConfirmPayment}
        montant={paymentModalState.montant}
        titre={paymentModalState.titre}
        description={paymentModalState.description}
        loading={loading}
      />

      {/* Modale de confirmation de devis sans main d'œuvre */}
      <ConfirmationModal
        isOpen={isConfirmZeroMOOpen}
        onClose={() => setIsConfirmZeroMOOpen(false)}
        onConfirm={async () => {
          setIsConfirmZeroMOOpen(false);
          const parsedMO = parseInt(String(montantMO), 10) || 0;
          if (parsedMO !== ticket.montantMainOeuvre || libelleMO !== ticket.libelleMainOeuvre) {
            const saved = await handleSaveMainOeuvre(parsedMO, libelleMO);
            if (!saved) return;
          }
          await proceedUpdateStatus(InterventionStatut.DIAGNOSTIC_TERMINE);
        }}
        title="Confirmation de devis sans main d'œuvre"
        message={
          <div>
            <p className="mb-2">
              Vous avez renseigné <strong>0 FCFA</strong> de main d&apos;œuvre pour ces pièces ou accessoires.
            </p>
            <p className="text-gray-500">
              S&apos;agit-il d&apos;un simple accessoire ou pièce sans prestation de démontage/réparation en atelier (ex : chargeur, batterie externe) ?
            </p>
          </div>
        }
        confirmLabel="Confirmer et émettre le devis"
        variant="warning"
        loading={loading}
      />
    </div>
  );
}
