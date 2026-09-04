import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShieldCheck } from "lucide-react";
import { StaffRole } from "@prisma/client";
import { UsersTable } from "@/components/crm/UsersTable";

export const dynamic = "force-dynamic";

export default async function CrmUtilisateursPage() {
  const user = await getCurrentUser();

  // Seul l'Administrateur accède à la gestion des utilisateurs
  if (!user || user.role !== StaffRole.ADMIN) {
    redirect("/crm");
  }

  let users: any[] = [];

  try {
    users = await db.user.findMany({
      orderBy: { role: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        assignableAsTechnician: true,
        isActive: true,
      },
    });
  } catch (e) {
    console.error("Error loading users:", e);
  }

  return (
    <div className="space-y-6">
      {/* En-tête aéré */}
      <div>
        <div className="flex items-center gap-1.5 text-brand-blue font-bold text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-brand-green" />
          <span>Contrôle d&apos;Accès & Sécurité RBAC</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Gestion des Collaborateurs Staff
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configuration des comptes et des permissions opérationnelles (Admin, Réceptionniste, Technicien).
        </p>
      </div>

      <UsersTable users={users} currentUserId={user.id} />
    </div>
  );
}
