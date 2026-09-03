import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/crm/notifications/[id] — Marque une notification spécifique comme lue
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Notification introuvable" }, { status: 404 });
    }

    const updated = await db.notification.update({
      where: { id },
      data: { estLu: true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Erreur mise à jour notification:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/crm/notifications/[id] — Supprime une notification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Notification introuvable" }, { status: 404 });
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Notification supprimée" });
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
