"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscriptionManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Enregistrement du Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        })
        .catch((err) => {
          console.error("Erreur enregistrement SW push:", err);
        });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        console.warn("Clé publique VAPID non disponible côté client.");
        setLoading(false);
        return;
      }

      // Demande de permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // Souscription Push
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Envoi de la souscription à notre API
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (res.ok) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Erreur lors de la souscription push:", error);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });

        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Erreur désinscription push:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="px-3 py-2 bg-brand-slate/80 rounded-xl border border-gray-100 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <Check className="w-4 h-4 text-brand-green" />
        ) : (
          <Bell className="w-4 h-4 text-brand-blue" />
        )}
        <span className="text-gray-700 font-medium">
          {isSubscribed ? "Notifications activées sur cet appareil" : "Activer les notifications sur cet appareil"}
        </span>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
          isSubscribed
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-brand-blue text-white hover:bg-brand-blue-dark shadow-sm"
        }`}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {!loading && isSubscribed && <BellOff className="w-3.5 h-3.5" />}
        {!loading && !isSubscribed && <Bell className="w-3.5 h-3.5" />}
        <span>{isSubscribed ? "Désactiver" : "Activer"}</span>
      </button>
    </div>
  );
}
