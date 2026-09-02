import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClientManager } from "@/components/crm/ClientManager";
import { StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CrmClientsPage() {
  const user = await getCurrentUser();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Répertoire Clients & Entreprises
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Consultez les fiches clients, modifiez leurs coordonnées et créez directement des tickets d&apos;intervention.
        </p>
      </div>

      <ClientManager clients={clients} userRole={user.role} />
    </div>
  );
}
