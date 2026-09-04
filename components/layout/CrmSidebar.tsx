"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Ticket,
  ClipboardList,
  FileCheck2,
  Receipt,
  Wrench,
  ShoppingBag,
  UserCog,
  ArrowLeft,
  X,
} from "lucide-react";
import { StaffRole } from "@prisma/client";

interface Props {
  userRole: StaffRole;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function CrmSidebar({
  userRole,
  isMobileOpen = false,
  onMobileClose,
}: Props) {
  const pathname = usePathname();

  interface NavItem {
    href: string;
    label: string;
    icon: any;
    exact?: boolean;
    badge?: string;
    roles: StaffRole[];
  }

  const allNavItems: NavItem[] = [
    {
      href: "/crm",
      label: userRole === StaffRole.TECHNICIEN ? "Mon Espace Travail" : "Tableau de Bord",
      icon: LayoutDashboard,
      exact: true,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE, StaffRole.TECHNICIEN],
    },
    {
      href: "/crm/clients",
      label: "Gestion Clients",
      icon: Users,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE],
    },
    {
      href: "/crm/tickets/ponctuel",
      label: userRole === StaffRole.TECHNICIEN ? "Tickets Ponctuels" : "Tickets Ponctuels",
      icon: Ticket,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE, StaffRole.TECHNICIEN],
    },
    {
      href: "/crm/tickets/contractuel",
      label: userRole === StaffRole.TECHNICIEN ? "Interventions Contrats" : "Tickets Contractuels",
      icon: ClipboardList,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE, StaffRole.TECHNICIEN],
    },
    {
      href: "/crm/contrats",
      label: "Contrats & Visites",
      icon: FileCheck2,
      roles: [StaffRole.ADMIN],
    },
    {
      href: "/crm/documents",
      label: "Devis & Factures",
      icon: Receipt,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE],
    },
    {
      href: "/crm/techniciens",
      label: "Équipe Technique",
      icon: Wrench,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE],
    },
    {
      href: "/crm/demandes-commerciales",
      label: "Demandes Commerciales",
      icon: ShoppingBag,
      roles: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE],
    },
    {
      href: "/crm/utilisateurs",
      label: "Utilisateurs & Rôles",
      icon: UserCog,
      badge: "Admin",
      roles: [StaffRole.ADMIN],
    },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  // Verrouillage du scroll du body sur mobile quand le menu est ouvert
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-dark text-gray-300 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between shrink-0">
        <Link href="/crm" className="flex items-center gap-2.5" onClick={onMobileClose}>
          <div className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center p-0.5 border border-gray-700 shadow-xs">
            <Image
              src="/images/logo.jpg"
              alt="RyHaD Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-white text-base tracking-tight">RyHaD</span>
              <span className="text-[10px] font-bold bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded">
                CRM
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              {userRole === StaffRole.ADMIN
                ? "Espace Direction"
                : userRole === StaffRole.RECEPTIONNISTE
                ? "Espace Réception"
                : "Espace Technicien"}
            </p>
          </div>
        </Link>

        {/* Bouton fermeture sur mobile */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            aria-label="Fermer le menu"
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation filtrée par rôle */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Menu {userRole}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-green" : "text-gray-400"}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-gray-800 space-y-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voir le site public</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixe / Sticky) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 border-r border-gray-800 shrink-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />

          {/* Panel */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
