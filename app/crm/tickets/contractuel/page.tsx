import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketFormContractuel } from "@/components/crm/TicketFormContractuel";
import { TicketsContractuelTable } from "@/components/crm/TicketsContractuelTable";
import { Plus } from "lucide-react";
import { InterventionType, ContractStatus, StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TicketsContractuelPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; contractId?: string; clientId?: string }>;
}) {
  const { new: isNew, contractId } = await searchParams;
  const user = await getCurrentUser();

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

    if (user.role !== StaffRole.TECHNICIEN) {
      const activeContracts = await db.contract.findMany({
        where: { statut: ContractStatus.ACTIF },
        include: { client: true },
      });

      contracts = activeContracts.map((c) => ({
        id: c.id,
        clientId: c.clientId,
        clientNom: c.client.nom,
        equipementsCouverts: c.equipementsCouverts,
        periodicite: c.periodicite,
      }));

      technicians = await db.user.findMany({
        where: {
          OR: [{ role: "TECHNICIEN" }, { assignableAsTechnician: true }],
          isActive: true,
        },
        select: { id: true, firstName: true, lastName: true },
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
          <div className="flex items-center gap-2 text-brand-green font-extrabold text-[11px] uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            <span>{isTechnician ? "Mes Visites sous Contrat" : "Parcours Entreprises"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {isTechnician ? "Mes Interventions Contractuelles" : "Tickets sous Contrat de Maintenance"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isTechnician
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
