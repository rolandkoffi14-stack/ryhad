import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommercialDetailManager } from "@/components/crm/CommercialDetailManager";
import { StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CrmDemandeCommercialeDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === StaffRole.TECHNICIEN) {
    redirect("/crm");
  }

  const { id } = await params;

  const demande = await db.demandeCommerciale.findUnique({
    where: { id },
    include: {
      client: true,
      documents: {
        orderBy: { dateEmission: "desc" },
      },
    },
  });

  if (!demande) {
    notFound();
  }

  return (
    <CommercialDetailManager
      demande={demande as any}
      userRole={user.role}
      userName={`${user.firstName} ${user.lastName}`}
    />
  );
}
