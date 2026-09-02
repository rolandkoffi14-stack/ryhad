import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentsTable } from "@/components/crm/DocumentsTable";
import { StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CrmDocumentsPage() {
  const user = await getCurrentUser();

  // Réservé à la Direction et à la Réception
  if (user.role === StaffRole.TECHNICIEN) {
    redirect("/crm");
  }

  let documents: any[] = [];

  try {
    documents = await db.financialDocument.findMany({
      include: {
        intervention: {
          include: {
            client: true,
          },
        },
        contract: {
          include: {
            client: true,
          },
        },
        demandeCommerciale: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { dateEmission: "desc" },
    });
  } catch (e) {
    console.error("Error loading documents:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Documents Financiers & Facturation
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Génération PDF conforme et suivi des règlements (Devis DEV et Factures FAC).
        </p>
      </div>

      <DocumentsTable documents={documents as any} />
    </div>
  );
}
