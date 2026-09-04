"use client";

import { useState } from "react";
import { CrmSidebar } from "./CrmSidebar";
import { CrmHeader } from "./CrmHeader";
import { SessionUser } from "@/lib/auth";
import { CrmRealtimeProvider } from "@/components/crm/CrmRealtimeProvider";

interface Props {
  user: SessionUser;
  children: React.ReactNode;
}

export function CrmLayoutClient({ user, children }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <CrmRealtimeProvider>
      <div className="flex min-h-screen bg-slate-100">
        {/* Sidebar Desktop & Mobile Drawer */}
        <CrmSidebar
          userRole={user.role}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CrmHeader
            user={user}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </CrmRealtimeProvider>
  );
}
