import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";
import { TechniciansGrid } from "@/components/crm/TechniciansGrid";

export const dynamic = "force-dynamic";

export default async function CrmTechniciensPage() {
  let technicians: any[] = [];

  try {
    technicians = await db.user.findMany({
      where: {
        OR: [{ role: StaffRole.TECHNICIEN }, { assignableAsTechnician: true }],
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        interventionsAssignees: {
          where: {
            statut: {
              notIn: ["LIVRE_CLOTURE", "CLOTURE"],
            },
          },
          select: {
            id: true,
            numero: true,
            statut: true,
            typeMateriel: true,
            client: {
              select: { nom: true },
            },
          },
          orderBy: { dateCreation: "desc" },
        },
      },
    });
  } catch (e) {
    console.error("Error loading technicians:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Équipe Technique & Charge d&apos;Atelier
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Suivi de la disponibilité et répartition des dossiers en cours par technicien.
        </p>
      </div>

      <TechniciansGrid technicians={technicians} />
    </div>
  );
}
