"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CrmEventPayload } from "@/lib/realtime/eventBus";

interface CrmRealtimeContextType {
  isConnected: boolean;
  lastEvent: CrmEventPayload | null;
  refreshNow: () => void;
}

const CrmRealtimeContext = createContext<CrmRealtimeContextType>({
  isConnected: false,
  lastEvent: null,
  refreshNow: () => {},
});

export const useCrmRealtime = () => useContext(CrmRealtimeContext);

export function CrmRealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<CrmEventPayload | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Déclenche un rafraîchissement Server Component propre et débouncé
  const triggerDebouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      router.refresh();
    }, 400);
  }, [router]);

  useEffect(() => {
    let isUnmounted = false;

    function connectSSE() {
      if (isUnmounted) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource("/api/crm/realtime");
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isUnmounted) {
            setIsConnected(true);
          }
        };

        es.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data: CrmEventPayload = JSON.parse(event.data);
            setLastEvent(data);

            // Diffuser l'événement sur window pour les composants spécifiques (ex: cloche de notifications)
            window.dispatchEvent(
              new CustomEvent("crm:realtime-event", { detail: data })
            );

            // Rafraîchir les données de la page actuelle dans le CRM
            triggerDebouncedRefresh();
          } catch (err) {
            // Message non-JSON (ex: ping/pong)
          }
        };

        es.onerror = () => {
          if (!isUnmounted) {
            setIsConnected(false);
          }
          es.close();

          // Tentative de reconnexion automatique après 4 secondes
          if (!isUnmounted) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, 4000);
          }
        };
      } catch (err) {
        console.error("Erreur initialisation SSE CRM:", err);
      }
    }

    connectSSE();

    // 2. Revalidation intelligente dès que l'utilisateur revient sur l'onglet ou réactive la fenêtre
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerDebouncedRefresh();
        // S'assurer que le socket SSE est bien vivant au retour de veille
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connectSSE();
        }
      }
    };

    const handleWindowFocus = () => {
      triggerDebouncedRefresh();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isUnmounted = true;
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [triggerDebouncedRefresh]);

  return (
    <CrmRealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        refreshNow: triggerDebouncedRefresh,
      }}
    >
      {children}
    </CrmRealtimeContext.Provider>
  );
}
