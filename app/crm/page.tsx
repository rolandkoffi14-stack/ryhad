import Link from "next/link";
import { auth, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketStatusBadge } from "@/components/crm/TicketStatusBadge";
import {
  Ticket,
  ClipboardList,
  AlertTriangle,
  Receipt,
  Users,
  Clock,
  ArrowRight,
  Wrench,
  CheckCircle2,
  Calendar,
  Package,
  Building2,
} from "lucide-react";
import { DashboardRecentTicketsTable } from "@/components/crm/DashboardRecentTicketsTable";
import { InterventionStatut, InterventionType, ContractStatus, StaffRole } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  const user = await getCurrentUser();

  // Requêtes adaptées selon le rôle
  let tickets: any[] = [];
  let clientsCount = 0;
  let activeContractsCount = 0;
  let commercialRequestsCount = 0;
  let totalRevenue = 0;

  try {
    if (user.role === StaffRole.TECHNICIEN) {
      // Pour le TECHNICIEN : uniquement ses tickets assignés
      tickets = await db.intervention.findMany({
        where: {
          technicienAssigneId: user.id,
        },
        include: {
          client: true,
          contract: true,
          technicienAssigne: true,
          documents: true,
        },
        orderBy: { dateCreation: "desc" },
      });
    } else {
      // Pour ADMIN et RÉCEPTIONNISTE : parallélisation totale des 5 requêtes de synthèse
      const [
        fetchedTickets,
        fetchedClientsCount,
        fetchedContractsCount,
        fetchedCommercialCount,
        revenueAggregate,
      ] = await Promise.all([
        db.intervention.findMany({
          include: {
            client: true,
            contract: true,
            technicienAssigne: true,
            documents: true,
          },
          orderBy: { dateCreation: "desc" },
        }),
        db.client.count(),
        db.contract.count({
          where: { statut: ContractStatus.ACTIF },
        }),
        db.demandeCommerciale.count({
          where: { statut: "NOUVEAU" },
        }),
        db.financialDocument.aggregate({
          where: { statutPaiement: "PAYE" },
          _sum: { montant: true },
        }),
      ]);

      tickets = fetchedTickets;
      clientsCount = fetchedClientsCount;
      activeContractsCount = fetchedContractsCount;
      commercialRequestsCount = fetchedCommercialCount;
      totalRevenue = revenueAggregate._sum.montant || 0;
    }
  } catch (e) {
    console.error("Dashboard data load error:", e);
  }

  // Filtrages
  const ponctuelTickets = tickets.filter((t) => t.type === InterventionType.PONCTUEL);
  const contractuelTickets = tickets.filter((t) => t.type === InterventionType.CONTRACTUEL);

  const pendingDiagnosticCount = ponctuelTickets.filter(
    (t) =>
      t.statut === InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE ||
      t.statut === InterventionStatut.EN_DIAGNOSTIC
  ).length;

  const activePonctuelCount = ponctuelTickets.filter(
    (t) => t.statut !== InterventionStatut.LIVRE_CLOTURE && t.statut !== InterventionStatut.CLOTURE
  ).length;

  const activeContractuelCount = contractuelTickets.filter(
    (t) => t.statut !== InterventionStatut.LIVRE_CLOTURE && t.statut !== InterventionStatut.CLOTURE
  ).length;

  const completedTicketsCount = tickets.filter(
    (t) =>
      t.statut === InterventionStatut.TERMINE ||
      t.statut === InterventionStatut.LIVRE_CLOTURE ||
      t.statut === InterventionStatut.CLOTURE
  ).length;

  const totalActiveTicketsCount = activePonctuelCount + activeContractuelCount;

  return (
    <div className="space-y-8">
      {/* Top Banner adapté selon le rôle */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
          <span
            className={`w-2 h-2 rounded-full ${
              user.role === StaffRole.ADMIN
                ? "bg-brand-blue"
                : user.role === StaffRole.RECEPTIONNISTE
                ? "bg-purple-600"
                : "bg-brand-green"
            }`}
          ></span>
          <span className="text-gray-500">
            Espace {user.role === StaffRole.ADMIN ? "Direction" : user.role === StaffRole.RECEPTIONNISTE ? "Réception" : "Technicien"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Bonjour, {user.firstName} {user.lastName}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {user.role === StaffRole.TECHNICIEN
            ? "Voici vos interventions assignées (dépôts atelier et visites sous contrat) et les diagnostics à réaliser."
            : user.role === StaffRole.RECEPTIONNISTE
            ? "Supervision des dépôts atelier, encaissements de diagnostics et livraisons clients."
            : "Tableau de bord de supervision générale de l'atelier RyHaD Tic-Medic."}
        </p>
      </div>

      {/* Cartes Métriques selon le rôle */}
      {user.role === StaffRole.TECHNICIEN ? (
        // METRIQUES DU TECHNICIEN
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tickets Ponctuels</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-blue">{activePonctuelCount}</div>
            <Link href="/crm/tickets/ponctuel" className="text-[11px] text-brand-blue font-bold hover:underline block">
              Voir mes dossiers atelier →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Interventions Contrat</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-green-dark">{activeContractuelCount}</div>
            <Link href="/crm/tickets/contractuel" className="text-[11px] text-brand-green-dark font-bold hover:underline block">
              Voir mes visites entreprises →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Terminées</span>
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-dark">{completedTicketsCount}</div>
            <p className="text-[11px] text-gray-400">Total réparations validées</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">À Diagnostiquer</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-dark">{pendingDiagnosticCount}</div>
            <Link href="/crm/tickets/ponctuel" className="text-[11px] text-amber-600 font-bold hover:underline block">
              Diagnostics en attente →
            </Link>
          </div>
        </div>
      ) : (
        // METRIQUES DE LA DIRECTION / RECEPTION
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tickets Actifs</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-dark">{totalActiveTicketsCount}</div>
            <p className="text-[11px] text-gray-500">
              {activePonctuelCount} ponctuel(s) • {activeContractuelCount} contrat(s)
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">
                {user.role === StaffRole.ADMIN ? "Contrats Actifs" : "Clients Actifs"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-dark">
              {user.role === StaffRole.ADMIN ? activeContractsCount : clientsCount}
            </div>
            <p className="text-[11px] text-gray-500">
              {user.role === StaffRole.ADMIN ? "Parcs informatiques sous contrat" : "Clients enregistrés"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Demandes Commerciales</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-dark">{commercialRequestsCount}</div>
            <p className="text-[11px] text-amber-600 font-semibold">À traiter (Vente/Location)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 subtle-shadow space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Chiffre d&apos;Affaires</span>
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-brand-blue">
              {totalRevenue.toLocaleString("fr-FR")} <span className="text-xs font-bold text-gray-500">FCFA</span>
            </div>
            <p className="text-[11px] text-gray-500">Encaissé sur devis & factures</p>
          </div>
        </div>
      )}

      {/* Tableau Allégé des Dossiers d'Intervention Récents avec Bouton Œil & Filtres */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-brand-dark">
              {user.role === StaffRole.TECHNICIEN ? "Mes Interventions en Cours" : "Dossiers d'Intervention Récents"}
            </h2>
            <p className="text-xs text-gray-500">
              {user.role === StaffRole.TECHNICIEN
                ? "Accédez directement à vos dossiers pour consigner vos rapports techniques."
                : "Aperçu en direct des dossiers atelier et contrat."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/crm/tickets/ponctuel"
              className="text-xs font-bold text-brand-blue hover:underline bg-brand-blue-light px-3 py-1.5 rounded-xl transition-all"
            >
              Ponctuels ({activePonctuelCount})
            </Link>
            <Link
              href="/crm/tickets/contractuel"
              className="text-xs font-bold text-brand-green-dark hover:underline bg-brand-green-light px-3 py-1.5 rounded-xl transition-all"
            >
              Contrats ({activeContractuelCount})
            </Link>
          </div>
        </div>

        <DashboardRecentTicketsTable tickets={tickets as any} userRole={user.role} />
      </div>
    </div>
  );
}
