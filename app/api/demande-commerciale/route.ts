import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commercialRequestSchema } from "@/lib/validations";
import { notifyNewCommercialRequestToStaff } from "@/lib/services/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DemandeStatut, ClientType } from "@prisma/client";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

export async function POST(request: Request) {
  try {
    // 0. Limitation de débit anti-flood (5 requêtes / minute par IP)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`commercial_${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de requêtes. Veuillez patienter une minute avant de soumettre une nouvelle demande." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = commercialRequestSchema.parse(body);

    // 1. Rechercher le client par téléphone (normalisé) ou par email
    let client = await db.client.findUnique({
      where: {
        telephone: validatedData.telephone,
      },
    });

    if (!client && validatedData.email) {
      client = await db.client.findUnique({
        where: {
          email: validatedData.email,
        },
      });
    }

    if (!client) {
      client = await db.client.create({
        data: {
          type: validatedData.entreprise ? ClientType.ENTREPRISE : ClientType.PARTICULIER,
          nom: validatedData.entreprise
            ? `${validatedData.entreprise.trim()} (${validatedData.nom.trim()})`
            : validatedData.nom.trim(),
          contactNom: validatedData.entreprise ? validatedData.nom.trim() : null,
          telephone: validatedData.telephone,
          email: validatedData.email || null,
        },
      });
    } else if (!client.email && validatedData.email) {
      try {
        client = await db.client.update({
          where: { id: client.id },
          data: { email: validatedData.email },
        });
      } catch {
        // En cas de conflit d'email concurrent, ne pas bloquer la demande
      }
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

    // 3. Envoi des notifications In-App + Web Push + Email aux administrateurs et réceptionnistes
    notifyNewCommercialRequestToStaff({
      id: demande.id,
      nom: validatedData.nom,
      telephone: validatedData.telephone,
      typeDemande: validatedData.typeDemande,
      description: validatedData.description,
    }).catch((err) => console.error("Commercial notification error:", err));

    broadcastCrmEvent("demande:created", demande.id);

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
      const firstMsg = error.errors?.[0]?.message || "Données du formulaire invalides";
      return NextResponse.json({ success: false, message: firstMsg, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de l'enregistrement de votre demande." },
      { status: 500 }
    );
  }
}
