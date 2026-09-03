"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export function SetupForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [assignableAsTechnician, setAssignableAsTechnician] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Analyse des critères de robustesse du mot de passe
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

    if (!isPasswordValid) {
      setError("Veuillez respecter toutes les exigences de sécurité pour le mot de passe.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || null,
          password,
          assignableAsTechnician,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Échec de l'initialisation du compte.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?setup=success");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-green/30 subtle-shadow text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-extrabold text-brand-dark">Compte Administrateur Créé !</h2>
        <p className="text-xs text-gray-600">
          Votre compte principal a été initialisé avec succès. Redirection vers la page de connexion en cours...
        </p>
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mt-4" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-200 subtle-shadow space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Prénom *</label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Nom *</label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Numéro de Téléphone</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              placeholder="Numéro de téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Mot de Passe Sécurisé *</label>
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

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirmer le Mot de Passe *</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Indicateurs de force */}
        <div className="bg-brand-slate p-3.5 rounded-2xl space-y-2 border border-gray-200">
          <p className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            <span>Exigences de robustesse du mot de passe :</span>
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
              <span>Un symbole spécial (@, #, $, !...)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${passwordCriteria.match ? "text-brand-green font-bold" : "text-gray-400"}`}>
              {passwordCriteria.match ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Correspondance des mots de passe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <input
          type="checkbox"
          id="assignable"
          checked={assignableAsTechnician}
          onChange={(e) => setAssignableAsTechnician(e.target.checked)}
          className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue border-gray-300 cursor-pointer"
        />
        <label htmlFor="assignable" className="text-xs text-gray-700 cursor-pointer select-none">
          <strong className="text-brand-dark">Pouvoir s&apos;assigner des interventions d&apos;atelier</strong> (permet à l&apos;Admin d&apos;effectuer également des diagnostics techniques).
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !isPasswordValid || !passwordCriteria.match}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Initialisation du CRM en cours...</span>
          </>
        ) : (
          <>
            <span>Créer l&apos;Administrateur et Initialiser le CRM</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
