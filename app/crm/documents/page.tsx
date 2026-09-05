import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentsTable } from "@/components/crm/DocumentsTable";
import { StaffRole } from "@prisma/client";

export const metadata = {
  title: "Devis & Factures",
};

export const dynamic = "force-dynamic";

export default async function CrmDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

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

  // Désengorgement ciblé des factures de contrat :
  // Les devis, réparations atelier et factures commerciales restent visibles intégralement.
  // Pour les factures périodiques de contrat pré-générées pour l'année, seules celles échues, payées
  // ou du mois en cours apparaissent ici. Les échéances futures restent dans l'onglet du contrat.
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const visibleDocuments = documents.filter((doc) => {
    const isContractInvoice =
      doc.typeFacture === "CONTRAT" ||
      Boolean(doc.contractId) ||
      doc.type === "FACTURE_PERIODIQUE";

    if (!isContractInvoice) return true;
    if (doc.statutPaiement === "PAYE") return true;
    return new Date(doc.dateEmission) <= endOfMonth;
  });

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

      <DocumentsTable documents={visibleDocuments as any} />
    </div>
  );
}
