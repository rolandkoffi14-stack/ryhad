"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/crm";
  const isSetupSuccess = searchParams.get("setup") === "success";
  const isResetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Identifiants incorrects ou compte désactivé. Veuillez vérifier votre email et mot de passe.");
        setLoading(false);
      } else {
        setIsSuccess(true);
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError("Une erreur inattendue est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Alertes de succès */}
      {isSetupSuccess && (
        <div className="p-4 rounded-2xl bg-brand-green/10 border border-brand-green/30 text-brand-green-dark text-xs flex items-start gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-green" />
          <span>
            <strong>Initialisation réussie !</strong> Votre compte Administrateur est prêt. Connectez-vous ci-dessous.
          </span>
        </div>
      )}

      {isResetSuccess && (
        <div className="p-4 rounded-2xl bg-brand-green/10 border border-brand-green/30 text-brand-green-dark text-xs flex items-start gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-green" />
          <span>
            <strong>Mot de passe modifié !</strong> Vous pouvez désormais vous connecter avec votre nouveau mot de passe.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-200 subtle-shadow space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Adresse Email *</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700">Mot de Passe *</label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-[11px] font-bold text-brand-blue hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isSuccess}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md transition-all disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSuccess ? (
            <>
              <ShieldCheck className="w-4 h-4 text-brand-green animate-bounce" />
              <span>Connexion réussie ! Chargement de l&apos;atelier...</span>
            </>
          ) : loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Vérification des identifiants...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-brand-green" />
              <span>Accéder à l&apos;Espace CRM Atelier</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
