import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";
import { z } from "zod";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.nativeEnum(StaffRole).optional(),
  assignableAsTechnician: z.boolean().optional(),
});

/**
 * PATCH /api/crm/utilisateurs/[id]
 * Met à jour le statut actif/inactif ou le rôle d'un utilisateur (Admin seulement)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const currentRole = (session.user as any).role as StaffRole;
    if (currentRole !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Accès interdit : privilège administrateur requis." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Empêcher l'administrateur de se désactiver lui-même s'il est le seul
    if (validatedData.isActive === false && (session.user as any).id === id) {
      const adminCount = await db.user.count({
        where: { role: StaffRole.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, message: "Impossible de désactiver le seul compte administrateur actif." },
          { status: 400 }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: validatedData,
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

    broadcastCrmEvent("utilisateur:updated", id);

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Erreur mise à jour utilisateur:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Erreur lors de la modification du collaborateur." },
      { status: 500 }
    );
  }
}
