import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContractManager } from "@/components/crm/ContractManager";
import { ClientType, StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CrmContratsPage() {
  const user = await getCurrentUser();

  // Seul l'Administrateur accède aux contrats de maintenance (Section 3 parcours-et-rbac.md)
  if (user.role !== StaffRole.ADMIN) {
    redirect("/crm");
  }

  let contracts: any[] = [];
  let clients: any[] = [];

  try {
    const [fetchedContracts, fetchedClients] = await Promise.all([
      db.contract.findMany({
        include: {
          client: true,
          visitesPlanifiees: {
            orderBy: { datePrevue: "asc" },
          },
          facturesPeriodiques: {
            orderBy: { dateEmission: "desc" },
          },
        },
        orderBy: { dateDebut: "desc" },
      }),
      db.client.findMany({
        select: { id: true, nom: true, type: true },
        orderBy: { nom: "asc" },
      }),
    ]);

    contracts = fetchedContracts;
    // Prioriser les entreprises, sinon tous les clients
    const entrepriseClients = fetchedClients.filter((c) => c.type === ClientType.ENTREPRISE);
    clients = entrepriseClients.length > 0 ? entrepriseClients : fetchedClients;
  } catch (e) {
    console.error("Error loading contracts:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Contrats de Maintenance PME & Entreprises
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Gestion des parcs sous contrat, planification des visites périodiques et émission des factures récurrentes.
        </p>
      </div>

      <ContractManager contracts={contracts} clients={clients} />
    </div>
  );
}
