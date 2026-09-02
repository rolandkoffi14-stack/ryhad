import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientFormSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ success: false, message: error.message || "Erreur serveur" }, { status: 400 });
  }
}
