"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Lock,
  Play,
  FileText,
  Receipt,
  Download,
  Plus,
  Wrench,
  Search,
  Sparkles,
  ShieldCheck,
  User,
  SlidersHorizontal,
  X,
  CreditCard,
} from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { format, isToday, isBefore, isAfter, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { PaymentConfirmationModal } from "@/components/crm/PaymentConfirmationModal";
import { StaffRole } from "@prisma/client";

interface ContractEnterprise {
  id: string;
  clientId: string;
  dateDebut: string;
  dateFin: string | null;
  periodicite: string;
  frequenceVisites: number;
  jourPassage: string | null;
  termeFacturation: string;
  montantMainOeuvre: number;
  equipementsCouverts: string;
  statut: string;
  client: {
    id: string;
    nom: string;
    contactNom: string | null;
    telephone: string;
    email: string | null;
    adresse: string | null;
  };
  interventions: {
    id: string;
    numero: string;
    type: string;
    panneDeclaree: string;
    statut: string;
    dateCreation: string;
    dateProgrammee: string | null;
    checklistPrevue: string | null;
    technicienAssigneId: string | null;
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
  }[];
  facturesPeriodiques: {
    id: string;
    numero: string;
    type: string;
    typeFacture: string | null;
    montant: number;
    statutPaiement: string;
    modePaiement: string | null;
    dateEmission: string;
  }[];
}

interface Props {
  contracts: ContractEnterprise[];
  technicians: { id: string; firstName: string; lastName: string }[];
  currentUser: { id: string; role: StaffRole; firstName?: string; lastName?: string };
  initialSelectedContractId?: string;
}

export function ContractEnterpriseView({
  contracts,
  technicians,
  currentUser,
  initialSelectedContractId,
}: Props) {
  const router = useRouter();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    initialSelectedContractId || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"PREVENTIF" | "PONCTUEL" | "FACTURES">("PREVENTIF");

  // Modal de génération automatique des tickets d'un contrat
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState({
    frequenceVisites: 2,
    jourPassage: "1er et 15 de chaque mois",
    termeFacturation: "ECHU",
    technicienAssigneId: technicians[0]?.id || "",
    checklistPrevue:
      "Dépoussiérage et soufflage complet, contrôle antivirus et mises à jour, vérification des sauvegardes, test des onduleurs et tensions électriques, vérification de l'intégrité du réseau local.",
    genererFactures: true,
  });

  // Modal d'encaissement de facture
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

  const isAdmin = currentUser.role === StaffRole.ADMIN;
  const isTechnician = currentUser.role === StaffRole.TECHNICIEN;

  // Filtrage des contrats selon la recherche
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clientNom = (c.client.nom || "").toLowerCase();
        const contact = (c.client.contactNom || "").toLowerCase();
        const tel = (c.client.telephone || "").toLowerCase();
        const equip = (c.equipementsCouverts || "").toLowerCase();

        if (
          !clientNom.includes(term) &&
          !contact.includes(term) &&
          !tel.includes(term) &&
          !equip.includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [contracts, searchTerm]);

  // Contrat actuellement sélectionné
  const selectedContract = useMemo(() => {
    if (!selectedContractId) return null;
    return contracts.find((c) => c.id === selectedContractId) || null;
  }, [contracts, selectedContractId]);

  // Répartition des interventions du contrat sélectionné
  const { preventifTickets, ponctuelTickets } = useMemo(() => {
    if (!selectedContract) return { preventifTickets: [], ponctuelTickets: [] };

    const preventif = selectedContract.interventions
      .filter((t) => t.dateProgrammee !== null)
      .sort((a, b) => new Date(a.dateProgrammee!).getTime() - new Date(b.dateProgrammee!).getTime());

    const ponctuel = selectedContract.interventions
      .filter((t) => t.dateProgrammee === null)
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

    return { preventifTickets: preventif, ponctuelTickets: ponctuel };
  }, [selectedContract]);

  // Lancement de la génération automatique
  const handleGenerateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    setGenerateLoading(true);
    setGenerateError(null);
    setGenerateSuccess(null);

    try {
      const res = await fetch(`/api/crm/contrats/${selectedContract.id}/generate-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generateForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la génération.");
      }

      setGenerateSuccess(data.message);
      setTimeout(() => {
        setShowGenerateModal(false);
        setGenerateSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setGenerateError(err.message);
    } finally {
      setGenerateLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // VUE 1 : RÉPERTOIRE DES ENTREPRISES SOUS CONTRAT (Aucun contrat sélectionné)
  // --------------------------------------------------------------------------
  if (!selectedContract) {
    return (
      <div className="space-y-6">
        {/* Header aéré */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              {isTechnician ? "Mes Entreprises sous Contrat" : "Contrats de Maintenance — Par Entreprise"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Suivi structuré par entreprise : interventions préventives, pannes ponctuelles et factures périodiques.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isAdmin && (
              <Link
                href="/crm/contrats"
                className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-brand-green" />
                <span>Nouveau Contrat Entreprise</span>
              </Link>
            )}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher une entreprise, contact, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-brand-blue"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            {filteredContracts.length} entreprise(s) sous contrat
          </span>
        </div>

        {/* Liste des cartes d'entreprises sous contrat */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-800">Aucune entreprise trouvée</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchTerm
                ? "Aucun contrat ne correspond à votre recherche."
                : "Aucun contrat de maintenance actif n'est enregistré actuellement."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredContracts.map((c) => {
              const totalTickets = c.interventions.length;
              const completedTickets = c.interventions.filter(
                (t) => t.statut === "TERMINE" || t.statut === "CLOTURE"
              ).length;
              const pendingInvoices = c.facturesPeriodiques.filter(
                (f) => f.statutPaiement === "EN_ATTENTE"
              ).length;

              // Trouver la prochaine intervention programmée
              const today = startOfDay(new Date());
              const upcomingVisits = c.interventions
                .filter(
                  (t) =>
                    t.dateProgrammee &&
                    (t.statut === "NOUVEAU" || t.statut === "EN_INTERVENTION")
                )
                .sort(
                  (a, b) =>
                    new Date(a.dateProgrammee!).getTime() -
                    new Date(b.dateProgrammee!).getTime()
                );

              const nextVisit = upcomingVisits[0];

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-blue/30 transition-all p-6 flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-4">
                    {/* Header de la carte */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-extrabold text-lg shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-blue transition-colors">
                            {c.client.nom}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {c.client.contactNom || "Direction"}
                            </span>
                            <span>•</span>
                            <span>{c.client.telephone}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-brand-green border border-emerald-200">
                        {c.periodicite}
                      </span>
                    </div>

                    {/* Équipements couverts */}
                    <div className="p-3 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-600">
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">
                        Périmètre couvert :
                      </span>
                      <p className="line-clamp-1 mt-0.5">{c.equipementsCouverts}</p>
                    </div>

                    {/* Statistiques clés & Prochaine visite */}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      {/* Avancement interventions */}
                      <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Interventions
                        </span>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {completedTickets} / {totalTickets || "0"}{" "}
                          <span className="text-[11px] font-semibold text-slate-400">réalisées</span>
                        </p>
                      </div>

                      {/* État facturation */}
                      <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Facturation
                        </span>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {pendingInvoices === 0 ? (
                            <span className="text-brand-green flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> À jour
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> {pendingInvoices} en attente
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Prochaine visite */}
                    {nextVisit && nextVisit.dateProgrammee ? (
                      <div className="p-3 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-blue shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-brand-blue block uppercase">
                              Prochaine intervention préventive :
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {format(new Date(nextVisit.dateProgrammee), "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                        {nextVisit.technicienAssigne && (
                          <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                            {nextVisit.technicienAssigne.firstName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-400 font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span>Aucune intervention programmée à venir</span>
                      </div>
                    )}
                  </div>

                  {/* Bouton d'action pour ouvrir le dossier complet */}
                  <button
                    type="button"
                    onClick={() => setSelectedContractId(c.id)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-brand-blue text-white py-2.5 rounded-xl text-xs font-extrabold transition-all group-hover:shadow-xs"
                  >
                    <span>Ouvrir le dossier entreprise ({totalTickets} tickets)</span>
                    <ArrowRight className="w-4 h-4 text-brand-green" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VUE 2 : DOSSIER D'UNE ENTREPRISE SPÉCIFIQUE
  // --------------------------------------------------------------------------
  const todayStart = startOfDay(new Date());

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedContractId(null)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Retour à la liste des entreprises"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                {selectedContract.client.nom}
              </h1>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">
                Contrat {selectedContract.periodicite}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Contact : {selectedContract.client.contactNom || "—"} • Tél :{" "}
              {selectedContract.client.telephone} • {selectedContract.equipementsCouverts}
            </p>
          </div>
        </div>

        {/* Action Administrateur : Génération de tickets */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-brand-green" />
            <span>Configurer & Générer les Interventions</span>
          </button>
        )}
      </div>

      {/* Onglets thématiques du dossier de l'entreprise */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("PREVENTIF")}
              className={`pb-3 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "PREVENTIF"
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>1. Visites Programmées (Préventif)</span>
              <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {preventifTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PONCTUEL")}
              className={`pb-3 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "PONCTUEL"
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>2. Pannes Imprévues sous contrat</span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {ponctuelTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FACTURES")}
              className={`pb-3 text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "FACTURES"
                  ? "border-brand-green text-brand-green"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>3. Facturation du Contrat</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {selectedContract.facturesPeriodiques.length}
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ONGLET 1 : VISITES PROGRAMMÉES (PRÉVENTIF) AVEC VERROUILLAGE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "PREVENTIF" && (
          <div className="space-y-4">
            {preventifTickets.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <Calendar className="w-12 h-12 text-brand-blue/40 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">
                    Aucune visite préventive n&apos;a encore été configurée
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Utilisez le bouton ci-dessus pour configurer les clauses de passage (ex: 2 fois
                    par mois) et générer automatiquement l&apos;ensemble des interventions de l&apos;année.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(true)}
                    className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer la configuration</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-4 px-6">N° Intervention</th>
                        <th className="py-4 px-6">Date Programmée</th>
                        <th className="py-4 px-6">Technicien Assigné</th>
                        <th className="py-4 px-6">Statut</th>
                        <th className="py-4 px-6">Contrôle / Consignes</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preventifTickets.map((ticket) => {
                        const targetDate = ticket.dateProgrammee
                          ? startOfDay(new Date(ticket.dateProgrammee))
                          : null;

                        // Règle de blocage : si la date du jour est strictement avant la date programmée
                        const isLocked =
                          targetDate &&
                          isBefore(todayStart, targetDate) &&
                          ticket.statut === "NOUVEAU";

                        const isDone = ticket.statut === "TERMINE" || ticket.statut === "CLOTURE";
                        const isInProgress = ticket.statut === "EN_INTERVENTION";

                        return (
                          <tr
                            key={ticket.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isLocked ? "bg-slate-50/30" : ""
                            }`}
                          >
                            <td className="py-4 px-6 font-extrabold text-brand-blue">
                              <Link href={`/crm/tickets/${ticket.id}`} className="hover:underline">
                                {ticket.numero}
                              </Link>
                            </td>

                            <td className="py-4 px-6 font-semibold text-slate-800">
                              {ticket.dateProgrammee ? (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                                  <span>
                                    {format(new Date(ticket.dateProgrammee), "dd MMMM yyyy", {
                                      locale: fr,
                                    })}
                                  </span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="py-4 px-6 font-bold text-slate-700">
                              {ticket.technicienAssigne ? (
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {ticket.technicienAssigne.firstName}{" "}
                                    {ticket.technicienAssigne.lastName}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-amber-600 italic">Non assigné</span>
                              )}
                            </td>

                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                                  isDone
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isInProgress
                                    ? "bg-blue-100 text-brand-blue"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {isDone ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-brand-green" />
                                    <span>EFFECTUÉE</span>
                                  </>
                                ) : isInProgress ? (
                                  <>
                                    <Clock className="w-3 h-3 animate-spin text-brand-blue" />
                                    <span>EN COURS</span>
                                  </>
                                ) : (
                                  <span>PROGRAMMÉE</span>
                                )}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-slate-500 max-w-xs truncate font-medium">
                              {ticket.checklistPrevue || "Maintenance standard"}
                            </td>

                            {/* Action avec verrouillage temporel */}
                            <td className="py-4 px-6 text-right">
                              {isLocked ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold select-none cursor-not-allowed border border-slate-200">
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Bloqué jusqu&apos;au jour J</span>
                                </div>
                              ) : (
                                <Link
                                  href={`/crm/tickets/${ticket.id}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs ${
                                    isDone
                                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                      : "bg-brand-green hover:bg-emerald-600 text-white"
                                  }`}
                                >
                                  {isDone ? (
                                    <span>Voir le rapport</span>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5" />
                                      <span>Démarrer</span>
                                    </>
                                  )}
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ONGLET 2 : PANNES PONCTUELLES DÉCLARÉES SOUS CONTRAT          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "PONCTUEL" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Pannes imprévues et réparations curatives survenues sur le parc de cette entreprise.
              </p>
              <Link
                href={`/crm/tickets/ponctuel?new=true&clientId=${selectedContract.clientId}`}
                className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-brand-green" />
                <span>+ Déclarer une panne ponctuelle</span>
              </Link>
            </div>

            {ponctuelTickets.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Aucune panne ponctuelle enregistrée
                </h3>
                <p className="text-xs text-slate-400">
                  Le parc fonctionne parfaitement. Toutes les interventions sont pour l&apos;instant
                  préventives.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <tr>
                      <th className="py-4 px-6">N° Ticket</th>
                      <th className="py-4 px-6">Date Panne</th>
                      <th className="py-4 px-6">Description Panne</th>
                      <th className="py-4 px-6">Statut</th>
                      <th className="py-4 px-6 text-right">Détail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ponctuelTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-extrabold text-brand-blue">
                          <Link href={`/crm/tickets/${t.id}`}>{t.numero}</Link>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-600">
                          {format(new Date(t.dateCreation), "dd/MM/yyyy")}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">{t.panneDeclaree}</td>
                        <td className="py-4 px-6 font-extrabold text-xs">{t.statut}</td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/crm/tickets/${t.id}`}
                            className="text-xs font-bold text-brand-blue hover:underline"
                          >
                            Consulter →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ONGLET 3 : FACTURATION DU CONTRAT SELON LES CLAUSES            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "FACTURES" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-slate-800">
                  Clause financière : {formatFCFA(selectedContract.montantMainOeuvre)} / période (
                  {selectedContract.periodicite.toLowerCase()})
                </p>
                <p className="text-slate-500">
                  Terme de facturation :{" "}
                  {selectedContract.termeFacturation === "A_ECHOIR"
                    ? "À échoir (en début de période)"
                    : "Échu (en fin de période)"}
                </p>
              </div>
            </div>

            {selectedContract.facturesPeriodiques.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Aucune facture périodique émise
                </h3>
                <p className="text-xs text-slate-400">
                  Générez les échéances via le bouton de configuration du contrat.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <tr>
                      <th className="py-4 px-6">N° Facture</th>
                      <th className="py-4 px-6">Date Émission</th>
                      <th className="py-4 px-6">Montant Forfaitaire</th>
                      <th className="py-4 px-6">Statut Règlement</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedContract.facturesPeriodiques.map((fac) => {
                      const isPaid = fac.statutPaiement === "PAYE";
                      return (
                        <tr key={fac.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-extrabold text-brand-blue">{fac.numero}</td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {format(new Date(fac.dateEmission), "dd MMMM yyyy", { locale: fr })}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                            {formatFCFA(fac.montant)}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isPaid ? "PAYÉ" : "EN ATTENTE"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPaymentModal({
                                      isOpen: true,
                                      docId: fac.id,
                                      numero: fac.numero,
                                      montant: fac.montant,
                                    })
                                  }
                                  className="bg-brand-blue hover:bg-brand-blue-dark text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs"
                                >
                                  Encaisser
                                </button>
                              )}
                              <a
                                href={`/api/documents/${fac.numero}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition-colors"
                                title="Télécharger le PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL CONFIGURATION & GÉNÉRATION DES INTERVENTIONS DU CONTRAT */}
      {/* ------------------------------------------------------------- */}
      {showGenerateModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-green" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Configuration des Interventions du Contrat
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedContract.client.nom}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateTickets} className="p-6 space-y-4 text-xs">
              {generateError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 font-bold border border-red-200">
                  {generateError}
                </div>
              )}
              {generateSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {generateSuccess}
                </div>
              )}

              {/* Fréquence des visites */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">Fréquence des Interventions</label>
                <select
                  value={generateForm.frequenceVisites}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      frequenceVisites: Number(e.target.value),
                      jourPassage:
                        Number(e.target.value) === 2
                          ? "1er et 15 du mois"
                          : Number(e.target.value) === 1
                          ? "10 de chaque mois"
                          : "Chaque semaine",
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value={2}>2 fois par mois (ex. 24 visites/an)</option>
                  <option value={1}>1 fois par mois (ex. 12 visites/an)</option>
                  <option value={4}>Hebdomadaire (4 fois par mois)</option>
                </select>
              </div>

              {/* Jours convenus */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">Jours / Périodes de passage</label>
                <input
                  type="text"
                  value={generateForm.jourPassage}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, jourPassage: e.target.value })
                  }
                  placeholder="Ex: 5 et 20 de chaque mois"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              {/* Technicien référent */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">
                  Technicien Référent par défaut
                </label>
                <select
                  value={generateForm.technicienAssigneId}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, technicienAssigneId: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">Non assigné (assigner plus tard)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Terme de facturation */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">Clause de Facturation</label>
                <select
                  value={generateForm.termeFacturation}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, termeFacturation: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="ECHU">À terme échu (fin de période après visites)</option>
                  <option value="A_ECHOIR">À terme à échoir (début de période)</option>
                </select>
              </div>

              {/* Checklist / Consignes */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">
                  Checklist préventive par défaut
                </label>
                <textarea
                  rows={3}
                  value={generateForm.checklistPrevue}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, checklistPrevue: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
                />
              </div>

              {/* Générer les factures périodiques */}
              <label className="flex items-center gap-2 pt-1 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateForm.genererFactures}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, genererFactures: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-blue"
                />
                <span>Générer automatiquement les échéances de facturation associées</span>
              </label>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generateLoading}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-white px-5 py-2.5 rounded-xl font-extrabold shadow-sm disabled:opacity-50"
                >
                  {generateLoading ? "Génération en cours..." : "Générer les Interventions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'enregistrement de règlement */}
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
        description="Confirmez le mode de règlement de la facture périodique du contrat."
      />
    </div>
  );
}
