"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TypeMateriel, ModeIntervention, ClientType } from "@prisma/client";
import { Wrench, Plus, UserPlus, Save, ArrowLeft, CheckCircle2, X, AlertCircle } from "lucide-react";

interface ClientOption {
  id: string;
  nom: string;
  telephone: string;
}

interface TechOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  clients: ClientOption[];
  technicians: TechOption[];
  preselectedClientId?: string;
}

export function TicketFormPonctuel({ clients, technicians, preselectedClientId }: Props) {
  const router = useRouter();
  const [clientsList, setClientsList] = useState<ClientOption[]>(clients);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État Modale Création Rapide Client
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [newClient, setNewClient] = useState<{
    nom: string;
    telephone: string;
    type: ClientType;
    adresse: string;
    email: string;
    contactNom: string;
  }>({
    nom: "",
    telephone: "",
    type: ClientType.PARTICULIER,
    adresse: "",
    email: "",
    contactNom: "",
  });

  const [formData, setFormData] = useState<{
    clientId: string;
    typeMateriel: TypeMateriel;
    panneDeclaree: string;
    modeIntervention: ModeIntervention;
    montantDiagnostic: number;
    technicienAssigneId: string;
  }>({
    clientId: preselectedClientId || clients[0]?.id || "",
    typeMateriel: TypeMateriel.PC_PORTABLE,
    panneDeclaree: "",
    modeIntervention: ModeIntervention.DEPOT_ATELIER,
    montantDiagnostic: 1000,
    technicienAssigneId: technicians[0]?.id || "",
  });

  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nom.trim() || !newClient.telephone.trim()) {
      setClientError("Le nom et le numéro de téléphone sont obligatoires.");
      return;
    }
    setClientLoading(true);
    setClientError(null);

    try {
      const res = await fetch("/api/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de la création du client.");
      }

      const createdClient: ClientOption = {
        id: data.client.id,
        nom: data.client.nom,
        telephone: data.client.telephone,
      };

      setClientsList((prev) => [createdClient, ...prev]);
      setFormData((prev) => ({ ...prev, clientId: createdClient.id }));
      setShowClientModal(false);
      setNewClient({
        nom: "",
        telephone: "",
        type: ClientType.PARTICULIER,
        adresse: "",
        email: "",
        contactNom: "",
      });
    } catch (err: any) {
      setClientError(err.message);
    } finally {
      setClientLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.montantDiagnostic < 1000) {
      setError("Les frais de diagnostic doivent être d'au moins 1 000 FCFA.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm/tickets/ponctuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de la création du ticket.");
      }

      router.push(`/crm/tickets/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 subtle-shadow space-y-6 max-w-3xl">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            <span>Parcours Ponctuel</span>
          </div>
          <h2 className="text-xl font-extrabold text-brand-dark">
            Création d&apos;un Ticket Ponctuel (Atelier / Particulier / Hors-contrat)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ce parcours suit le cycle complet : Frais de diagnostic → Diagnostic technique → Devis client → Réparation.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sélection Client avec Création Rapide */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700">
              Client bénéficiaire *
            </label>
            <button
              type="button"
              onClick={() => setShowClientModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-green hover:text-brand-green-dark bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all border border-emerald-200"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nouveau Client</span>
            </button>
          </div>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
          >
            {clientsList.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.nom} ({cl.telephone})
              </option>
            ))}
          </select>
        </div>

      {/* Type de matériel & Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Type de matériel *
          </label>
          <select
            value={formData.typeMateriel}
            onChange={(e) => setFormData({ ...formData, typeMateriel: e.target.value as TypeMateriel })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white"
          >
            {Object.values(TypeMateriel).map((mat) => (
              <option key={mat} value={mat}>
                {mat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Mode d&apos;intervention *
          </label>
          <select
            value={formData.modeIntervention}
            onChange={(e) => setFormData({ ...formData, modeIntervention: e.target.value as ModeIntervention })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white"
          >
            <option value={ModeIntervention.DEPOT_ATELIER}>Dépôt à l&apos;atelier (Gbégamey)</option>
            <option value={ModeIntervention.DOMICILE}>Déplacement sur site / Domicile</option>
          </select>
        </div>
      </div>

      {/* Panne déclarée */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Symptômes & Panne déclarée par le client *
        </label>
        <textarea
          rows={3}
          required
          placeholder="Description de la panne constatée"
          value={formData.panneDeclaree}
          onChange={(e) => setFormData({ ...formData, panneDeclaree: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
        ></textarea>
      </div>

      {/* Frais diagnostic & Technicien */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Frais de Diagnostic initial (FCFA) * (Min : 1 000 FCFA)
          </label>
          <input
            type="number"
            min="1000"
            step="500"
            required
            value={formData.montantDiagnostic}
            onChange={(e) => setFormData({ ...formData, montantDiagnostic: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-bold text-brand-blue"
          />
          <p className="text-[10px] text-gray-500 mt-1">Montant libre selon complexité (min. 1 000 FCFA). Génère la facture de diagnostic.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Technicien assigné au diagnostic
          </label>
          <select
            value={formData.technicienAssigneId}
            onChange={(e) => setFormData({ ...formData, technicienAssigneId: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white"
          >
            <option value="">Non assigné (En attente réception)</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.firstName} {tech.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-brand-green" />
            <span>{loading ? "Création..." : "Créer le ticket ponctuel"}</span>
          </button>
        </div>
      </form>

      {/* MODALE : CRÉATION RAPIDE DE CLIENT */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-brand-green flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-dark">
                    Nouveau Client Comptoir
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Enregistrement direct sans quitter le dépôt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {clientError && (
              <div className="p-3 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{clientError}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuickClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Type de Client *
                  </label>
                  <select
                    value={newClient.type}
                    onChange={(e) =>
                      setNewClient({ ...newClient, type: e.target.value as ClientType })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
                  >
                    <option value={ClientType.PARTICULIER}>Particulier</option>
                    <option value={ClientType.ENTREPRISE}>Entreprise / Structure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Numéro de téléphone"
                    value={newClient.telephone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, telephone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nom complet / Raison Sociale *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nom ou raison sociale"
                  value={newClient.nom}
                  onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={newClient.adresse}
                    onChange={(e) =>
                      setNewClient({ ...newClient, adresse: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={clientLoading}
                  className="inline-flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{clientLoading ? "Enregistrement..." : "Créer & Sélectionner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
