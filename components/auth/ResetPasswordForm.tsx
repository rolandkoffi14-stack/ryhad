"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 10,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
      match: password.length > 0 && password === confirmPassword,
    };
  }, [password, confirmPassword]);

  const isPasswordValid =
    passwordCriteria.length &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Jeton de réinitialisation manquant. Veuillez recliquer sur le lien reçu par email.");
      return;
    }

    if (!isPasswordValid) {
      setError("Veuillez respecter l'ensemble des exigences de robustesse du mot de passe.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de la réinitialisation du mot de passe.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-red/30 subtle-shadow text-center space-y-4">
        <div className="w-14 h-14 bg-brand-red-light text-brand-red rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-extrabold text-brand-dark">Lien Invalide ou Manquant</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Ce lien de réinitialisation ne contient pas de jeton valide. Veuillez refaire une demande de mot de passe oublié.
        </p>
        <div className="pt-2">
          <Link
            href="/mot-de-passe-oublie"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Refaire une demande de réinitialisation</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-green/30 subtle-shadow text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-extrabold text-brand-dark">Mot de Passe Réinitialisé !</h2>
        <p className="text-xs text-gray-600">
          Votre mot de passe a été mis à jour avec succès. Redirection vers la page de connexion...
        </p>
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mt-4" />
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
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Nouveau Mot de Passe *</label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirmer le Nouveau Mot de Passe *</label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>
      </div>

      {/* Critères de complexité */}
      <div className="bg-brand-slate p-3.5 rounded-2xl space-y-2 border border-gray-200">
        <p className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
          <span>Exigences de robustesse :</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
          <div className={`flex items-center gap-1.5 ${passwordCriteria.length ? "text-brand-green font-bold" : "text-gray-400"}`}>
            {passwordCriteria.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Au moins 10 caractères</span>
          </div>
          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? "text-brand-green font-bold" : "text-gray-400"}`}>
            {passwordCriteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Une lettre majuscule</span>
          </div>
          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? "text-brand-green font-bold" : "text-gray-400"}`}>
            {passwordCriteria.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Une lettre minuscule</span>
          </div>
          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-brand-green font-bold" : "text-gray-400"}`}>
            {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Un chiffre (0-9)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? "text-brand-green font-bold" : "text-gray-400"}`}>
            {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Un symbole spécial</span>
          </div>
          <div className={`flex items-center gap-1.5 ${passwordCriteria.match ? "text-brand-green font-bold" : "text-gray-400"}`}>
            {passwordCriteria.match ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Mots de passe identiques</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isPasswordValid || !passwordCriteria.match}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Mise à jour du mot de passe...</span>
          </>
        ) : (
          <>
            <span>Enregistrer le nouveau mot de passe</span>
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
          <span>Annuler et retourner à la connexion</span>
        </Link>
      </div>
    </form>
  );
}
