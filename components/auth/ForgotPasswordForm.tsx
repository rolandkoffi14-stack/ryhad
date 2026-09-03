"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 200) {
        throw new Error(data.message || "Erreur lors de la demande de réinitialisation.");
      }

      setIsSubmitted(true);
      setServerMessage(
        data.message ||
          "Si un compte actif est associé à cette adresse email, un lien sécurisé de réinitialisation vous a été envoyé."
      );
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-green/30 subtle-shadow text-center space-y-5 animate-fade-in">
        <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-extrabold text-brand-dark">Vérifiez votre boîte de réception</h2>
          <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
            {serverMessage}
          </p>
          <p className="text-[11px] text-gray-400">
            Le lien est valable pendant <strong>30 minutes</strong>. Pensez à vérifier vos courriers indésirables / spams.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la page de connexion</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-200 subtle-shadow space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Adresse Email Staff *</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            required
            placeholder="ex: admin@ryhad.bj"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          Saisissez l&apos;adresse email associée à votre compte collaborateur RyHaD.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md transition-all disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Envoi de la demande...</span>
          </>
        ) : (
          <>
            <span>Envoyer le lien de réinitialisation</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center pt-2 border-t border-gray-100">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la connexion</span>
        </Link>
      </div>
    </form>
  );
}
