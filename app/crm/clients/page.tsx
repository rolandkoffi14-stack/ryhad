import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClientManager } from "@/components/crm/ClientManager";
import { StaffRole } from "@prisma/client";

export const metadata = {
  title: "Clients",
};

export const dynamic = "force-dynamic";

export default async function CrmClientsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Seuls Admin et Réceptionniste accèdent au répertoire client
  if (user.role === StaffRole.TECHNICIEN) {
    redirect("/crm");
  }

  let clients: any[] = [];

  try {
    clients = await db.client.findMany({
      include: {
        contrats: {
          where: { statut: "ACTIF" },
          select: { id: true, periodicite: true, equipementsCouverts: true },
        },
        _count: {
          select: {
            interventions: true,
            contrats: true,
            demandes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Error loading clients:", e);
  }

  return <ClientManager clients={clients} userRole={user.role} />;
}
