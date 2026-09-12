import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContractManager } from "@/components/crm/ContractManager";
import { ClientType, StaffRole } from "@prisma/client";

export const metadata = {
  title: "Contrats de Maintenance",
};

export const dynamic = "force-dynamic";

export default async function CrmContratsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

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
        select: { id: true, nom: true, type: true, entreprise: true },
        orderBy: [{ type: "desc" }, { nom: "asc" }],
      }),
    ]);

    contracts = fetchedContracts;
    clients = fetchedClients;
  } catch (e) {
    console.error("Error loading contracts:", e);
  }

  return <ContractManager contracts={contracts} clients={clients} />;
}
