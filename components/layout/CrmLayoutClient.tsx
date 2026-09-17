"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { CrmSidebar } from "./CrmSidebar";
import { CrmHeader } from "./CrmHeader";
import { SessionUser } from "@/lib/auth";
import { CrmRealtimeProvider } from "@/components/crm/CrmRealtimeProvider";
import { AutoLogoutTimer } from "@/components/crm/AutoLogoutTimer";
import { LogoutConfirmModal } from "@/components/crm/LogoutConfirmModal";

interface Props {
  user: SessionUser;
  children: React.ReactNode;
}

export function CrmLayoutClient({ user, children }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <CrmRealtimeProvider>
      <AutoLogoutTimer />
      <div className="flex min-h-screen bg-slate-100">
        {/* Sidebar Desktop & Mobile Drawer */}
        <CrmSidebar
          userRole={user.role}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          onRequestLogout={() => setIsLogoutModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CrmHeader
            user={user}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onRequestLogout={() => setIsLogoutModalOpen(true)}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* Modale de confirmation de déconnexion pour tous les utilisateurs */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        isLoading={isLoggingOut}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutModalOpen(false);
        }}
        onConfirm={handleConfirmLogout}
      />
    </CrmRealtimeProvider>
  );
}
