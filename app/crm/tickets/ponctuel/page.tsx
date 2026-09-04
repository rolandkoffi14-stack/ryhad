import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketFormPonctuel } from "@/components/crm/TicketFormPonctuel";
import { TicketsPonctuelTable } from "@/components/crm/TicketsPonctuelTable";
import { Plus } from "lucide-react";
import { InterventionType, StaffRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TicketsPonctuelPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; filter?: string; clientId?: string }>;
}) {
  const { new: isNew, filter, clientId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let tickets: any[] = [];
  let clients: any[] = [];
  let technicians: any[] = [];

  try {
    const whereClause: any = {
      type: InterventionType.PONCTUEL,
    };

    // Si technicien, restreindre strictement à ses tickets assignés
    if (user.role === StaffRole.TECHNICIEN) {
      whereClause.technicienAssigneId = user.id;
    }

    if (isNew && user.role !== StaffRole.TECHNICIEN) {
      // Chargement en parallèle du formulaire de création
      const [fetchedTickets, fetchedClients, fetchedTechnicians] = await Promise.all([
        db.intervention.findMany({
          where: whereClause,
          include: {
            client: true,
            technicienAssigne: true,
            documents: true,
          },
          orderBy: { dateCreation: "desc" },
        }),
        db.client.findMany({
          where: {
            contrats: {
              none: {
                statut: "ACTIF",
              },
            },
          },
          select: { id: true, nom: true, telephone: true },
          orderBy: { nom: "asc" },
        }),
        db.user.findMany({
          where: {
            OR: [{ role: "TECHNICIEN" }, { assignableAsTechnician: true }],
            isActive: true,
          },
          select: { id: true, firstName: true, lastName: true },
        }),
      ]);

      tickets = fetchedTickets;
      clients = fetchedClients;
      technicians = fetchedTechnicians;
    } else {
      // Chargement ultra-rapide de la liste seule (1 seule requête SQL)
      tickets = await db.intervention.findMany({
        where: whereClause,
        include: {
          client: true,
          technicienAssigne: true,
          documents: true,
        },
        orderBy: { dateCreation: "desc" },
      });
    }
  } catch (e) {
    console.error("Tickets ponctuel load error:", e);
  }

  const isTechnician = user.role === StaffRole.TECHNICIEN;

  return (
    <div className="space-y-6">
      {/* Header aéré & concis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-blue font-extrabold text-[11px] uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            <span>{isTechnician ? "Mes Interventions" : "Parcours Atelier"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            {isTechnician ? "Mes Tickets Ponctuels" : "Tickets Ponctuels & Diagnostic"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isTechnician
              ? "Dossiers de réparation en cours assignés à votre profil."
              : "Suivi des dépôts comptoir, diagnostics, devis et réparations."}
          </p>
        </div>

        {!isTechnician && (
          <div>
            {isNew ? (
              <Link
                href="/crm/tickets/ponctuel"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200"
              >
                <span>Voir la liste des tickets</span>
              </Link>
            ) : (
              <Link
                href="/crm/tickets/ponctuel?new=true"
                className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-brand-green" />
                <span>Nouveau Dépôt</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Affichage Formulaire ou Tableau Allégé */}
      {isNew && !isTechnician ? (
        <TicketFormPonctuel
          clients={clients}
          technicians={technicians}
          preselectedClientId={clientId}
        />
      ) : (
        <TicketsPonctuelTable tickets={tickets as any} isTechnician={isTechnician} />
      )}
    </div>
  );
}
