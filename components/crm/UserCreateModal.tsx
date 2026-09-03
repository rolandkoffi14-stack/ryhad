"use client";

import { useState, useMemo } from "react";
import {
  X,
  UserPlus,
  Mail,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { StaffRole } from "@prisma/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export function UserCreateModal({ isOpen, onClose, onUserCreated }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>(StaffRole.TECHNICIEN);
  const [assignableAsTechnician, setAssignableAsTechnician] = useState(true);
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Génération automatique d'un mot de passe fort
  const generateStrongPassword = () => {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*()_+";
    
    let pass = "";
    pass += uppers[Math.floor(Math.random() * uppers.length)];
    pass += uppers[Math.floor(Math.random() * uppers.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    
    // Mélange
    const shuffled = pass.split("").sort(() => 0.5 - Math.random()).join("");
    setPassword(shuffled);
  };

  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 10,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid =
    passwordCriteria.length &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  const handleRoleChange = (newRole: StaffRole) => {
    setRole(newRole);
    if (newRole === StaffRole.TECHNICIEN) {
      setAssignableAsTechnician(true);
    } else if (newRole === StaffRole.RECEPTIONNISTE) {
      setAssignableAsTechnician(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isPasswordValid) {
      setError("Le mot de passe doit respecter toutes les exigences de sécurité.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/crm/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || null,
          role,
          assignableAsTechnician,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de la création de l'utilisateur.");
      }

      setSuccessMessage("Collaborateur créé avec succès ! Un email avec ses accès lui a été transmis.");
      setTimeout(() => {
        setSuccessMessage(null);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setPassword("");
        onUserCreated();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-fade-in space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue-light text-brand-blue flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-brand-dark">Ajouter un Collaborateur</h3>
              <p className="text-xs text-gray-500">Création de compte staff et attribution de rôle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green-dark text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-green" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Prénom *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nom *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: DOSSOU"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Professionnel *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="j.dossou@ryhad.bj"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone Direct</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+229 97 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Rôle & Permissions *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange(StaffRole.TECHNICIEN)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === StaffRole.TECHNICIEN
                    ? "border-brand-green bg-brand-green-light/30 text-brand-green-dark ring-2 ring-brand-green/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Technicien</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Diagnostic & réparations atelier</p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange(StaffRole.RECEPTIONNISTE)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === StaffRole.RECEPTIONNISTE
                    ? "border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>Accueil</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Dépôts, encaissements, devis</p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange(StaffRole.ADMIN)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === StaffRole.ADMIN
                    ? "border-brand-blue bg-brand-blue-light/50 text-brand-blue ring-2 ring-brand-blue/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Accès total, contrats & compta</p>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">Mot de Passe Initial *</label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-[11px] font-bold text-brand-blue hover:text-brand-blue-dark inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Générer un mot de passe fort</span>
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue font-mono outline-none"
              />
            </div>

            <div className="bg-brand-slate p-2.5 rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className={`flex items-center gap-1 ${passwordCriteria.length ? "text-brand-green font-bold" : "text-gray-400"}`}>
                  {passwordCriteria.length ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Min. 10 caractères</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.hasUpper ? "text-brand-green font-bold" : "text-gray-400"}`}>
                  {passwordCriteria.hasUpper ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Une majuscule</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? "text-brand-green font-bold" : "text-gray-400"}`}>
                  {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Un chiffre</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordCriteria.hasSpecial ? "text-brand-green font-bold" : "text-gray-400"}`}>
                  {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Un caractère spécial</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Création en cours..." : "Créer le Collaborateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
