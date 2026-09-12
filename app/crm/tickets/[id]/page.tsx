import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketDetailManager } from "@/components/crm/TicketDetailManager";
import { ArrowLeft } from "lucide-react";
import { StaffRole } from "@prisma/client";

export const metadata = {
  title: "Détail du Dossier",
};

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let ticket: any = null;
  let technicians: any[] = [];

  try {
    const ticketPromise = db.intervention.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        technicienAssigne: true,
        piecesUtilisees: true,
        documents: {
          include: {
            transactions: {
              orderBy: { datePaiement: "desc" },
            },
          },
        },
        historique: {
          include: { auteur: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const techPromise =
      user.role !== StaffRole.TECHNICIEN
        ? db.user.findMany({
            where: {
              OR: [{ role: "TECHNICIEN" }, { assignableAsTechnician: true }],
              isActive: true,
            },
            select: { id: true, firstName: true, lastName: true },
          })
        : Promise.resolve([]);

    const [fetchedTicket, fetchedTechs] = await Promise.all([ticketPromise, techPromise]);
    ticket = fetchedTicket;
    technicians = fetchedTechs;

    // Si technicien connecté et ticket non assigné à ce technicien, accès refusé
    if (user.role === StaffRole.TECHNICIEN && ticket && ticket.technicienAssigneId !== user.id) {
      notFound();
    }
  } catch (e) {
    console.error("Error fetching ticket detail:", e);
  }

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ticket.type === "CONTRACTUEL" ? "/crm/tickets/contractuel" : "/crm/tickets/ponctuel"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-blue-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des tickets {ticket.type.toLowerCase()}s</span>
        </Link>
      </div>

      <TicketDetailManager
        ticket={ticket}
        technicians={technicians}
        userRole={user.role}
        currentUserId={user.id}
      />
    </div>
  );
}
