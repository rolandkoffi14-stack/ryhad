import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommercialRequestsTable } from "@/components/crm/CommercialRequestsTable";
import { StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CrmDemandesCommercialesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Réservé à la Direction et à la Réception
  if (user.role === StaffRole.TECHNICIEN) {
    redirect("/crm");
  }

  let demandes: any[] = [];

  try {
    demandes = await db.demandeCommerciale.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Error loading commercial requests:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Demandes Commerciales & Cotations
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Suivi des demandes d&apos;achat de matériel, locations de vidéoprojecteurs et formations.
        </p>
      </div>

      <CommercialRequestsTable demandes={demandes as any} />
    </div>
  );
}
