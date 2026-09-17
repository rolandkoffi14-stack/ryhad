import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientFormSchema } from "@/lib/validations";
import { StaffRole } from "@prisma/client";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role as StaffRole;
    if (role === StaffRole.TECHNICIEN) {
      return NextResponse.json(
        { success: false, message: "Action réservée à la réception ou à la direction." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = clientFormSchema.parse(body);

    // 1. Vérifier si un client existe déjà avec ce numéro de téléphone
    const existingByPhone = await db.client.findUnique({
      where: { telephone: validated.telephone },
    });
    if (existingByPhone) {
      return NextResponse.json(
        {
          success: false,
          message: `Un client existe déjà avec ce numéro de téléphone : "${existingByPhone.nom}" (${existingByPhone.telephone}).`,
        },
        { status: 409 }
      );
    }

    // 2. Vérifier si un client existe déjà avec cet email (si renseigné)
    if (validated.email) {
      const existingByEmail = await db.client.findUnique({
        where: { email: validated.email },
      });
      if (existingByEmail) {
        return NextResponse.json(
          {
            success: false,
            message: `Un client existe déjà avec cette adresse email : "${existingByEmail.nom}" (${existingByEmail.email}).`,
          },
          { status: 409 }
        );
      }
    }

    const client = await db.client.create({
      data: {
        type: validated.type,
        nom: validated.nom.trim(),
        contactNom: validated.contactNom ? validated.contactNom.trim() : null,
        telephone: validated.telephone,
        email: validated.email || null,
        adresse: validated.adresse ? validated.adresse.trim() : null,
      },
    });

    broadcastCrmEvent("client:updated", client.id);

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création client:", error);
    if (error.name === "ZodError") {
      const firstMsg = error.errors?.[0]?.message || "Données du formulaire invalides";
      return NextResponse.json({ success: false, message: firstMsg, errors: error.errors }, { status: 400 });
    }
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const fieldStr = Array.isArray(target) ? target.join(", ") : String(target || "");
      const isPhone = fieldStr.includes("telephone");
      return NextResponse.json(
        {
          success: false,
          message: isPhone
            ? "Ce numéro de téléphone est déjà attribué à un autre client."
            : "Cette adresse email est déjà attribuée à un autre client.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création du client." },
      { status: 500 }
    );
  }
}
