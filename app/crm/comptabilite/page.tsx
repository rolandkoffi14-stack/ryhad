import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";
import { AccountingManager } from "@/components/crm/AccountingManager";

export const metadata = {
  title: "Comptabilité & Trésorerie",
};

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Seule la Direction (ADMIN) a accès à la comptabilité
  if (user.role !== StaffRole.ADMIN) {
    redirect("/crm");
  }

  let documents: any[] = [];

  try {
    documents = await db.financialDocument.findMany({
      include: {
        intervention: {
          select: {
            id: true,
            numero: true,
            type: true,
            typeMateriel: true,
            montantMainOeuvre: true,
            piecesUtilisees: {
              select: { id: true, designation: true, quantite: true, prixUnitaire: true },
            },
            client: {
              select: { id: true, nom: true, telephone: true, type: true, email: true },
            },
          },
        },
        contract: {
          select: {
            id: true,
            periodicite: true,
            equipementsCouverts: true,
            client: {
              select: { id: true, nom: true, telephone: true, type: true, email: true },
            },
          },
        },
        demandeCommerciale: {
          select: {
            id: true,
            typeDemande: true,
            client: {
              select: { id: true, nom: true, telephone: true, type: true, email: true },
            },
          },
        },
      },
      orderBy: { dateEmission: "desc" },
    });
  } catch (error) {
    console.error("Erreur lors du chargement des données comptables:", error);
  }

  return <AccountingManager documents={documents} />;
}
