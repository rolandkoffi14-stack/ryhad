import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-slate flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 text-center space-y-6 shadow-xl">
        <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto p-1.5 shadow-md border border-gray-100">
          <Image
            src="/images/logo.jpg"
            alt="RyHaD Tic-Medic Logo"
            width={80}
            height={80}
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold text-brand-blue uppercase tracking-widest block">
            Erreur 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Page introuvable
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Le document, le ticket ou la page que vous recherchez n&apos;existe pas ou a été déplacé.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-5 py-3 rounded-xl text-xs font-bold shadow transition-all"
          >
            <Home className="w-4 h-4 text-brand-green" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-brand-slate hover:bg-gray-200 text-brand-dark px-5 py-3 rounded-xl text-xs font-bold transition-all border border-gray-200"
          >
            <span>Nous contacter</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
