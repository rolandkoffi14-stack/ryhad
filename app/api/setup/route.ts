import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setupAdminSchema } from "@/lib/validations";
import { StaffRole } from "@prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/setup
 * Vérifie si le CRM nécessite une initialisation initiale (0 utilisateur en BDD)
 */
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      success: true,
      isSetupNeeded: userCount === 0,
      userCount,
    });
  } catch (error) {
    console.error("Erreur vérification statut setup:", error);
    return NextResponse.json(
      { success: false, message: "Impossible de vérifier le statut d'initialisation." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/setup
 * Crée l'administrateur unique initial du CRM
 * Verrouillé définitivement dès que le 1er utilisateur est créé.
 */
export async function POST(request: Request) {
  try {
    // 0. Limitation de débit anti-bruteforce (5 requêtes / 15 min par IP)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`setup_${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de tentatives d'initialisation. Veuillez patienter 15 minutes." },
        { status: 429 }
      );
    }

    // 1. Vérification atomique de sécurité : aucun utilisateur ne doit exister
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Accès refusé : Le CRM a déjà été initialisé. Veuillez vous connecter.",
        },
        { status: 403 }
      );
    }


    // 2. Validation stricte du schéma
    const body = await request.json();
    const validatedData = setupAdminSchema.parse(body);

    // 3. Hachage sécurisé du mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // 4. Création de l'Administrateur unique
    const adminUser = await prisma.user.create({
      data: {
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        email: validatedData.email.trim().toLowerCase(),
        phone: validatedData.phone?.trim() || null,
        passwordHash,
        role: StaffRole.ADMIN,
        assignableAsTechnician: validatedData.assignableAsTechnician ?? true,
        isActive: true,
      },
    });

    // 5. Envoi du mail de bienvenue avec ses accès
    try {
      const { sendWelcomeUserEmail } = await import("@/lib/services/email");
      const { env } = await import("@/lib/env");
      await sendWelcomeUserEmail({
        email: adminUser.email,
        firstName: adminUser.firstName,
        role: adminUser.role,
        temporaryPassword: validatedData.password,
        loginUrl: `${env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj"}/login`,
      });
    } catch (mailErr) {
      console.error("Erreur lors de l'envoi du mail de bienvenue admin (non bloquant):", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Administrateur initial créé avec succès ! Vous pouvez maintenant vous connecter.",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      const messages = error.errors.map((e: any) => e.message).join(", ");
      return NextResponse.json(
        { success: false, message: `Données invalides : ${messages}` },
        { status: 400 }
      );
    }

    console.error("Erreur lors du setup initial de l'admin:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de l'initialisation du compte administrateur.",
      },
      { status: 500 }
    );
  }
}
