"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 heure (3600 secondes)
const CHECK_INTERVAL_MS = 15 * 1000; // Vérification toutes les 15 secondes
const STORAGE_KEY = "ryhad_last_activity";

export function AutoLogoutTimer() {
  const isLoggingOut = useRef(false);

  useEffect(() => {
    // Initialiser l'horodatage s'il n'existe pas encore
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    // Fonction d'enregistrement de l'activité utilisateur (throttled à 1x par seconde)
    let lastThrottledTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 1000) {
        lastThrottledTime = now;
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    };

    // Écouteurs d'événements pour détecter toute interaction
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Intervalle de vérification de l'inactivité
    const timer = setInterval(() => {
      if (isLoggingOut.current) return;

      const storedTime = localStorage.getItem(STORAGE_KEY);
      const lastActivity = storedTime ? parseInt(storedTime, 10) : Date.now();
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        isLoggingOut.current = true;
        localStorage.removeItem(STORAGE_KEY);
        // Déconnexion et redirection avec paramètre d'information
        signOut({ callbackUrl: "/login?reason=inactivity" });
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, []);

  return null;
}
