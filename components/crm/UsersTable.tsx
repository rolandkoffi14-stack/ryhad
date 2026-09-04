"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog,
  ShieldCheck,
  User,
  Wrench,
  CheckCircle2,
  Lock,
  Search,
  Eye,
  Mail,
  Phone,
  UserPlus,
  Power,
  RefreshCw,
  Edit2,
} from "lucide-react";
import { StaffRole } from "@prisma/client";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { UserCreateModal } from "@/components/crm/UserCreateModal";
import { UserEditModal, EditUserData } from "@/components/crm/UserEditModal";
import { ConfirmationModal, ConfirmationModalVariant } from "@/components/crm/ConfirmationModal";

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
  currentUserId?: string;
}

export function UsersTable({ users, currentUserId = "" }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingAccessId, setSendingAccessId] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: ConfirmationModalVariant;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleSendAccess = (u: UserItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Envoyer les identifiants d'accès",
      message: `Souhaitez-vous envoyer un email d'activation avec réinitialisation de mot de passe à ${u.firstName} ${u.lastName} (${u.email}) ?`,
      confirmLabel: "Envoyer l'email",
      variant: "info",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setSendingAccessId(u.id);
        try {
          const res = await fetch(`/api/crm/utilisateurs/${u.id}/send-access`, {
            method: "POST",
          });
          const data = await res.json();
          setConfirmModal({
            isOpen: true,
            title: res.ok && data.success ? "Email transmis !" : "Échec de l'envoi",
            message: data.message || (res.ok ? "L'email a été envoyé avec succès." : "Une erreur est survenue."),
            confirmLabel: "Compris",
            variant: res.ok && data.success ? "success" : "danger",
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          });
        } catch (err) {
          setConfirmModal({
            isOpen: true,
            title: "Erreur de connexion",
            message: "Impossible de joindre le serveur d'envoi d'emails.",
            confirmLabel: "Fermer",
            variant: "danger",
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          });
        } finally {
          setSendingAccessId(null);
        }
      },
    });
  };

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
      type: "UTILISATEUR",
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

  const handleOpenEdit = (u: UserItem) => {
    setEditingUser(u);
    setIsEditModalOpen(true);
  };

  const handleToggleActive = (u: UserItem) => {
    if (u.id === currentUserId) {
      setConfirmModal({
        isOpen: true,
        title: "Action impossible",
        message: "Vous ne pouvez pas désactiver votre propre compte administrateur.",
        confirmLabel: "Compris",
        variant: "warning",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const action = u.isActive ? "désactiver" : "activer";
    setConfirmModal({
      isOpen: true,
      title: `${u.isActive ? "Désactiver" : "Activer"} le compte`,
      message: `Êtes-vous sûr de vouloir ${action} l'accès de ${u.firstName} ${u.lastName} ?`,
      confirmLabel: u.isActive ? "Désactiver le compte" : "Activer le compte",
      variant: u.isActive ? "danger" : "success",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setUpdatingId(u.id);
        try {
          const res = await fetch(`/api/crm/utilisateurs/${u.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !u.isActive }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setConfirmModal({
              isOpen: true,
              title: "Erreur",
              message: data.message || "Erreur lors de la modification du statut.",
              confirmLabel: "Fermer",
              variant: "danger",
              onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
            });
          } else {
            router.refresh();
          }
        } catch (e: any) {
          setConfirmModal({
            isOpen: true,
            title: "Erreur serveur",
            message: "Erreur de communication avec le serveur.",
            confirmLabel: "Fermer",
            variant: "danger",
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          });
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
      {/* Filtres, Recherche & Bouton Ajouter */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center gap-3 justify-between lg:justify-end flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
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
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
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

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Collaborateur</span>
          </button>
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
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {paginatedUsers.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="hover:bg-brand-slate/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="font-extrabold text-brand-dark text-xs">
                        {u.firstName} {u.lastName}
                      </div>
                      {isSelf && (
                        <span className="text-[9px] font-extrabold bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-1.5 py-0.2 rounded-full">
                          Vous
                        </span>
                      )}
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

                  <td className="px-5 py-3.5">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Désactivé
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Modifier le profil & mot de passe */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        title="Modifier les informations et accès"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Envoi des accès email */}
                      <button
                        type="button"
                        onClick={() => handleSendAccess(u)}
                        disabled={sendingAccessId === u.id || !u.isActive}
                        title={u.isActive ? "Envoyer / Renvoyer le lien d'accès par email" : "Compte désactivé"}
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {sendingAccessId === u.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Activer / Désactiver (interdit sur soi-même) */}
                      {!isSelf ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={updatingId === u.id}
                          title={u.isActive ? "Désactiver le compte" : "Activer le compte"}
                          className={`p-1.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                            u.isActive
                              ? "border-gray-200 bg-white text-gray-400 hover:text-brand-red hover:border-brand-red hover:bg-brand-red-light"
                              : "border-brand-green/30 bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div
                          title="Vous ne pouvez pas désactiver votre propre compte"
                          className="p-1.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Aperçu rapide */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(u)}
                        title="Aperçu collaborateur"
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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

      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={() => router.refresh()}
      />

      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        currentUserId={currentUserId}
        onUserUpdated={() => router.refresh()}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
      />
    </div>
  );
}
