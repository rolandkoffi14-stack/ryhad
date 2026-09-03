import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";
import { sendContactNotification } from "@/lib/services/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // 0. Limitation de débit anti-flood (5 requêtes / minute par IP)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`contact_${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Trop de requêtes. Veuillez patienter une minute avant d'envoyer un nouveau message.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);

    // 1. Envoi de l'email vers l'adresse officielle de l'entreprise (NOTIFICATION_EMAIL dans .env)
    const emailResult = await sendContactNotification({
      nom: validatedData.nom.trim(),
      telephone: validatedData.telephone.trim(),
      email: validatedData.email ? validatedData.email.trim() : null,
      sujet: validatedData.sujet.trim(),
      message: validatedData.message.trim(),
    });

    if (!emailResult.success) {
      console.warn("Avertissement : Erreur lors de l'envoi de l'email via Resend", emailResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Votre message a été transmis avec succès à l'équipe RyHaD Tic-Medic. Nous vous répondrons dans les plus brefs délais.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur traitement formulaire de contact:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ou nous joindre par téléphone / WhatsApp.",
      },
      { status: 500 }
    );
  }
}
