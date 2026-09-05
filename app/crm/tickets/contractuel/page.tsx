import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketFormContractuel } from "@/components/crm/TicketFormContractuel";
import { TicketsContractuelTable } from "@/components/crm/TicketsContractuelTable";
import { Plus } from "lucide-react";
import { InterventionType, ContractStatus, StaffRole } from "@prisma/client";

export const metadata = {
  title: "Tickets Contractuels",
};

export const dynamic = "force-dynamic";

export default async function TicketsContractuelPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; contractId?: string; clientId?: string }>;
}) {
  const { new: isNew, contractId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let tickets: any[] = [];
  let contracts: any[] = [];
  let technicians: any[] = [];

  try {
    const whereClause: any = {
      type: InterventionType.CONTRACTUEL,
    };

    if (user.role === StaffRole.TECHNICIEN) {
      whereClause.technicienAssigneId = user.id;
    }

    if (isNew && user.role !== StaffRole.TECHNICIEN) {
      // Chargement en parallèle du formulaire de création contrat
      const [fetchedTickets, activeContracts, fetchedTechnicians] = await Promise.all([
        db.intervention.findMany({
          where: whereClause,
          include: {
            client: true,
            contract: true,
            technicienAssigne: true,
            documents: true,
          },
          orderBy: { dateCreation: "desc" },
        }),
        db.contract.findMany({
          where: { statut: ContractStatus.ACTIF },
          include: { client: true },
        }),
        db.user.findMany({
          where: {
            OR: [{ role: "TECHNICIEN" }, { assignableAsTechnician: true }],
            isActive: true,
          },
          select: { id: true, firstName: true, lastName: true },
        }),
      ]);

      tickets = fetchedTickets;
      contracts = activeContracts.map((c) => ({
        id: c.id,
        clientId: c.clientId,
        clientNom: c.client.nom,
        equipementsCouverts: c.equipementsCouverts,
        periodicite: c.periodicite,
      }));
      technicians = fetchedTechnicians;
    } else {
      // Chargement ultra-rapide de la liste seule (1 seule requête SQL)
      tickets = await db.intervention.findMany({
        where: whereClause,
        include: {
          client: true,
          contract: true,
          technicienAssigne: true,
          documents: true,
        },
        orderBy: { dateCreation: "desc" },
      });
    }
  } catch (e) {
    console.error("Tickets contractuel load error:", e);
  }

  const isTechnician = user.role === StaffRole.TECHNICIEN;

  return (
    <div className="space-y-6">
      {/* Header aéré & concis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {isNew
              ? "Nouveau Ticket sous Contrat"
              : isTechnician
              ? "Mes Interventions Contractuelles"
              : "Tickets sous Contrat de Maintenance"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isNew
              ? "Prise en charge directe d'une panne ou visite pour une entreprise abonnée."
              : isTechnician
              ? "Interventions préventives et curatives sur parcs d'entreprises sous contrat."
              : "Suivi des visites programmées, rapports et pièces éventuelles."}
          </p>
        </div>

        {!isTechnician && (
          <div>
            {isNew ? (
              <Link
                href="/crm/tickets/contractuel"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200"
              >
                <span>Voir la liste des tickets</span>
              </Link>
            ) : (
              <Link
                href="/crm/tickets/contractuel?new=true"
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Ticket Contrat</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Affichage Formulaire ou Tableau Allégé */}
      {isNew && !isTechnician ? (
        <TicketFormContractuel
          contracts={contracts}
          technicians={technicians}
          initialContractId={contractId}
        />
      ) : (
        <TicketsContractuelTable tickets={tickets as any} isTechnician={isTechnician} />
      )}
    </div>
  );
}
