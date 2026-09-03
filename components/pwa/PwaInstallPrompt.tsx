"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Vérifier si l'application est déjà lancée en mode PWA autonome
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // Détecter iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Écouter l'événement standard d'installation PWA (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Vérifier si l'utilisateur n'a pas fermé la bannière récemment (localStorage)
      const dismissedUntil = localStorage.getItem("ryhad_pwa_dismissed");
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setShowBanner(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
      console.log("PWA RyHaD installée avec succès !");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        alert(
          "Pour installer l'application sur iPhone/iPad :\n1. Touchez l'icône de Partage en bas de Safari (carré avec flèche vers le haut)\n2. Faites défiler et touchez 'Sur l'écran d'accueil'\n3. Touchez 'Ajouter'"
        );
      }
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Masquer pendant 3 jours
    localStorage.setItem("ryhad_pwa_dismissed", String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Toast de succès après installation */}
      {installedSuccess && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-brand-green text-white rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Application RyHaD installée avec succès sur votre appareil !</span>
        </div>
      )}

      {/* Bannière d'invitation à l'installation */}
      {showBanner && isInstallable && (
        <aside
          aria-label="Invitation d'installation de l'application"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 bg-white/95 backdrop-blur-md border border-brand-blue/20 rounded-2xl p-4 shadow-2xl transition-all animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-brand-blue" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-extrabold text-brand-dark">
                Installer l&apos;application RyHaD
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5 font-medium leading-relaxed">
                Accédez à votre espace en 1 clic depuis votre écran d&apos;accueil avec suivi et alertes push instantanées.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-brand-green" />
                  <span>Installer maintenant</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-gray-700 text-[11px] font-medium transition-all"
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              title="Fermer"
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
