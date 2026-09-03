import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { env } from "@/lib/env";

/**
 * POST /api/crm/utilisateurs/[id]/send-access
 * Envoie un email d'accès / lien de réinitialisation sécurisé à un collaborateur (Admin seulement)
 */
export async function POST(
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

    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Collaborateur introuvable." },
        { status: 404 }
      );
    }

    if (!targetUser.isActive) {
      return NextResponse.json(
        { success: false, message: "Impossible d'envoyer un accès à un compte désactivé." },
        { status: 400 }
      );
    }

    // 1. Génération d'un token sécurisé
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Invalider les anciens tokens de cet email
    await db.passwordResetToken.deleteMany({
      where: { email: targetUser.email },
    });

    // Créer le nouveau token
    await db.passwordResetToken.create({
      data: {
        email: targetUser.email,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj";
    const resetUrl = `${appUrl}/reinitialisation-mot-de-passe?token=${rawToken}`;

    // 2. Envoi de l'email
    const mailResult = await sendPasswordResetEmail({
      email: targetUser.email,
      firstName: targetUser.firstName,
      resetUrl,
    });

    if (!mailResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "L'envoi de l'email a échoué. Vérifiez la configuration Resend et le domaine d'envoi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email d'accès envoyé avec succès à ${targetUser.email}.`,
    });
  } catch (error: any) {
    console.error("Erreur envoi accès collaborateur:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
