"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ClientType, Periodicite } from "@prisma/client";
import {
  UserPlus,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export interface QuickCreatedClient {
  id: string;
  nom: string;
  telephone: string;
  contactNom?: string | null;
  type?: string;
}

export interface QuickCreatedContract {
  id: string;
  clientId: string;
  clientNom: string;
  equipementsCouverts: string;
  periodicite: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: {
    client: QuickCreatedClient;
    contract?: QuickCreatedContract;
  }) => void;
  includeContract?: boolean;
  defaultClientType?: ClientType;
}

export function QuickCreateClientModal({
  isOpen,
  onClose,
  onSuccess,
  includeContract = false,
  defaultClientType = ClientType.ENTREPRISE,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [clientData, setClientData] = useState<{
    nom: string;
    telephone: string;
    type: ClientType;
    adresse: string;
    email: string;
    contactNom: string;
  }>({
    nom: "",
    telephone: "",
    type: defaultClientType,
    adresse: "",
    email: "",
    contactNom: "",
  });

  const [contractData, setContractData] = useState<{
    periodicite: Periodicite;
    montantMainOeuvre: number;
    frequenceVisites: number;
    equipementsCouverts: string;
    dateDebut: string;
  }>({
    periodicite: Periodicite.MENSUEL,
    montantMainOeuvre: 150000,
    frequenceVisites: 1,
    equipementsCouverts: "Parc informatique et équipements de bureau sous contrat",
    dateDebut: todayStr,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setClientData({
        nom: "",
        telephone: "",
        type: defaultClientType,
        adresse: "",
        email: "",
        contactNom: "",
      });
      setContractData({
        periodicite: Periodicite.MENSUEL,
        montantMainOeuvre: 150000,
        frequenceVisites: 1,
        equipementsCouverts: "Parc informatique et équipements de bureau sous contrat",
        dateDebut: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [isOpen, defaultClientType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientData.nom.trim() || !clientData.telephone.trim()) {
      setError("Le nom et le numéro de téléphone sont obligatoires.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Créer le client
      const resClient = await fetch("/api/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      const dataClient = await resClient.json();
      if (!resClient.ok || !dataClient.success) {
        throw new Error(dataClient.message || "Erreur lors de la création du client.");
      }

      const createdClient: QuickCreatedClient = {
        id: dataClient.client.id,
        nom: dataClient.client.nom,
        telephone: dataClient.client.telephone,
        contactNom: dataClient.client.contactNom,
        type: dataClient.client.type,
      };

      // 2. Si un contrat est requis (création depuis formulaire ticket contractuel)
      let createdContract: QuickCreatedContract | undefined = undefined;

      if (includeContract) {
        const resContract = await fetch("/api/crm/contrats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: createdClient.id,
            dateDebut: contractData.dateDebut,
            dateFin: null,
            periodicite: contractData.periodicite,
            montantMainOeuvre: contractData.montantMainOeuvre,
            frequenceVisites: contractData.frequenceVisites,
            equipementsCouverts: contractData.equipementsCouverts,
          }),
        });

        const dataContract = await resContract.json();
        if (!resContract.ok || !dataContract.success) {
          throw new Error(
            dataContract.message ||
              "Client créé mais échec de création du contrat associé."
          );
        }

        createdContract = {
          id: dataContract.contract.id,
          clientId: createdClient.id,
          clientNom: createdClient.nom,
          equipementsCouverts: contractData.equipementsCouverts,
          periodicite: contractData.periodicite,
        };
      }

      onSuccess({ client: createdClient, contract: createdContract });
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-linear-to-r from-slate-50 via-white to-brand-blue/5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 border border-brand-blue/20 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full inline-block mb-1">
                {includeContract ? "Client Entreprise & Contrat" : "Enregistrement rapide"}
              </span>
              <h2 className="text-base font-extrabold text-brand-dark">
                {includeContract ? "Nouveau client sous contrat" : "Ajouter un nouveau client"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-brand-red-light border border-brand-red/30 text-brand-red text-xs flex items-center gap-2 font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type de client & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Type de client *
              </label>
              <select
                value={clientData.type}
                onChange={(e) =>
                  setClientData({ ...clientData, type: e.target.value as ClientType })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none bg-white font-medium"
              >
                <option value={ClientType.ENTREPRISE}>Entreprise / Structure (ONG, École, Clinique...)</option>
                <option value={ClientType.PARTICULIER}>Particulier</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: 01 90 88 13 14"
                value={clientData.telephone}
                onChange={(e) =>
                  setClientData({ ...clientData, telephone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-semibold text-gray-800"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">Format Bénin (10 chiffres, préfixe 01)</p>
            </div>
          </div>

          {/* Nom / Raison Sociale */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              {clientData.type === ClientType.PARTICULIER ? "Nom & Prénom(s) *" : "Nom ou Raison Sociale *"}
            </label>
            <input
              type="text"
              required
              placeholder={
                clientData.type === ClientType.PARTICULIER
                  ? "Ex: KOFFI Roland"
                  : "Ex: Cabinet Médical Saint-Luc"
              }
              value={clientData.nom}
              onChange={(e) => setClientData({ ...clientData, nom: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
            />
          </div>

          {/* Nom du contact (si entreprise/structure) */}
          {clientData.type !== ClientType.PARTICULIER && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Nom du contact / Responsable technique
              </label>
              <input
                type="text"
                placeholder="Ex: M. Jean DOSSO (DSI / Responsable)"
                value={clientData.contactNom}
                onChange={(e) =>
                  setClientData({ ...clientData, contactNom: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
              />
            </div>
          )}

          {/* Adresse & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Adresse / Quartier
              </label>
              <input
                type="text"
                placeholder="Ex: Gbégamey, Cotonou"
                value={clientData.adresse}
                onChange={(e) =>
                  setClientData({ ...clientData, adresse: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Email (optionnel)
              </label>
              <input
                type="email"
                placeholder="contact@entreprise.bj"
                value={clientData.email}
                onChange={(e) =>
                  setClientData({ ...clientData, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-blue outline-none font-medium"
              />
            </div>
          </div>

          {/* Bloc Contrat initial si includeContract est activé */}
          {includeContract && (
            <div className="mt-4 p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-brand-blue font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Paramètres du contrat de maintenance associé</span>
              </div>
              <p className="text-[10px] text-gray-600">
                Un contrat actif est obligatoire pour déclarer une panne sous contrat. Il sera automatiquement lié à cette entreprise.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">
                    Périodicité *
                  </label>
                  <select
                    value={contractData.periodicite}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        periodicite: e.target.value as Periodicite,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-bold text-gray-800 focus:ring-2 focus:ring-brand-blue outline-none"
                  >
                    <option value={Periodicite.MENSUEL}>MENSUEL</option>
                    <option value={Periodicite.TRIMESTRIEL}>TRIMESTRIEL</option>
                    <option value={Periodicite.ANNUEL}>ANNUEL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">
                    Forfait main d&apos;œuvre (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={5000}
                    value={contractData.montantMainOeuvre}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        montantMainOeuvre: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-extrabold text-brand-dark focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">
                  Équipements couverts par le contrat *
                </label>
                <textarea
                  rows={2}
                  required
                  value={contractData.equipementsCouverts}
                  onChange={(e) =>
                    setContractData({
                      ...contractData,
                      equipementsCouverts: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-medium focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>{loading ? "Création en cours..." : includeContract ? "Créer client & contrat" : "Créer le client"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
