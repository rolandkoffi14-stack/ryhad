import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe sécurisée
 * Rate limit strict (3 req / 15 min), token SHA-256 à usage unique de 30 min, réponse uniforme.
 */
export async function POST(request: Request) {
  try {
    // 1. Rate Limiting par IP & Action (max 3 requêtes / 15 min)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitKey = `forgot_password:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      limit: 3,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Trop de tentatives de réinitialisation. Veuillez patienter 15 minutes avant de réessayer.",
        },
        { status: 429 }
      );
    }

    // 2. Validation de l'adresse email
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);
    const email = validatedData.email.trim().toLowerCase();

    // 3. Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, isActive: true },
    });

    // 4. Si l'utilisateur existe et est actif, générer un token sécurisé
    if (user && user.isActive) {
      // Générer un jeton cryptographique aléatoire de 32 octets (64 caractères hex)
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Hacher le jeton en SHA-256 pour stockage en BDD
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Expiration dans 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Invalider les anciens tokens de cet email
      await prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      });

      // Enregistrer le nouveau token haché
      await prisma.passwordResetToken.create({
        data: {
          email: user.email,
          tokenHash,
          expiresAt,
        },
      });

      // Construction du lien sécurisé
      const appUrl = env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj";
      const resetUrl = `${appUrl}/reinitialisation-mot-de-passe?token=${rawToken}`;

      // Envoi de l'email transactionnel
      await sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        resetUrl,
      });
    }

    // 5. Réponse UNIFORME anti-énumération
    return NextResponse.json({
      success: true,
      message:
        "Si un compte actif est associé à cette adresse email, un lien sécurisé de réinitialisation vient de vous être envoyé. Vérifiez votre boîte de réception.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Format d'adresse email invalide." },
        { status: 400 }
      );
    }

    console.error("Erreur forgot-password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors du traitement de votre demande.",
      },
      { status: 500 }
    );
  }
}
