import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";
import { sendPasswordChangedAlert } from "@/lib/services/email";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/reset-password
 * Réinitialisation effective du mot de passe avec validation du token SHA-256
 */
export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (max 5 tentatives / 15 min)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitKey = `reset_password:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Trop de tentatives. Veuillez patienter 15 minutes avant de réessayer.",
        },
        { status: 429 }
      );
    }

    // 2. Validation du payload avec strongPasswordSchema
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // 3. Calcul du hash SHA-256 du jeton reçu
    const tokenHash = crypto
      .createHash("sha256")
      .update(validatedData.token.trim())
      .digest("hex");

    // 4. Recherche et vérification de validité du token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "Ce lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande.",
        },
        { status: 400 }
      );
    }

    // 5. Recherche de l'utilisateur associé
    const user = await prisma.user.findUnique({
      where: { email: resetRecord.email },
      select: { id: true, email: true, firstName: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Compte utilisateur introuvable." },
        { status: 404 }
      );
    }

    // 6. Hachage sécurisé du nouveau mot de passe (bcrypt 10 rounds)
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // 7. Mise à jour de l'utilisateur et suppression immédiate du token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      }),
    ]);

    // 8. Envoi de l'alerte de sécurité par email
    try {
      await sendPasswordChangedAlert({
        email: user.email,
        firstName: user.firstName,
      });
    } catch (mailErr) {
      console.error("Erreur envoi alerte sécurité (non bloquant):", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      const messages = error.errors.map((e: any) => e.message).join(", ");
      return NextResponse.json(
        { success: false, message: `Exigences non respectées : ${messages}` },
        { status: 400 }
      );
    }

    console.error("Erreur reset-password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la réinitialisation du mot de passe.",
      },
      { status: 500 }
    );
  }
}
