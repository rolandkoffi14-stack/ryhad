import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

const updateUserPatchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.nativeEnum(StaffRole).optional(),
  assignableAsTechnician: z.boolean().optional(),
});

const updateUserPutSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(StaffRole),
  assignableAsTechnician: z.boolean(),
  isActive: z.boolean(),
  password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères").optional(),
});

/**
 * PUT /api/crm/utilisateurs/[id]
 * Mise à jour complète des informations d'un utilisateur et/ou de son mot de passe (Admin seulement)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const currentRole = (session.user as any).role as StaffRole;
    const currentUserId = (session.user as any).id as string;
    if (currentRole !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Accès interdit : privilège administrateur requis." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateUserPutSchema.parse(body);

    // Empêcher l'administrateur de s'auto-désactiver
    if (currentUserId === id && data.isActive === false) {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez pas désactiver votre propre compte administrateur." },
        { status: 400 }
      );
    }

    // Empêcher l'administrateur de s'auto-rétrograder de rôle
    if (currentUserId === id && data.role !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez pas modifier votre propre rôle administrateur." },
        { status: 400 }
      );
    }

    // Vérifier unicité email
    const existing = await db.user.findFirst({
      where: {
        email: data.email.toLowerCase().trim(),
        id: { not: id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Cette adresse email est déjà utilisée par un autre collaborateur." },
        { status: 400 }
      );
    }

    const updateData: any = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone ? data.phone.trim() : null,
      role: data.role,
      assignableAsTechnician: data.assignableAsTechnician,
      isActive: data.isActive,
    };

    if (data.password && data.password.trim().length >= 10) {
      const hashedPassword = await bcrypt.hash(data.password.trim(), 10);
      updateData.passwordHash = hashedPassword;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
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
      message: "Collaborateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Erreur PUT utilisateur:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Erreur lors de la modification du collaborateur." },
      { status: 500 }
    );
  }
}

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
    const currentUserId = (session.user as any).id as string;
    if (currentRole !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Accès interdit : privilège administrateur requis." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserPatchSchema.parse(body);

    // Empêcher l'administrateur de se désactiver lui-même
    if (validatedData.isActive === false && currentUserId === id) {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez pas désactiver votre propre compte administrateur." },
        { status: 400 }
      );
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
