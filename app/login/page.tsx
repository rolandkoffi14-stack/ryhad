import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LoginForm } from "@/components/auth/LoginForm";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Connexion Staff & CRM",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/setup");
  }
  return (
    <div className="min-h-screen bg-brand-slate flex flex-col justify-between p-4 sm:p-8">
      {/* Header Retour */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au site vitrine</span>
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
              RyHaD Tic-Medic
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Espace d&apos;administration & outil de gestion d&apos;atelier (Gbégamey, Cotonou)
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-[11px] text-gray-400">
        RyHaD Tic-Medic • +229 01 90 88 13 14 • ryhadticmedic@gmail.com
      </div>
    </div>
  );
}
