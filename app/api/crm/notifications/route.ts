import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/crm/notifications — Récupère les 30 dernières notifications de l'utilisateur connecté
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.notification.count({
        where: { userId: session.user.id, estLu: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/crm/notifications — Marque toutes les notifications de l'utilisateur comme lues
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: session.user.id, estLu: false },
      data: { estLu: true },
    });

    return NextResponse.json({ success: true, message: "Toutes les notifications ont été marquées comme lues." });
  } catch (error) {
    console.error("Erreur marquage global notifications:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
