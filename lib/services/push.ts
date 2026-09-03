import webpush from "web-push";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || env.VAPID_SUBJECT || "mailto:ryhadticmedic@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("Erreur initialisation VAPID web-push:", err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Envoie une notification Push Web native aux appareils enregistrés d'un ou plusieurs utilisateurs
 */
export async function sendWebPushToUsers(userIds: string[], payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log("[PUSH DEV MODE] Clés VAPID non configurées, push ignoré:", payload.title);
    return { success: false, reason: "VAPID_NOT_CONFIGURED" };
  }

  if (!userIds.length) return { success: true, count: 0 };

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    if (!subscriptions.length) {
      return { success: true, sent: 0 };
    }

    const stringifiedPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/crm",
      tag: payload.tag || "ryhad-notification",
      icon: payload.icon || "/images/logo.jpg",
      badge: payload.badge || "/images/logo.jpg",
      data: payload.data || {},
    });

    const deadSubscriptionIds: string[] = [];

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, stringifiedPayload);
      } catch (error: any) {
        // Si le token a expiré ou que l'utilisateur a désinstallé / révoqué la permission (HTTP 404 / 410)
        if (error.statusCode === 404 || error.statusCode === 410) {
          deadSubscriptionIds.push(sub.id);
        } else {
          console.error(`Erreur envoi push à l'endpoint ${sub.endpoint.slice(0, 30)}...:`, error.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    // Nettoyage automatique des endpoints expirés
    if (deadSubscriptionIds.length > 0) {
      await db.pushSubscription.deleteMany({
        where: { id: { in: deadSubscriptionIds } },
      });
    }

    return { success: true, sent: subscriptions.length - deadSubscriptionIds.length };
  } catch (error) {
    console.error("Erreur générale service Web Push:", error);
    return { success: false, error };
  }
}
