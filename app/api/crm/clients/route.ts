import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientFormSchema } from "@/lib/validations";
import { StaffRole } from "@prisma/client";

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

    const client = await db.client.create({
      data: {
        type: validated.type,
        nom: validated.nom.trim(),
        contactNom: validated.contactNom ? validated.contactNom.trim() : null,
        telephone: validated.telephone.trim(),
        email: validated.email ? validated.email.trim() : null,
        adresse: validated.adresse ? validated.adresse.trim() : null,
      },
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création client:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de la création du client." },
      { status: 500 }
    );
  }
}
