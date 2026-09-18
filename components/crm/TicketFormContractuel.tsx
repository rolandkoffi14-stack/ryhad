"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TypeMateriel, ModeIntervention, ClientType } from "@prisma/client";
import {
  ClipboardList,
  Save,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Wrench,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { QuickCreateClientModal } from "@/components/crm/QuickCreateClientModal";

interface ContractOption {
  id: string;
  clientId: string;
  clientNom: string;
  equipementsCouverts: string;
  periodicite: string;
}

interface TechOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  contracts: ContractOption[];
  technicians: TechOption[];
  initialContractId?: string;
}

export function TicketFormContractuel({ contracts, technicians, initialContractId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [contractsList, setContractsList] = useState<ContractOption[]>(contracts);
  const [showClientModal, setShowClientModal] = useState(false);

  useEffect(() => {
    setContractsList(contracts);
  }, [contracts]);

  const [selectedContractId, setSelectedContractId] = useState(
    (initialContractId && contracts.find((c) => c.id === initialContractId)?.id) || contracts[0]?.id || ""
  );
  const currentContract = contractsList.find((c) => c.id === selectedContractId);

  const [formData, setFormData] = useState<{
    typeMateriel: TypeMateriel;
    panneDeclaree: string;
    modeIntervention: ModeIntervention;
    technicienAssigneId: string;
  }>({
    typeMateriel: TypeMateriel.PC_BUREAU,
    panneDeclaree: "",
    modeIntervention: ModeIntervention.DOMICILE,
    technicienAssigneId: technicians[0]?.id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentContract) {
      setError("Veuillez sélectionner un contrat valide.");
      return;
    }

    if (!formData.panneDeclaree.trim()) {
      setError("Veuillez décrire la panne ou le problème constaté.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm/tickets/contractuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: currentContract.clientId,
          contractId: currentContract.id,
          ...formData,
        }),
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 subtle-shadow space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-3">
        <p className="text-xs text-gray-500 font-medium">
          Prise en charge directe pour les entreprises abonnées (0 FCFA de frais de diagnostic).
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sélection Contrat Actif avec option Nouveau Client */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700">
            Entreprise & Contrat de maintenance actif *
          </label>
          <button
            type="button"
            onClick={() => setShowClientModal(true)}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-blue hover:text-brand-blue-dark bg-brand-blue/10 hover:bg-brand-blue/20 px-2.5 py-1 rounded-lg transition-all border border-brand-blue/20 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nouveau client</span>
          </button>
        </div>

        {contractsList.length > 0 ? (
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
          >
            {contractsList.map((ctr) => (
              <option key={ctr.id} value={ctr.id}>
                {ctr.clientNom} — Périodicité : {ctr.periodicite}
              </option>
            ))}
          </select>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>Aucun contrat de maintenance actif n&apos;est enregistré. Vous pouvez en créer un directement.</span>
            <button
              type="button"
              onClick={() => setShowClientModal(true)}
              className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 hover:bg-brand-blue-dark transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nouveau client & contrat</span>
            </button>
          </div>
        )}

        {currentContract && (
          <div className="p-3 bg-brand-blue-light/50 border border-brand-blue/20 rounded-xl text-xs text-brand-dark flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Équipements couverts par ce contrat :</span>
              <p className="text-gray-600 mt-0.5">{currentContract.equipementsCouverts}</p>
            </div>
          </div>
        )}
      </div>

      {/* Type de matériel & Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Matériel concerné par l&apos;intervention *
          </label>
          <select
            value={formData.typeMateriel}
            onChange={(e) => setFormData({ ...formData, typeMateriel: e.target.value as TypeMateriel })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
          >
            <option value={ModeIntervention.DOMICILE}>Sur site client (Standard contrat)</option>
            <option value={ModeIntervention.DEPOT_ATELIER}>Rapatriement atelier (Atelier Gbégamey)</option>
          </select>
        </div>
      </div>

      {/* Technicien Assigné */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Technicien en charge de l&apos;intervention
        </label>
        <select
          value={formData.technicienAssigneId}
          onChange={(e) => setFormData({ ...formData, technicienAssigneId: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
        >
          <option value="">Non assigné pour le moment</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Description de la panne */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Description de la panne ou du dysfonctionnement constaté *
        </label>
        <textarea
          rows={4}
          required
          placeholder="Description de la panne constatée"
          value={formData.panneDeclaree}
          onChange={(e) => setFormData({ ...formData, panneDeclaree: e.target.value })}
          className="w-full p-3.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none leading-relaxed bg-brand-slate/20 font-medium"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              initialContractId
                ? `/crm/tickets/contractuel?contractId=${initialContractId}`
                : "/crm/tickets/contractuel"
            )
          }
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || !currentContract}
          className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Création..." : "Créer"}</span>
        </button>
      </div>

      {/* Modale d'ajout rapide client entreprise & contrat */}
      <QuickCreateClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        includeContract={true}
        defaultClientType={ClientType.ENTREPRISE}
        onSuccess={({ client, contract }) => {
          if (contract) {
            const newOption: ContractOption = {
              id: contract.id,
              clientId: client.id,
              clientNom: client.nom,
              equipementsCouverts: contract.equipementsCouverts,
              periodicite: contract.periodicite,
            };
            setContractsList((prev) => [newOption, ...prev]);
            setSelectedContractId(contract.id);
            setSuccessMsg(`Client entreprise « ${client.nom} » et son contrat créés avec succès.`);
          }
        }}
      />
    </form>
  );
}
