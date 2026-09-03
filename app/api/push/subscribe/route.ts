import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url("Endpoint URL invalide"),
  keys: z.object({
    p256dh: z.string().min(1, "Clé p256dh obligatoire"),
    auth: z.string().min(1, "Clé auth obligatoire"),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentification requise." }, { status: 401 });
    }

    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    const subscription = await db.pushSubscription.upsert({
      where: { endpoint: validated.endpoint },
      update: {
        userId: session.user.id,
        p256dh: validated.keys.p256dh,
        auth: validated.keys.auth,
      },
      create: {
        userId: session.user.id,
        endpoint: validated.endpoint,
        p256dh: validated.keys.p256dh,
        auth: validated.keys.auth,
      },
    });

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (error: any) {
    console.error("Erreur enregistrement PushSubscription:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Erreur enregistrement souscription push." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentification requise." }, { status: 401 });
    }

    const body = await request.json();
    const endpoint = body?.endpoint;

    if (endpoint) {
      await db.pushSubscription.deleteMany({
        where: {
          endpoint,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Souscription révoquée." });
  } catch (error: any) {
    console.error("Erreur suppression PushSubscription:", error);
    return NextResponse.json({ success: false, message: "Erreur suppression souscription." }, { status: 500 });
  }
}
