"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPwaHeaderButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || !isInstallable || !deferredPrompt) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      title="Installer l'application"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white text-xs font-bold transition-all border border-brand-blue/20 shadow-2xs cursor-pointer"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Installer l&apos;application</span>
    </button>
  );
}
