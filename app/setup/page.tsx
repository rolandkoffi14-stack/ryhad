import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SetupForm } from "@/components/auth/SetupForm";
import { ShieldCheck, ArrowLeft, Wrench } from "lucide-react";

export const metadata = {
  title: "Initialisation CRM",
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Vérification de sécurité côté serveur : si au moins 1 utilisateur existe, accès interdit -> redirection /login
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-brand-slate flex flex-col justify-between p-4 sm:p-8">
      {/* Header Retour */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au site public</span>
        </Link>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-blue bg-brand-blue-light px-2.5 py-1 rounded-full border border-brand-blue/20">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
          Initialisation Unique
        </span>
      </div>

      {/* Formulaire Central */}
      <div className="max-w-xl mx-auto w-full space-y-6 my-auto">
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
              Bienvenue sur RyHaD Tic-Medic
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Configurez dès maintenant votre compte <strong>Administrateur Principal</strong>. Cet écran ne sera plus jamais accessible une fois le compte créé.
            </p>
          </div>
        </div>

        <SetupForm />
      </div>

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full text-center text-[11px] text-gray-400">
        RyHaD Tic-Medic • Gbégamey, Cotonou, Bénin • +229 01 90 88 13 14
      </div>
    </div>
  );
}
