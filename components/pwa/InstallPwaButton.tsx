"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, CheckCircle2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/crm/ConfirmationModal";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface Props {
  className?: string;
  variant?: "crm-header" | "public-header" | "public-topbar" | "footer" | "mobile-drawer";
  label?: string;
}

export function InstallPwaButton({
  className = "",
  variant = "crm-header",
  label,
}: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Vérifier si l'app est déjà en mode PWA autonome
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Détection du système d'exploitation
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    setIsIos(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Capturer l'événement natif beforeinstallprompt (Chromium, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Si l'application est déjà installée et ouverte en standalone, ne pas afficher le bouton
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    // Cas 1 : L'événement natif est disponible (Chrome, Edge, Samsung Internet, etc.)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Erreur lors de l'installation PWA:", err);
      }
      return;
    }

    // Cas 2 : iOS Safari ou navigateurs desktop sans déclencheur natif -> Ouvrir le guide explicatif
    setShowGuideModal(true);
  };

  // Styles par variante
  const getButtonStyles = () => {
    if (className) return className;

    switch (variant) {
      case "public-topbar":
        return "inline-flex items-center gap-1.5 text-xs text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer";
      case "public-header":
        return "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-blue/30 bg-brand-blue/5 hover:bg-brand-blue hover:text-white text-brand-blue text-xs font-bold transition-all shadow-2xs cursor-pointer";
      case "mobile-drawer":
        return "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-brand-blue/30 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue hover:text-white text-xs font-bold transition-all cursor-pointer";
      case "footer":
        return "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer";
      case "crm-header":
      default:
        return "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white text-xs font-bold transition-all border border-brand-blue/20 shadow-2xs cursor-pointer";
    }
  };

  const getButtonLabel = () => {
    if (label) return label;
    if (variant === "public-topbar") return "Installer l'app";
    if (variant === "footer") return "Installer l'application RyHaD";
    return "Installer l'application";
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Installer l'application RyHaD sur votre appareil"
        className={getButtonStyles()}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className={variant === "crm-header" ? "hidden sm:inline" : ""}>
          {getButtonLabel()}
        </span>
      </button>

      {/* Guide explicatif selon l'appareil si l'installation automatique n'est pas supportée nativement */}
      <ConfirmationModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onConfirm={() => setShowGuideModal(false)}
        title={
          isIos
            ? "Installer l'application sur iPhone / iPad"
            : isAndroid
            ? "Installer l'application sur Android"
            : "Installer l'application sur votre Ordinateur"
        }
        message={
          <div className="space-y-3 text-xs text-gray-600">
            {isIos ? (
              <>
                <div className="flex items-center gap-2 text-brand-blue font-bold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Ajouter à l&apos;écran d&apos;accueil (Safari iOS)</span>
                </div>
                <p>Apple ne permet pas l&apos;installation automatique en 1 clic. Suivez ces 3 étapes rapides :</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-gray-700">
                  <li>
                    Touchez l&apos;icône de <strong>Partage</strong> en bas de Safari (carré avec flèche vers le haut).
                  </li>
                  <li>
                    Faites défiler le menu et touchez <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
                  </li>
                  <li>
                    Touchez <strong>« Ajouter »</strong> en haut à droite.
                  </li>
                </ol>
              </>
            ) : isAndroid ? (
              <>
                <div className="flex items-center gap-2 text-brand-blue font-bold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Ajouter à l&apos;écran d&apos;accueil (Android)</span>
                </div>
                <p>Pour installer l&apos;application sans passer par le store :</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-gray-700">
                  <li>
                    Ouvrez le menu de votre navigateur (<strong>les 3 points</strong> en haut à droite).
                  </li>
                  <li>
                    Touchez <strong>« Installer l&apos;application »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
                  </li>
                  <li>Confirmez pour retrouver l&apos;icône RyHaD sur votre téléphone.</li>
                </ol>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-brand-blue font-bold">
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span>Installation sur PC / Mac</span>
                </div>
                <p>RyHaD peut s&apos;installer comme une application autonome sur votre bureau :</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-gray-700">
                  <li>
                    Dans la barre d&apos;adresse de votre navigateur (Chrome ou Edge), repérez l&apos;icône d&apos;ordinateur avec une petite flèche vers le bas à droite.
                  </li>
                  <li>
                    Cliquez sur <strong>« Installer »</strong>.
                  </li>
                  <li>
                    L&apos;application s&apos;ouvrira dans sa propre fenêtre indépendante avec accès direct.
                  </li>
                </ol>
              </>
            )}
          </div>
        }
        confirmLabel="J'ai compris"
        cancelLabel="Fermer"
        variant="info"
      />
    </>
  );
}
