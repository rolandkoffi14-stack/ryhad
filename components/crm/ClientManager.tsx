"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Search,
  Plus,
  Building2,
  User,
  Ticket,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  MessageCircle,
} from "lucide-react";
import { ClientType, StaffRole } from "@prisma/client";
import { PaginationControls } from "@/components/crm/PaginationControls";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";
import { ConfirmationModal } from "@/components/crm/ConfirmationModal";

interface ClientData {
  id: string;
  type: ClientType;
  nom: string;
  contactNom: string | null;
  telephone: string;
  email: string | null;
  adresse: string | null;
  _count: {
    interventions: number;
    contrats: number;
    demandes?: number;
  };
  contrats?: {
    id: string;
    periodicite: string;
    equipementsCouverts: string;
  }[];
}

interface Props {
  clients: ClientData[];
  userRole: StaffRole;
}

export function ClientManager({ clients, userRole }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick View Modal
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Formulaire de création / modification
  const [formData, setFormData] = useState<{
    type: ClientType;
    nom: string;
    contactNom: string;
    telephone: string;
    email: string;
    adresse: string;
  }>({
    type: ClientType.PARTICULIER,
    nom: "",
    contactNom: "",
    telephone: "",
    email: "",
    adresse: "",
  });

  // Filtrage
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nom = c.nom.toLowerCase();
        const tel = c.telephone.toLowerCase();
        const contact = (c.contactNom || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const adr = (c.adresse || "").toLowerCase();

        if (
          !nom.includes(term) &&
          !tel.includes(term) &&
          !contact.includes(term) &&
          !email.includes(term) &&
          !adr.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [clients, searchTerm, typeFilter]);

  // Pagination
  const totalItems = filteredClients.length;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      type: ClientType.PARTICULIER,
      nom: "",
      contactNom: "",
      telephone: "",
      email: "",
      adresse: "",
    });
    setError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (client: ClientData) => {
    setEditingClient(client);
    setFormData({
      type: client.type,
      nom: client.nom,
      contactNom: client.contactNom || "",
      telephone: client.telephone,
      email: client.email || "",
      adresse: client.adresse || "",
    });
    setError(null);
    setShowCreateModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const url = editingClient ? `/api/crm/clients/${editingClient.id}` : "/api/crm/clients";
      const method = editingClient ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Une erreur est survenue lors de l'enregistrement.");
      }

      setSuccessMsg(
        editingClient
          ? `Client "${formData.nom}" mis à jour avec succès.`
          : `Client "${formData.nom}" créé avec succès.`
      );
      setShowCreateModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirmation Modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    client: ClientData | null;
  }>({
    isOpen: false,
    client: null,
  });

  const handleDeleteClient = (client: ClientData) => {
    setDeleteConfirmModal({
      isOpen: true,
      client,
    });
  };

  const confirmDeleteClient = async () => {
    const client = deleteConfirmModal.client;
    if (!client) return;

    setDeleteConfirmModal({ isOpen: false, client: null });
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/crm/clients/${client.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Impossible de supprimer ce client.");
      }

      setSuccessMsg(`Client "${client.nom}" supprimé avec succès.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuickView = (cl: ClientData) => {
    setQuickViewData({
      type: "CLIENT",
      title: cl.nom,
      subtitle: cl.type === ClientType.ENTREPRISE ? "Entreprise / Société" : "Client Particulier",
      badge: {
        label: cl.type,
        className: cl.type === ClientType.ENTREPRISE ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-blue-100 text-brand-blue border-blue-300",
      },
      clientName: cl.nom,
      clientPhone: cl.telephone,
      details: [
        { label: "Type", value: cl.type },
        { label: "Téléphone", value: cl.telephone },
        { label: "Contact référent", value: cl.contactNom || "—" },
        { label: "Email", value: cl.email || "Non renseigné" },
        { label: "Adresse", value: cl.adresse || "Non renseignée" },
        { label: "Interventions atelier", value: `${cl._count.interventions} dossier(s)` },
        {
          label: "Contrats de maintenance",
          value: cl.contrats && cl.contrats.length > 0 ? (
            <div className="space-y-1">
              {cl.contrats.map((c) => (
                <div key={c.id}>Périodicité {c.periodicite} ({c.equipementsCouverts})</div>
              ))}
            </div>
          ) : (
            "Aucun contrat actif"
          ),
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header aéré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Répertoire Clients & Entreprises
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestion des coordonnées, contacts et parcs informatiques des clients.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-brand-green" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Alertes & Toasts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-2 font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tableau Allégé & Filtres */}
      <div className="bg-white rounded-3xl border border-gray-200 subtle-shadow overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un client..."
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
              { id: ClientType.PARTICULIER, label: "Particuliers" },
              { id: ClientType.ENTREPRISE, label: "Entreprises" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTypeFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  typeFilter === tab.id
                    ? "bg-brand-blue text-white shadow-2xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Client & Raison Sociale</th>
                <th className="px-5 py-3.5">Téléphone & Contact</th>
                <th className="px-5 py-3.5">Activité Liée</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedClients.map((cl) => {
                const totalLinks = (cl._count.interventions || 0) + (cl._count.contrats || 0);
                const clientPhone = cl.telephone || "";
                const clientCleanPhone = clientPhone.replace(/[^0-9]/g, "");

                return (
                  <tr key={cl.id} className="hover:bg-brand-slate/40 transition-colors">
                    {/* 1. Client & Raison Sociale */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            cl.type === ClientType.ENTREPRISE
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-brand-blue"
                          }`}
                        >
                          {cl.type === ClientType.ENTREPRISE ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-brand-dark block text-xs">{cl.nom}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{cl.type}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Téléphone & Contact rapide */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-brand-dark">{cl.telephone}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {cl.contactNom && (
                          <span className="text-[11px] text-gray-500">{cl.contactNom} • </span>
                        )}
                        <a
                          href={`https://wa.me/${clientCleanPhone}?text=${encodeURIComponent(
                            `Bonjour ${cl.nom}, RyHaD Tic-Medic à votre service.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                          className="text-[#25D366] hover:opacity-80 p-0.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* 3. Activité Liée (Badges compacts) */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-md">
                          {cl._count.interventions} ticket(s)
                        </span>
                        {cl._count.contrats > 0 && (
                          <span className="text-[11px] font-bold bg-brand-green/15 text-brand-green-dark px-2 py-0.5 rounded-md">
                            {cl._count.contrats} contrat(s)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Actions (Bouton Œil, Ticket, Modifier, Supprimer) */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Bouton ŒIL d'aperçu rapide */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickView(cl)}
                          title="Aperçu rapide"
                          className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Nouveau Ticket direct */}
                        {cl.contrats && cl.contrats.length > 0 ? (
                          <Link
                            href={`/crm/tickets/contractuel?new=true&contractId=${cl.contrats[0].id}&clientId=${cl.id}`}
                            title="Intervention sous contrat"
                            className="p-1.5 rounded-xl bg-brand-green/10 text-brand-green-dark hover:bg-brand-green hover:text-white transition-all shadow-2xs"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/crm/tickets/ponctuel?new=true&clientId=${cl.id}`}
                            title="Nouveau ticket ponctuel"
                            className="p-1.5 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-2xs"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {/* Modifier */}
                        <button
                          onClick={() => openEditModal(cl)}
                          title="Modifier"
                          className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-blue hover:bg-gray-50 transition-all shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Supprimer (Admin seul) */}
                        {userRole === StaffRole.ADMIN && (
                          totalLinks === 0 ? (
                            <button
                              onClick={() => handleDeleteClient(cl)}
                              title="Supprimer définitivement"
                              className="p-1.5 rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-all shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              title={`Client lié à ${totalLinks} dossier(s)`}
                              className="p-1.5 text-gray-300 inline-flex items-center"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Aucun client ne correspond aux critères de recherche.
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
      </div>

      {/* Modale d'aperçu rapide */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={quickViewData}
      />

      {/* Modale Création / Modification Client */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setShowCreateModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-brand-slate/60 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-brand-dark">
                {editingClient ? `Modifier : ${editingClient.nom}` : "Enregistrer un Nouveau Client"}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-brand-slate rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: ClientType.PARTICULIER })}
                  className={`py-2 rounded-lg font-extrabold transition-all ${
                    formData.type === ClientType.PARTICULIER
                      ? "bg-white text-brand-blue shadow-2xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Particulier
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: ClientType.ENTREPRISE })}
                  className={`py-2 rounded-lg font-extrabold transition-all ${
                    formData.type === ClientType.ENTREPRISE
                      ? "bg-white text-purple-700 shadow-2xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Entreprise / Structure
                </button>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {formData.type === ClientType.ENTREPRISE ? "Raison Sociale / Société" : "Nom & Prénom(s)"}{" "}
                  <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === ClientType.ENTREPRISE ? "Raison sociale" : "Nom et prénom"}
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>

              {formData.type === ClientType.ENTREPRISE && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Personne de Contact Référente</label>
                  <input
                    type="text"
                    placeholder="Nom du contact"
                    value={formData.contactNom}
                    onChange={(e) => setFormData({ ...formData, contactNom: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Téléphone <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Numéro de téléphone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Adresse Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Adresse</label>
                <input
                  type="text"
                  placeholder="Adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold shadow-sm disabled:opacity-50"
                >
                  {loading ? "Enregistrement..." : editingClient ? "Mettre à jour" : "Créer le Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation de suppression client */}
      <ConfirmationModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, client: null })}
        onConfirm={confirmDeleteClient}
        title="Supprimer la fiche client"
        message={
          deleteConfirmModal.client
            ? `Êtes-vous sûr de vouloir supprimer définitivement le client "${deleteConfirmModal.client.nom}" ? Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
