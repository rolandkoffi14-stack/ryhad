"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  UserCheck,
  Mail,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Lock,
} from "lucide-react";
import { StaffRole } from "@prisma/client";

export interface EditUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: StaffRole;
  assignableAsTechnician: boolean;
  isActive: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: EditUserData | null;
  currentUserId: string;
  onUserUpdated: () => void;
}

export function UserEditModal({
  isOpen,
  onClose,
  user,
  currentUserId,
  onUserUpdated,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>(StaffRole.TECHNICIEN);
  const [assignableAsTechnician, setAssignableAsTechnician] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Gestion du changement de mot de passe
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role);
      setAssignableAsTechnician(user.assignableAsTechnician);
      setIsActive(user.isActive);
      setChangePassword(false);
      setNewPassword("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

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

    const shuffled = pass.split("").sort(() => 0.5 - Math.random()).join("");
    setNewPassword(shuffled);
    setShowPassword(true);
  };

  const passwordCriteria = useMemo(() => {
    if (!changePassword) return { length: true, hasUpper: true, hasLower: true, hasNumber: true, hasSpecial: true };
    return {
      length: newPassword.length >= 10,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword, changePassword]);

  const isPasswordValid =
    !changePassword ||
    (passwordCriteria.length &&
      passwordCriteria.hasUpper &&
      passwordCriteria.hasLower &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSpecial);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (changePassword && !isPasswordValid) {
      setError("Le mot de passe doit respecter toutes les exigences de sécurité (10 caractères, majuscule, minuscule, chiffre, symbole).");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        assignableAsTechnician,
        isActive,
      };

      if (changePassword && newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch(`/api/crm/utilisateurs/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de la mise à jour de l'utilisateur.");
      }

      setSuccessMessage("Informations du collaborateur mises à jour avec succès !");
      setTimeout(() => {
        onUserUpdated();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue-light text-brand-blue flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-brand-dark">Modifier Collaborateur</h3>
              <p className="text-xs text-gray-500">Mise à jour des accès et informations de profil</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
          {/* Identité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Prénom *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nom *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Adresse Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Téléphone direct</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+229 01 XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rôle RBAC */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Rôle & Permissions RBAC *</label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: StaffRole.TECHNICIEN, label: "Technicien", icon: Wrench },
                { id: StaffRole.RECEPTIONNISTE, label: "Réception", icon: UserCheck },
                { id: StaffRole.ADMIN, label: "Direction", icon: ShieldCheck },
              ].map((r) => {
                const isSelected = role === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={isSelf && r.id !== StaffRole.ADMIN}
                    onClick={() => {
                      setRole(r.id);
                      if (r.id === StaffRole.TECHNICIEN) setAssignableAsTechnician(true);
                      else if (r.id === StaffRole.RECEPTIONNISTE) setAssignableAsTechnician(false);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-blue bg-brand-blue/10 text-brand-blue font-extrabold shadow-xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                    } ${isSelf && r.id !== StaffRole.ADMIN ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option Assignable comme technicien */}
          <div className="p-3 bg-brand-slate/60 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-dark block">
                Assignable aux interventions atelier
              </span>
              <span className="text-[11px] text-gray-500 block">
                Permet d&apos;assigner des tickets à ce collaborateur.
              </span>
            </div>
            <input
              type="checkbox"
              id="assignableAsTechEdit"
              checked={assignableAsTechnician}
              onChange={(e) => setAssignableAsTechnician(e.target.checked)}
              className="w-4 h-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
            />
          </div>

          {/* Statut du compte (Actif / Inactif) */}
          <div className="p-3 bg-brand-slate/60 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-dark block">Statut du compte</span>
              <span className="text-[11px] text-gray-500 block">
                {isSelf ? "Vous ne pouvez pas désactiver votre propre compte." : "Activer ou suspendre les accès de ce collaborateur."}
              </span>
            </div>
            <button
              type="button"
              disabled={isSelf}
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-brand-green/20 text-brand-green border border-brand-green/30"
                  : "bg-gray-200 text-gray-600 border border-gray-300"
              } ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isActive ? "Compte Actif" : "Compte Désactivé"}
            </button>
          </div>

          {/* Section Réinitialisation / Changement de mot de passe */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-brand-blue" />
                <span className="text-xs font-bold text-brand-dark">
                  Réinitialiser le mot de passe
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !changePassword;
                  setChangePassword(next);
                  if (next && !newPassword) generateStrongPassword();
                }}
                className="text-xs font-extrabold text-brand-blue hover:text-brand-blue-dark transition-colors cursor-pointer"
              >
                {changePassword ? "Annuler le changement" : "Définir un nouveau mot de passe"}
              </button>
            </div>

            {changePassword && (
              <div className="p-3.5 bg-brand-slate/80 rounded-2xl border border-gray-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Nouveau mot de passe *</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-green hover:underline font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Générer automatiquement</span>
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required={changePassword}
                    placeholder="Min. 10 caractères sécurisés"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-gray-200 bg-white font-mono focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <span className={passwordCriteria.length ? "text-brand-green font-bold" : "text-gray-400"}>
                    • 10 caractères minimum
                  </span>
                  <span className={passwordCriteria.hasUpper ? "text-brand-green font-bold" : "text-gray-400"}>
                    • 1 Majuscule (A-Z)
                  </span>
                  <span className={passwordCriteria.hasLower ? "text-brand-green font-bold" : "text-gray-400"}>
                    • 1 Minuscule (a-z)
                  </span>
                  <span className={passwordCriteria.hasNumber ? "text-brand-green font-bold" : "text-gray-400"}>
                    • 1 Chiffre (0-9)
                  </span>
                  <span className={passwordCriteria.hasSpecial ? "text-brand-green font-bold col-span-2" : "text-gray-400 col-span-2"}>
                    • 1 Caractère spécial (!@#$%^&*...)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || (changePassword && !isPasswordValid)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
              ) : (
                <Save className="w-4 h-4 text-brand-green" />
              )}
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
