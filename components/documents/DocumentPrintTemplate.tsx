"use client";

import React from "react";
import { DocumentPrintData } from "@/types/documents";
import { DocumentType, StatutPaiement } from "@prisma/client";
import { formatFCFA, formatNumber } from "@/lib/format";

interface Props {
  data: DocumentPrintData;
  format: "a4" | "ticket";
}

export function DocumentPrintTemplate({ data, format: printFormat }: Props) {
  const isDiagnostic =
    data.typeFacture === "DIAGNOSTIC" || data.type === DocumentType.RECU_DIAGNOSTIC;
  const isContrat =
    data.typeFacture === "CONTRAT" || data.type === DocumentType.FACTURE_PERIODIQUE;
  const isCommercial =
    data.typeFacture === "COMMERCIALE" || !!data.demandeCommerciale;
  const isDevis = data.type === DocumentType.DEVIS;

  const getDocTypeTitle = () => {
    if (isCommercial) {
      return isDevis
        ? "DEVIS COMMERCIAL"
        : "FACTURE COMMERCIALE";
    }
    if (isDevis) {
      return "DEVIS ESTIMATIF DE RÉPARATION";
    }
    if (isDiagnostic) {
      return "REÇU & FACTURE DE DIAGNOSTIC";
    }
    if (isContrat) {
      return "FACTURE CONTRAT DE MAINTENANCE";
    }
    return "FACTURE DE RÉPARATION & PIÈCES";
  };

  const isPaid = data.statutPaiement === StatutPaiement.PAYE;

  const items = data.intervention?.piecesUtilisees || [];
  const montantMO = data.intervention?.montantMainOeuvre || 0;
  const libelleMO = data.intervention?.libelleMainOeuvre || "Main d'œuvre technique & expertise atelier";

  // ============================================================================
  // FORMAT TICKET THERMIQUE 80 MM (Pour imprimantes de caisse & reçus au comptoir)
  // ============================================================================
  if (printFormat === "ticket") {
    return (
      <div className="print-ticket-root font-sans text-slate-900 bg-white">
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          @media print {
            html, body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .print-ticket-container {
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 auto !important;
              padding: 2mm 3mm !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}} />

        <div className="print-ticket-container mx-auto max-w-[340px] w-full p-4 bg-white border border-dashed border-slate-300 sm:rounded-xl shadow-xs text-xs">
          {/* Header Ticket */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
              RyHaD Tic-Medic
            </h1>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mt-0.5">
              Maintenance Informatique & Médicale
            </p>
            <p className="text-[10px] text-slate-600 mt-1 leading-tight">
              Gbégamey, rue avant collège Clé de la réussite<br />
              Cotonou, Bénin • Tél : +229 01 90 88 13 14
            </p>
          </div>

          {/* Métadonnées du Ticket */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between items-center font-extrabold text-slate-900">
              <span className="uppercase">{getDocTypeTitle()}</span>
              <span>N° {data.numero}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px]">
              <span>Date : {data.dateEmission}</span>
              {data.datePaiement && <span>Payé le : {data.datePaiement}</span>}
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-slate-700">Client :</span>
              <span className="font-extrabold text-slate-950 text-right truncate max-w-[190px]">
                {data.client.nom}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-600">
              <span>Téléphone :</span>
              <span>{data.client.telephone}</span>
            </div>
            {data.intervention && (
              <div className="flex justify-between items-center text-[10px] pt-0.5">
                <span className="font-bold text-slate-700">Dossier :</span>
                <span className="font-bold text-brand-blue">{data.intervention.numero} ({data.intervention.typeMateriel.replace(/_/g, " ")})</span>
              </div>
            )}
            {data.contract && (
              <div className="flex justify-between items-center text-[10px] pt-0.5">
                <span className="font-bold text-slate-700">Contrat :</span>
                <span className="font-bold text-purple-700">{data.contract.periodicite}</span>
              </div>
            )}
          </div>

          {/* Lignes Articles / Prestations */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 pb-1">
              <span>Désignation</span>
              <span>Total</span>
            </div>

            {/* Diagnostic */}
            {isDiagnostic && (
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <span className="font-bold block">Frais diagnostic technique initial</span>
                  <span className="text-[10px] text-slate-500">1 x {formatNumber(data.montant)} FCFA</span>
                </div>
                <span className="font-extrabold">{formatNumber(data.montant)}</span>
              </div>
            )}

            {/* Contrat */}
            {isContrat && (
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <span className="font-bold block">Forfait maintenance ({data.contract?.periodicite || "Période"})</span>
                  <span className="text-[10px] text-slate-500">1 x {formatNumber(data.montant)} FCFA</span>
                </div>
                <span className="font-extrabold">{formatNumber(data.montant)}</span>
              </div>
            )}

            {/* Commercial */}
            {isCommercial && (
              <>
                {data.demandeCommerciale?.articles && data.demandeCommerciale.articles.length > 0 ? (
                  data.demandeCommerciale.articles.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <span className="font-bold block">{item.designation}</span>
                        <span className="text-[10px] text-slate-500">{item.quantite} x {formatNumber(item.prixUnitaire)} FCFA</span>
                      </div>
                      <span className="font-extrabold">{formatNumber(item.quantite * item.prixUnitaire)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <span className="font-bold block">{data.demandeCommerciale?.description || "Prestation commerciale"}</span>
                    </div>
                    <span className="font-extrabold">{formatNumber(data.montant)}</span>
                  </div>
                )}
              </>
            )}

            {/* Réparation Standard (Main d'œuvre + Pièces) */}
            {!isDiagnostic && !isContrat && !isCommercial && (
              <>
                {montantMO > 0 && (
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <span className="font-bold block">{libelleMO}</span>
                      <span className="text-[10px] text-slate-500">Main d&apos;œuvre atelier</span>
                    </div>
                    <span className="font-extrabold">{formatNumber(montantMO)}</span>
                  </div>
                )}

                {items.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <span className="font-bold block">{p.designation}</span>
                      <span className="text-[10px] text-slate-500">{p.quantite} x {formatNumber(p.prixUnitaire)} FCFA</span>
                    </div>
                    <span className="font-extrabold">{formatNumber(p.quantite * p.prixUnitaire)}</span>
                  </div>
                ))}

                {montantMO === 0 && items.length === 0 && (
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <span className="font-bold block">Prestation de réparation</span>
                    </div>
                    <span className="font-extrabold">{formatNumber(data.montant)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Totaux & Règlement */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between items-center text-sm font-black">
              <span className="uppercase">NET À PAYER :</span>
              <span className="text-base text-slate-950">{formatFCFA(data.montant)}</span>
            </div>

            <div className="pt-1 flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-600">Statut :</span>
              <span className={`px-1.5 py-0.5 rounded font-black ${
                isPaid ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}>
                {isPaid ? "PAYÉ / ENCAISSÉ" : "EN ATTENTE"}
              </span>
            </div>

            {data.modePaiement && (
              <div className="flex justify-between items-center text-[10px] text-slate-600">
                <span>Règlement :</span>
                <span className="font-bold text-slate-800">{data.modePaiement.replace(/_/g, " ")}</span>
              </div>
            )}
            {data.referencePaiement && (
              <div className="flex justify-between items-center text-[10px] text-slate-600">
                <span>Réf Transaction :</span>
                <span className="font-mono text-slate-800">{data.referencePaiement}</span>
              </div>
            )}
          </div>

          {/* Pied de Ticket & Suivi Web */}
          <div className="pt-3 text-center space-y-1.5 text-[10px] text-slate-500">
            {data.intervention?.numero && (
              <div className="p-1.5 rounded bg-slate-100 font-mono text-[10px] text-slate-800 font-bold">
                Suivez votre matériel sur :<br />
                <span className="text-brand-blue font-extrabold">www.ryhad.bj/suivi/{data.intervention.numero}</span>
              </div>
            )}
            <p className="font-bold text-slate-700">
              Merci pour votre confiance !
            </p>
            <p className="text-[9px] text-slate-400 leading-tight">
              RyHaD Tic-Medic • Gbégamey, Cotonou
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // FORMAT A4 OFFICIEL (Standard Entreprises, Devis et Factures Complètes)
  // ============================================================================
  return (
    <div className="print-a4-root font-sans text-slate-900 bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        @media print {
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-a4-container {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 5mm !important;
            box-shadow: none !important;
            border: none !important;
            height: auto !important;
            min-height: auto !important;
          }
          table {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      <div className="print-a4-container mx-auto max-w-[800px] w-full p-8 sm:p-10 bg-white border border-slate-200 sm:rounded-2xl shadow-sm text-xs">
        {/* En-tête officiel RyHaD */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-[#1E4D8B]">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-[#1E4D8B]">
              RyHaD Tic-Medic
            </h1>
            <p className="text-[11px] font-bold text-[#2CA58D] uppercase tracking-wider">
              Maintenance Informatique, Biomédicale & Audiovisuelle
            </p>
            <div className="text-[10px] text-slate-600 leading-relaxed pt-1">
              <p>Gbégamey, rue avant le collège Clé de la réussite</p>
              <p>Cotonou, Bénin • Tél : +229 01 90 88 13 14</p>
              <p>Email : ryhadticmedic@gmail.com • Web : www.ryhad.bj</p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 shrink-0">
            <span className="inline-block text-xs font-black uppercase text-[#1E4D8B] tracking-wide">
              {getDocTypeTitle()}
            </span>
            <div className="text-lg font-black text-slate-900 tracking-tight">
              N° {data.numero}
            </div>
            <div className="text-[11px] text-slate-500">
              Date d&apos;émission : <span className="font-semibold text-slate-800">{data.dateEmission}</span>
            </div>
            <div className="pt-1">
              <span
                className={`inline-block px-3 py-1 rounded-md text-[10px] font-black border uppercase ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : isDevis
                    ? "bg-blue-50 text-brand-blue border-blue-300"
                    : "bg-amber-50 text-amber-900 border-amber-300"
                }`}
              >
                Statut : {data.statutPaiement}
              </span>
            </div>
          </div>
        </div>

        {/* Bloc Bénéficiaire & Références */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Bénéficiaire / Client
            </span>
            <div className="text-sm font-extrabold text-slate-900">{data.client.nom}</div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Téléphone : <span className="font-medium">{data.client.telephone}</span>
            </div>
            {data.client.email && (
              <div className="text-[11px] text-slate-600">Email : {data.client.email}</div>
            )}
            {data.client.adresse && (
              <div className="text-[11px] text-slate-500">Adresse : {data.client.adresse}</div>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Dossier & Références
            </span>
            {data.intervention && (
              <>
                <div className="text-xs font-bold text-slate-800">
                  Dossier N° <span className="text-brand-blue font-extrabold">{data.intervention.numero}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Matériel : <span className="font-semibold">{data.intervention.typeMateriel.replace(/_/g, " ")}</span>
                </div>
                {data.intervention.panneDeclaree && (
                  <div className="text-[10px] text-slate-500 italic max-w-xs sm:ml-auto truncate">
                    Motif : {data.intervention.panneDeclaree}
                  </div>
                )}
              </>
            )}
            {data.contract && (
              <>
                <div className="text-xs font-bold text-slate-800">
                  Contrat de maintenance ({data.contract.periodicite})
                </div>
                <div className="text-[11px] text-slate-500">
                  Couverture : {data.contract.equipementsCouverts}
                </div>
              </>
            )}
            {data.demandeCommerciale && (
              <div className="text-xs font-bold text-purple-800">
                Type : {data.demandeCommerciale.typeDemande}
              </div>
            )}
          </div>
        </div>

        {/* Tableau des prestations / Pièces */}
        <div className="overflow-hidden rounded-xl border border-slate-200 mb-6 avoid-break">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E4D8B] text-white font-extrabold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Désignation / Prestation / Fournitures</th>
                <th className="py-2.5 px-4 text-right">P.U (FCFA)</th>
                <th className="py-2.5 px-4 text-center">Qté</th>
                <th className="py-2.5 px-4 text-right">Total (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {/* Cas 1 : Facture Diagnostic */}
              {isDiagnostic && (
                <tr>
                  <td className="py-3 px-4 font-medium">
                    Examen technique initial, ouverture du matériel et diagnostic approfondi en atelier
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumber(data.montant)}</td>
                  <td className="py-3 px-4 text-center">1</td>
                  <td className="py-3 px-4 text-right font-bold">{formatNumber(data.montant)}</td>
                </tr>
              )}

              {/* Cas 2 : Facture Contrat */}
              {isContrat && (
                <tr>
                  <td className="py-3 px-4 font-medium">
                    Forfait de maintenance préventive et curative ({data.contract?.periodicite || "Période"})
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumber(data.montant)}</td>
                  <td className="py-3 px-4 text-center">1</td>
                  <td className="py-3 px-4 text-right font-bold">{formatNumber(data.montant)}</td>
                </tr>
              )}

              {/* Cas 3 : Commercial */}
              {isCommercial && (
                <>
                  {data.demandeCommerciale?.articles && data.demandeCommerciale.articles.length > 0 ? (
                    data.demandeCommerciale.articles.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-4 font-medium">{item.designation}</td>
                        <td className="py-2.5 px-4 text-right">{formatNumber(item.prixUnitaire)}</td>
                        <td className="py-2.5 px-4 text-center">{item.quantite}</td>
                        <td className="py-2.5 px-4 text-right font-bold">
                          {formatNumber(item.prixUnitaire * item.quantite)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 px-4 font-medium">
                        {data.demandeCommerciale?.description || "Fourniture commerciale"}
                      </td>
                      <td className="py-3 px-4 text-right">{formatNumber(data.montant)}</td>
                      <td className="py-3 px-4 text-center">1</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(data.montant)}</td>
                    </tr>
                  )}
                </>
              )}

              {/* Cas 4 : Réparation standard (MO + Pièces) */}
              {!isDiagnostic && !isContrat && !isCommercial && (
                <>
                  {montantMO > 0 ? (
                    <tr>
                      <td className="py-3 px-4 font-medium">
                        <span className="font-bold text-slate-900 block">{libelleMO}</span>
                        <span className="text-[10px] text-slate-500">Expertise technique, réparation et contrôle qualité atelier</span>
                      </td>
                      <td className="py-3 px-4 text-right">{formatNumber(montantMO)}</td>
                      <td className="py-3 px-4 text-center">1</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(montantMO)}</td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        Main d&apos;œuvre technique (Inclus / Hors facturation)
                      </td>
                      <td className="py-3 px-4 text-right">0</td>
                      <td className="py-3 px-4 text-center">1</td>
                      <td className="py-3 px-4 text-right font-bold">0</td>
                    </tr>
                  )}

                  {items.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 font-medium">{p.designation}</td>
                      <td className="py-2.5 px-4 text-right">{formatNumber(p.prixUnitaire)}</td>
                      <td className="py-2.5 px-4 text-center">{p.quantite}</td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        {formatNumber(p.prixUnitaire * p.quantite)}
                      </td>
                    </tr>
                  ))}

                  {montantMO === 0 && items.length === 0 && (
                    <tr>
                      <td className="py-3 px-4 font-medium">Prestation de réparation et remise en état fonctionnel</td>
                      <td className="py-3 px-4 text-right">{formatNumber(data.montant)}</td>
                      <td className="py-3 px-4 text-center">1</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNumber(data.montant)}</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux & Signature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start avoid-break">
          {/* Informations de paiement & mentions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
            <span className="font-extrabold text-slate-800 block text-xs">Détails du Règlement</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut :</span>
              <span className="font-extrabold text-slate-900">{data.statutPaiement}</span>
            </div>
            {data.modePaiement && (
              <div className="flex justify-between">
                <span className="text-slate-500">Mode :</span>
                <span className="font-bold text-slate-800">{data.modePaiement.replace(/_/g, " ")}</span>
              </div>
            )}
            {data.referencePaiement && (
              <div className="flex justify-between">
                <span className="text-slate-500">Référence :</span>
                <span className="font-mono text-slate-800">{data.referencePaiement}</span>
              </div>
            )}
            {data.datePaiement && (
              <div className="flex justify-between text-[10px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                <span>Encaissé le :</span>
                <span>{data.datePaiement}</span>
              </div>
            )}
          </div>

          {/* Totaux financiers */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Total Brut Hors Taxes :</span>
              <span className="font-bold">{formatFCFA(data.montant)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>TVA (0% - Régime TPS Bénin) :</span>
              <span>0 FCFA</span>
            </div>
            <div className="pt-2 border-t-2 border-[#1E4D8B] flex justify-between items-center">
              <span className="font-black text-sm text-[#1E4D8B]">NET À PAYER :</span>
              <span className="font-black text-base text-[#1E4D8B]">{formatFCFA(data.montant)}</span>
            </div>
          </div>
        </div>

        {/* Bloc Signature / Tampon & Mentions de garantie */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500 avoid-break">
          <div className="max-w-md space-y-1">
            <p className="font-bold text-slate-700">Conditions & Garantie :</p>
            <p>
              Garantie sur les pièces détachées et la main d&apos;œuvre selon les conditions générales de service.
              Tout matériel réparé non retiré au-delà de 3 mois fera l&apos;objet de frais de gardiennage.
            </p>
          </div>

          <div className="w-48 text-center border-t border-dashed border-slate-400 pt-2 shrink-0">
            <span className="font-bold text-slate-800 block text-[11px]">Pour RyHaD Tic-Medic</span>
            <span className="text-[9px] text-slate-400 italic">Signature & Cachet autorisés</span>
          </div>
        </div>
      </div>
    </div>
  );
}
