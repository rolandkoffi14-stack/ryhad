import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCreateSchema } from "@/lib/validations";
import { StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role as StaffRole;
    if (userRole !== StaffRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Accès interdit : seul un administrateur peut créer des utilisateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = userCreateSchema.parse(body);

    // Vérifier unicité email
    const existing = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Un utilisateur avec cette adresse email existe déjà." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const newUser = await db.user.create({
      data: {
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        email: validatedData.email.toLowerCase().trim(),
        passwordHash,
        phone: validatedData.phone ? validatedData.phone.trim() : null,
        role: validatedData.role,
        assignableAsTechnician: validatedData.assignableAsTechnician,
        isActive: true,
      },
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

    // Envoi de l'email de bienvenue avec ses accès
    try {
      const { sendWelcomeUserEmail } = await import("@/lib/services/email");
      const { env } = await import("@/lib/env");
      await sendWelcomeUserEmail({
        email: newUser.email,
        firstName: newUser.firstName,
        role: newUser.role,
        temporaryPassword: validatedData.password,
        loginUrl: `${env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj"}/login`,
      });
    } catch (mailErr) {
      console.error("Erreur lors de l'envoi du mail de bienvenue (non bloquant):", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès et notification envoyée.",
      user: newUser,
    });
  } catch (error: any) {
    console.error("Erreur création utilisateur:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
