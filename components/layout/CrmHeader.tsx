"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Search, LogOut, Menu } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { StaffRole } from "@prisma/client";

interface Props {
  user: SessionUser;
  onMenuToggle?: () => void;
}

export function CrmHeader({ user, onMenuToggle }: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case StaffRole.ADMIN:
        return "bg-brand-blue-light text-brand-blue border-brand-blue/30";
      case StaffRole.RECEPTIONNISTE:
        return "bg-purple-50 text-purple-700 border-purple-200";
      case StaffRole.TECHNICIEN:
        return "bg-brand-green-light text-brand-green-dark border-brand-green/30";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Bouton Hamburger sur mobile & Recherche rapide */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label="Ouvrir le menu"
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-brand-dark hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher ticket, client, téléphone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue bg-brand-slate/60"
          />
        </div>
      </div>

      {/* Profil utilisateur */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Profil utilisateur"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-blue hover:bg-brand-blue-dark text-white flex items-center justify-center font-extrabold text-xs shadow-sm transition-all border-2 border-white ring-2 ring-gray-100 hover:ring-brand-blue/30"
          >
            {user.firstName?.charAt(0) || "U"}
            {user.lastName?.charAt(0) || ""}
          </button>

          {/* Menu déroulant profil avec toutes les infos au clic */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-3 p-2 bg-brand-slate/60 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {user.firstName?.charAt(0) || "U"}
                  {user.lastName?.charAt(0) || ""}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-brand-dark truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                  <span
                    className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 ${getRoleBadge(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              {user.phone && (
                <div className="px-2 text-[11px] text-gray-500">
                  Tél : <span className="font-semibold text-gray-700">{user.phone}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-brand-red hover:bg-brand-red-light flex items-center gap-2 font-bold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se Déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
