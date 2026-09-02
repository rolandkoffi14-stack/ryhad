import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commercialRequestSchema } from "@/lib/validations";
import { sendCommercialNotification } from "@/lib/services/email";
import { DemandeStatut, ClientType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = commercialRequestSchema.parse(body);

    // 1. Rechercher ou créer le client
    let client = await db.client.findFirst({
      where: {
        telephone: validatedData.telephone.trim(),
      },
    });

    if (!client) {
      client = await db.client.create({
        data: {
          type: validatedData.entreprise ? ClientType.ENTREPRISE : ClientType.PARTICULIER,
          nom: validatedData.entreprise
            ? `${validatedData.entreprise.trim()} (${validatedData.nom.trim()})`
            : validatedData.nom.trim(),
          contactNom: validatedData.entreprise ? validatedData.nom.trim() : null,
          telephone: validatedData.telephone.trim(),
          email: validatedData.email ? validatedData.email.trim() : null,
        },
      });
    }

    // 2. Créer la demande commerciale séparée (modèle DemandeCommerciale)
    const demande = await db.demandeCommerciale.create({
      data: {
        clientId: client.id,
        typeDemande: validatedData.typeDemande,
        description: validatedData.description.trim(),
        statut: DemandeStatut.NOUVEAU,
      },
    });

    // 3. Envoi de notification email à l'atelier
    sendCommercialNotification({
      nom: validatedData.nom,
      telephone: validatedData.telephone,
      email: validatedData.email,
      typeDemande: validatedData.typeDemande,
      description: validatedData.description,
    }).catch((err) => console.error("Commercial email error:", err));

    return NextResponse.json(
      {
        success: true,
        id: demande.id,
        message: "Votre demande commerciale a bien été enregistrée. Notre service vous contactera sous 24h.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur création demande commerciale:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de l'enregistrement de votre demande." },
      { status: 500 }
    );
  }
}
