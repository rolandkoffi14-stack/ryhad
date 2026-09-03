import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ArrowLeft, KeyRound } from "lucide-react";

export const metadata = {
  title: "Mot de passe oublié | RyHaD Tic-Medic",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-brand-slate flex flex-col justify-between p-4 sm:p-8">
      {/* Header Retour */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la connexion</span>
        </Link>
      </div>

      {/* Formulaire Central */}
      <div className="max-w-md mx-auto w-full space-y-6 my-auto">
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto p-1.5 shadow-md border border-gray-100">
            <Image
              src="/images/logo.jpg"
              alt="RyHaD Tic-Medic Logo"
              width={80}
              height={80}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
              Mot de Passe Oublié
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Récupération sécurisée d&apos;accès staff (RyHaD Tic-Medic)
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Chargement...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-[11px] text-gray-400">
        RyHaD Tic-Medic • Gbégamey, Cotonou, Bénin • +229 01 90 88 13 14
      </div>
    </div>
  );
}
