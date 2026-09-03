"use client";

import { useState } from "react";
import { CrmSidebar } from "./CrmSidebar";
import { CrmHeader } from "./CrmHeader";
import { SessionUser } from "@/lib/auth";
import { UrgentBadgeCounts } from "@/lib/crm/badges";

import { PushSubscriptionManager } from "@/components/pwa/PushSubscriptionManager";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

interface Props {
  user: SessionUser;
  urgentCounts: UrgentBadgeCounts;
  children: React.ReactNode;
}

export function CrmLayoutClient({ user, urgentCounts, children }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-slate">
      <PushSubscriptionManager />
      <PwaInstallPrompt />

      {/* Sidebar Desktop & Mobile Drawer */}
      <CrmSidebar
        userRole={user.role}
        urgentCounts={urgentCounts}
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
  );
}
