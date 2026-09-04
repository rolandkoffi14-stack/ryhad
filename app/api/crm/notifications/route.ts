import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/crm/notifications — Récupère les notifications paginées de l'utilisateur connecté
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({
        where: { userId: session.user.id },
      }),
      db.notification.count({
        where: { userId: session.user.id, estLu: false },
      }),
    ]);

    const hasMore = skip + notifications.length < totalCount;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      totalCount,
      page,
      hasMore,
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
