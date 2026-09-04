"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Wrench, Phone, Mail, CheckCircle2, ArrowRight, ShieldCheck, Search, Eye, Clock, UserCheck } from "lucide-react";
import { TicketStatusBadge } from "@/components/crm/TicketStatusBadge";
import { QuickViewModal, QuickViewData } from "@/components/crm/QuickViewModal";

interface TechnicianItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  interventionsAssignees: {
    id: string;
    numero: string;
    statut: any;
    typeMateriel: string;
    client: {
      nom: string;
    };
  }[];
}

interface Props {
  technicians: TechnicianItem[];
}

export function TechniciansGrid({ technicians }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const filteredTechs = useMemo(() => {
    if (!searchTerm.trim()) return technicians;
    const term = searchTerm.toLowerCase();
    return technicians.filter((t) => {
      const name = `${t.firstName} ${t.lastName}`.toLowerCase();
      const email = t.email.toLowerCase();
      const phone = (t.phone || "").toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }, [technicians, searchTerm]);

  const handleOpenQuickView = (tech: TechnicianItem) => {
    setQuickViewData({
      type: "CLIENT",
      title: `${tech.firstName} ${tech.lastName}`,
      subtitle: `${tech.role === "ADMIN" ? "Admin Référent" : "Technicien Spécialisé"} — ${tech.interventionsAssignees.length} dossiers actifs`,
      badge: {
        label: `${tech.interventionsAssignees.length} en cours`,
        className: "bg-brand-blue-light text-brand-blue border-brand-blue/30",
      },
      clientName: `${tech.firstName} ${tech.lastName}`,
      clientPhone: tech.phone || undefined,
      details: [
        { label: "Nom complet", value: `${tech.firstName} ${tech.lastName}` },
        { label: "Email professionnel", value: tech.email },
        { label: "Téléphone direct", value: tech.phone || "Non renseigné" },
        { label: "Rôle", value: tech.role },
        {
          label: "Dossiers en cours de diagnostic/réparation",
          value:
            tech.interventionsAssignees.length > 0 ? (
              <div className="space-y-1.5">
                {tech.interventionsAssignees.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span>
                      <strong className="text-brand-blue">{t.numero}</strong> : {t.client.nom} ({t.typeMateriel.replace(/_/g, " ")})
                    </span>
                    <Link href={`/crm/tickets/${t.id}`} className="text-brand-green font-bold hover:underline text-[11px] ml-2">
                      Voir →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              "Aucun dossier en cours"
            ),
        },
      ],
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Barre de Recherche */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher un technicien..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue shadow-2xs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTechs.map((tech) => (
          <div
            key={tech.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 subtle-shadow space-y-5"
          >
            {/* Header Technicien */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
                  {tech.firstName.charAt(0)}
                  {tech.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm">
                    {tech.firstName} {tech.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {tech.role === "ADMIN" ? "Admin Référent" : "Technicien Spécialisé"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQuickView(tech)}
                  title="Aperçu rapide"
                  className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-brand-blue hover:border-brand-blue hover:bg-blue-50 transition-all shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                  {tech.interventionsAssignees.length} en cours
                </span>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              {tech.phone && (
                <div className="flex items-center gap-1.5 font-semibold text-brand-dark">
                  <Phone className="w-3.5 h-3.5 text-brand-green" />
                  <span>{tech.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-blue" />
                <span>{tech.email}</span>
              </div>
            </div>

            {/* Liste des interventions en cours (limitée aux 3 plus récentes) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Dossiers en cours ({tech.interventionsAssignees.length})
                </span>
                {tech.interventionsAssignees.length > 3 && (
                  <span className="text-[10px] font-medium text-gray-500">
                    Affichage des 3 derniers
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {tech.interventionsAssignees.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-brand-slate/60 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-brand-blue">{t.numero}</div>
                      <span className="text-gray-700 font-semibold">{t.client.nom}</span>
                      <p className="text-[11px] text-gray-500">{t.typeMateriel.replace(/_/g, " ")}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <TicketStatusBadge statut={t.statut} />
                      <Link
                        href={`/crm/tickets/${t.id}`}
                        className="text-[11px] font-bold text-brand-blue hover:underline flex items-center gap-1"
                      >
                        <span>Ouvrir</span>
                        <ArrowRight className="w-3 h-3 text-brand-green" />
                      </Link>
                    </div>
                  </div>
                ))}

                {tech.interventionsAssignees.length > 3 && (
                  <button
                    type="button"
                    onClick={() => handleOpenQuickView(tech)}
                    className="w-full py-2 px-3 text-center text-[11px] font-bold text-brand-blue bg-brand-blue-light/50 hover:bg-brand-blue-light border border-brand-blue/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>
                      Voir les {tech.interventionsAssignees.length - 3} autre{tech.interventionsAssignees.length - 3 > 1 ? "s" : ""} dossier{tech.interventionsAssignees.length - 3 > 1 ? "s" : ""}
                    </span>
                    <ArrowRight className="w-3 h-3 text-brand-blue" />
                  </button>
                )}

                {tech.interventionsAssignees.length === 0 && (
                  <div className="text-xs text-gray-400 italic py-3 text-center bg-brand-slate/40 rounded-2xl">
                    Aucun dossier en cours assigné.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTechs.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 text-xs bg-white rounded-3xl border border-gray-200">
            Aucun technicien ne correspond à la recherche.
          </div>
        )}
      </div>

      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={quickViewData}
      />
    </div>
  );
}
