"use client";

import { useState, useMemo } from "react";
import { UserCog, ShieldCheck, User, Wrench, CheckCircle2, Lock, Search, Eye, Mail, Phone } from "lucide-react";
import { StaffRole } from "@prisma/client";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";

interface UserItem {
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
  users: UserItem[];
}

export function UsersTable({ users }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick View Modal
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const email = u.email.toLowerCase();
        const phone = (u.phone || "").toLowerCase();

        if (!fullName.includes(term) && !email.includes(term) && !phone.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchTerm, roleFilter]);

  const totalItems = filteredUsers.length;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleOpenQuickView = (u: UserItem) => {
    setQuickViewData({
      type: "CLIENT",
      title: `${u.firstName} ${u.lastName}`,
      subtitle: `Rôle : ${u.role} — Compte ${u.isActive ? "Actif" : "Inactif"}`,
      badge: {
        label: u.role,
        className: getRoleBadge(u.role),
      },
      clientName: `${u.firstName} ${u.lastName}`,
      clientPhone: u.phone || undefined,
      details: [
        { label: "Nom complet", value: `${u.firstName} ${u.lastName}` },
        { label: "Adresse Email", value: u.email },
        { label: "Téléphone direct", value: u.phone || "Non renseigné" },
        { label: "Rôle dans l'application", value: u.role },
        {
          label: "Assignable aux réparations",
          value: u.assignableAsTechnician ? "Oui (peut recevoir des tickets atelier)" : "Non",
        },
        { label: "Statut du compte", value: u.isActive ? "Actif" : "Désactivé" },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
      {/* Filtres & Recherche */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {[
            { id: "ALL", label: "Tous" },
            { id: StaffRole.ADMIN, label: "Admins" },
            { id: StaffRole.RECEPTIONNISTE, label: "Réceptionnistes" },
            { id: StaffRole.TECHNICIEN, label: "Techniciens" },
          ].map((tab) => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setRoleFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-brand-blue text-white shadow-2xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau Allégé */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-slate text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-5 py-3.5">Collaborateur</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Rôle RBAC</th>
              <th className="px-5 py-3.5">Assignable</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {paginatedUsers.map((u) => (
              <tr key={u.id} className="hover:bg-brand-slate/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-extrabold text-brand-dark text-xs">
                    {u.firstName} {u.lastName}
                  </div>
                  <span className="text-[10px] text-gray-400 block">{u.email}</span>
                </td>

                <td className="px-5 py-3.5 text-gray-600">
                  {u.phone ? <span className="font-semibold">{u.phone}</span> : <span className="text-gray-400 italic">—</span>}
                </td>

                <td className="px-5 py-3.5">
                  <span
                    className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${getRoleBadge(
                      u.role
                    )}`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  {u.assignableAsTechnician ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Oui</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium">Non</span>
                  )}
                </td>

                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenQuickView(u)}
                      title="Aperçu collaborateur"
                      className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  Aucun collaborateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={quickViewData}
      />
    </div>
  );
}
