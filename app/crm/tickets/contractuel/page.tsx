import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketFormContractuel } from "@/components/crm/TicketFormContractuel";
import { ContractEnterpriseView } from "@/components/crm/ContractEnterpriseView";
import { ContractStatus, StaffRole } from "@prisma/client";

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

  const isTechnician = user.role === StaffRole.TECHNICIEN;
  let contracts: any[] = [];
  let technicians: any[] = [];

  try {
    const contractWhere: any = { statut: ContractStatus.ACTIF };
    if (isTechnician) {
      // Le technicien ne voit que les entreprises où il a au moins une intervention assignée
      contractWhere.interventions = {
        some: {
          technicienAssigneId: user.id,
        },
      };
    }

    const [fetchedContracts, fetchedTechnicians] = await Promise.all([
      db.contract.findMany({
        where: contractWhere,
        include: {
          client: true,
          interventions: {
            where: isTechnician
              ? { technicienAssigneId: user.id }
              : undefined,
            select: {
              id: true,
              numero: true,
              type: true,
              typeMateriel: true,
              panneDeclaree: true,
              statut: true,
              dateCreation: true,
              dateProgrammee: true,
              checklistPrevue: true,
              technicienAssigneId: true,
              technicienAssigne: {
                select: { id: true, firstName: true, lastName: true },
              },
              documents: {
                select: {
                  id: true,
                  numero: true,
                  type: true,
                  montant: true,
                  statutPaiement: true,
                },
              },
            },
            orderBy: [
              { dateProgrammee: "asc" },
              { dateCreation: "desc" },
            ],
          },
          facturesPeriodiques: isTechnician
            ? false
            : {
                select: {
                  id: true,
                  numero: true,
                  type: true,
                  typeFacture: true,
                  montant: true,
                  statutPaiement: true,
                  modePaiement: true,
                  dateEmission: true,
                },
                orderBy: { dateEmission: "desc" },
              },
        },
        orderBy: { dateDebut: "desc" },
      }),
      db.user.findMany({
        where: {
          OR: [{ role: "TECHNICIEN" }, { assignableAsTechnician: true }],
          isActive: true,
        },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" },
      }),
    ]);

    contracts = fetchedContracts.map((c: any) => ({
      ...c,
      facturesPeriodiques: isTechnician ? [] : c.facturesPeriodiques || [],
    }));
    technicians = fetchedTechnicians;
  } catch (e) {
    console.error("Tickets contractuel load error:", e);
  }

  // Si on demande la création directe d'un ticket individuel via ?new=true
  if (isNew && !isTechnician) {
    const formattedContracts = contracts.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      clientNom: c.client.nom,
      equipementsCouverts: c.equipementsCouverts,
      periodicite: c.periodicite,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              Nouveau Ticket Contrat
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Intervention préventive ou curative sous contrat.
            </p>
          </div>
          <Link
            href={contractId ? `/crm/tickets/contractuel?contractId=${contractId}` : "/crm/tickets/contractuel"}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            <span>{contractId ? "Retour au dossier" : "Retour à la liste"}</span>
          </Link>
        </div>

        <TicketFormContractuel
          contracts={formattedContracts}
          technicians={technicians}
          initialContractId={contractId}
        />
      </div>
    );
  }

  // Affichage principal : Vue par Entreprise
  return (
    <ContractEnterpriseView
      contracts={contracts}
      technicians={technicians}
      currentUser={user}
      initialSelectedContractId={contractId}
    />
  );
}
