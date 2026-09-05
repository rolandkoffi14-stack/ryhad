"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function PwaSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Vérifier si l'écran de démarrage a déjà été affiché dans cette session
    const hasSeenSplash = sessionStorage.getItem("ryhad_splash_seen");
    
    // Détecter si l'application s'exécute en mode standalone (PWA installée sur mobile/PC)
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://"));

    // Détecter un affichage mobile
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

    // Ne pas encombrer la navigation sur navigateur desktop classique
    if (!isStandalone && !isMobile) {
      setIsVisible(false);
      return;
    }

    if (hasSeenSplash && !isStandalone) {
      setIsVisible(false);
      return;
    }

    sessionStorage.setItem("ryhad_splash_seen", "true");

    // Laisse un temps d'affichage suffisant pour un rendu soigné (650ms), puis fondu doux
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 400); // Durée de la transition d'opacité
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-white px-6 py-12 select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F4F6F8 100%)",
      }}
    >
      {/* Zone supérieure vide pour centrage optique */}
      <div className="w-full h-8" />

      {/* Centre : Logo, Marque & Indicateur de chargement */}
      <div className="flex flex-col items-center text-center max-w-xs space-y-6">
        {/* Conteneur Logo avec ombre douce et pulsation discrète */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-blue/20 to-brand-green/20 rounded-3xl blur-md animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-3 shadow-xl border border-slate-100 flex items-center justify-center">
            <Image
              src="/images/logo.webp"
              alt="RyHaD Tic-Medic"
              width={96}
              height={96}
              priority
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Titre & Sous-titre */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              RyHaD
            </span>
            <span className="text-xs font-extrabold bg-brand-blue text-white px-2 py-0.5 rounded-lg shadow-xs">
              CRM
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Maintenance & Solutions Tech — Cotonou
          </p>
        </div>

        {/* Barre de progression animée ultra-moderne */}
        <div className="w-48 pt-3 space-y-2">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-brand-blue via-brand-green to-brand-blue rounded-full animate-progress"
              style={{
                width: "100%",
                backgroundSize: "200% 100%",
              }}
            />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chargement de l&apos;application...
          </p>
        </div>
      </div>

      {/* Pied de page : Sécurisé & Professionnel */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-semibold text-slate-400">
          Système Sécurisé • RyHaD Tic-Medic
        </p>
        <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
          <span>Prêt pour utilisation hors-ligne & mobile</span>
        </div>
      </div>
    </div>
  );
}
