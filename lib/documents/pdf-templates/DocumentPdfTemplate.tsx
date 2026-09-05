import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { DocumentType, StatutPaiement } from "@prisma/client";
import { formatFCFA, formatNumber } from "@/lib/format";

// Définition des styles PDF respectant la charte graphique de RyHaD Tic-Medic
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1C222B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1E4D8B",
    paddingBottom: 15,
    marginBottom: 18,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E4D8B",
  },
  brandSubtitle: {
    fontSize: 8,
    color: "#2CA58D",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 2,
  },
  companyInfo: {
    fontSize: 8,
    color: "#555",
    marginTop: 4,
    lineHeight: 1.3,
  },
  docMetaBox: {
    textAlign: "right",
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1E4D8B",
  },
  docNumber: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1C222B",
    marginTop: 3,
  },
  docDate: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    alignSelf: "flex-end",
  },
  clientBox: {
    backgroundColor: "#F4F6F8",
    padding: 12,
    borderRadius: 6,
    marginBottom: 18,
  },
  clientTitle: {
    fontSize: 8,
    color: "#777",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1C222B",
  },
  clientDetails: {
    fontSize: 8,
    color: "#444",
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E4D8B",
    color: "#FFFFFF",
    padding: 6,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    padding: 6,
    fontSize: 8,
  },
  colDesc: { width: "50%" },
  colUnitPrice: { width: "20%", textAlign: "right" },
  colQty: { width: "10%", textAlign: "center" },
  colTotal: { width: "20%", textAlign: "right" },
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 25,
  },
  totalBox: {
    width: "48%",
    backgroundColor: "#F4F6F8",
    padding: 10,
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 8,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#1E4D8B",
    paddingTop: 6,
    marginTop: 4,
    fontSize: 11,
    fontWeight: "bold",
    color: "#1E4D8B",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 36,
    right: 36,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 8,
    fontSize: 7,
    color: "#888",
    lineHeight: 1.3,
  },
});

export interface PdfDocumentData {
  numero: string;
  type: DocumentType;
  typeFacture?: string | null;
  dateEmission: string;
  statutPaiement: StatutPaiement;
  montant: number;
  client: {
    nom: string;
    telephone: string;
    email?: string | null;
    adresse?: string | null;
  };
  intervention?: {
    numero: string;
    typeMateriel: string;
    panneDeclaree: string;
    diagnosticTechnicien?: string | null;
    montantMainOeuvre?: number | null;
    libelleMainOeuvre?: string | null;
    piecesUtilisees?: { designation: string; quantite: number; prixUnitaire: number }[];
  } | null;
  contract?: {
    periodicite: string;
    equipementsCouverts: string;
  } | null;
  demandeCommerciale?: {
    typeDemande: string;
    description: string;
    articles: { designation: string; quantite: number; prixUnitaire: number }[];
  } | null;
}

export function DocumentPdfTemplate({ data }: { data: PdfDocumentData }) {
  const isDiagnostic =
    data.typeFacture === "DIAGNOSTIC" || data.type === DocumentType.RECU_DIAGNOSTIC;
  const isContrat =
    data.typeFacture === "CONTRAT" || data.type === DocumentType.FACTURE_PERIODIQUE;
  const isCommercial =
    data.typeFacture === "COMMERCIALE" || !!data.demandeCommerciale;
  const isDevis = data.type === DocumentType.DEVIS;

  const getDocTypeLabel = () => {
    if (isCommercial) {
      return isDevis
        ? "DEVIS COMMERCIAL (VENTE / LOCATION / FORMATION)"
        : "FACTURE COMMERCIALE (VENTE / LOCATION / FORMATION)";
    }
    if (isDevis) {
      return "DEVIS DE RÉPARATION & PRESTATION";
    }
    if (isDiagnostic) {
      return "FACTURE DE DIAGNOSTIC TECHNIQUE";
    }
    if (isContrat) {
      return "FACTURE DE CONTRAT DE MAINTENANCE";
    }
    return "FACTURE DE RÉPARATION & PIÈCES";
  };

  const getStatusColor = (status: StatutPaiement) => {
    switch (status) {
      case StatutPaiement.PAYE:
        return { backgroundColor: "#EAF6F4", color: "#217C6A" };
      case StatutPaiement.PARTIEL:
        return { backgroundColor: "#FFF8E1", color: "#B78103" };
      case StatutPaiement.EN_ATTENTE:
        return { backgroundColor: "#FDEEEC", color: "#E2574C" };
      default:
        return { backgroundColor: "#EEEEEE", color: "#555" };
    }
  };

  const items = data.intervention?.piecesUtilisees || [];
  const montantMO = data.intervention?.montantMainOeuvre || 0;
  const libelleMO = data.intervention?.libelleMainOeuvre || "Main d'œuvre de réparation & tests atelier";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>RyHaD Tic-Medic</Text>
            <Text style={styles.brandSubtitle}>Maintenance Informatique, Biomédicale & Audiovisuelle</Text>
            <Text style={styles.companyInfo}>
              Gbégamey, rue avant le collège Clé de la réussite{"\n"}
              Cotonou, Bénin • Tél : +229 01 90 88 13 14{"\n"}
              Email : ryhadticmedic@gmail.com • Web : www.ryhad.bj
            </Text>
          </View>

          <View style={styles.docMetaBox}>
            <Text style={styles.docTitle}>{getDocTypeLabel()}</Text>
            <Text style={styles.docNumber}>N° {data.numero}</Text>
            <Text style={styles.docDate}>Date d'émission : {data.dateEmission}</Text>
            <View style={[styles.statusBadge, getStatusColor(data.statutPaiement)]}>
              <Text>STATUT : {data.statutPaiement}</Text>
            </View>
          </View>
        </View>

        {/* Client & Intervention Info */}
        <View style={styles.clientBox}>
          <Text style={styles.clientTitle}>Bénéficiaire / Client</Text>
          <Text style={styles.clientName}>{data.client.nom}</Text>
          <Text style={styles.clientDetails}>
            Téléphone : {data.client.telephone} {data.client.email ? `• ${data.client.email}` : ""}{"\n"}
            {data.client.adresse ? `Adresse : ${data.client.adresse}` : ""}
          </Text>

          {data.intervention && (
            <Text style={[styles.clientDetails, { marginTop: 4, fontWeight: "bold" }]}>
              Dossier lié : {data.intervention.numero} ({data.intervention.typeMateriel ? data.intervention.typeMateriel.replace(/_/g, " ") : "MATÉRIEL"})
            </Text>
          )}
          {data.contract && (
            <Text style={[styles.clientDetails, { marginTop: 4, fontWeight: "bold" }]}>
              Contrat lié : Périodicité {data.contract.periodicite} ({data.contract.equipementsCouverts})
            </Text>
          )}
        </View>

        {/* Tableau des prestations / Pièces */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Désignation / Prestation / Fournitures</Text>
            <Text style={styles.colUnitPrice}>P.U (FCFA)</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colTotal}>Total (FCFA)</Text>
          </View>

          {/* Cas 1 : Facture de diagnostic initial */}
          {isDiagnostic && (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>
                Examen initial, ouverture matériel et diagnostic approfondi en atelier
              </Text>
              <Text style={styles.colUnitPrice}>{formatNumber(data.montant)}</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colTotal}>{formatNumber(data.montant)}</Text>
            </View>
          )}

          {/* Cas 2 : Facture périodique de contrat */}
          {isContrat && (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>
                Forfait de maintenance préventive et curative ({data.contract?.periodicite || "Période"})
              </Text>
              <Text style={styles.colUnitPrice}>{formatNumber(data.montant)}</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colTotal}>{formatNumber(data.montant)}</Text>
            </View>
          )}

          {/* Cas Commercial : Vente de matériel, Location, Formation */}
          {isCommercial && (
            <>
              {data.demandeCommerciale?.articles && data.demandeCommerciale.articles.length > 0 ? (
                data.demandeCommerciale.articles.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.colDesc}>{item.designation}</Text>
                    <Text style={styles.colUnitPrice}>{formatNumber(item.prixUnitaire)}</Text>
                    <Text style={styles.colQty}>{item.quantite}</Text>
                    <Text style={styles.colTotal}>{formatNumber(item.prixUnitaire * item.quantite)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.tableRow}>
                  <Text style={styles.colDesc}>
                    {data.demandeCommerciale?.description || "Prestation / Fourniture commerciale"}
                  </Text>
                  <Text style={styles.colUnitPrice}>{formatNumber(data.montant)}</Text>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colTotal}>{formatNumber(data.montant)}</Text>
                </View>
              )}
            </>
          )}

          {/* Cas 3 : Devis ou Facture de réparation avec Main d'œuvre et/ou pièces */}
          {!isDiagnostic && !isContrat && !isCommercial && (
            <>
              {/* Ligne Main d'œuvre */}
              {montantMO > 0 ? (
                <View style={styles.tableRow}>
                  <Text style={styles.colDesc}>{libelleMO}</Text>
                  <Text style={styles.colUnitPrice}>{formatNumber(montantMO)}</Text>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colTotal}>{formatNumber(montantMO)}</Text>
                </View>
              ) : (
                <View style={styles.tableRow}>
                  <Text style={styles.colDesc}>Main d'œuvre technique & Déplacements (Inclus au contrat)</Text>
                  <Text style={styles.colUnitPrice}>0</Text>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colTotal}>0</Text>
                </View>
              )}

              {/* Lignes Pièces détachées */}
              {items.map((p, idx) => {
                const lineTotal = p.prixUnitaire * p.quantite;
                return (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.colDesc}>{p.designation}</Text>
                    <Text style={styles.colUnitPrice}>{formatNumber(p.prixUnitaire)}</Text>
                    <Text style={styles.colQty}>{p.quantite}</Text>
                    <Text style={styles.colTotal}>{formatNumber(lineTotal)}</Text>
                  </View>
                );
              })}

              {/* Fallback si ancien ticket sans montantMO ni pièces */}
              {montantMO === 0 && items.length === 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.colDesc}>Prestation de réparation et remise en état fonctionnel</Text>
                  <Text style={styles.colUnitPrice}>{formatNumber(data.montant)}</Text>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colTotal}>{formatNumber(data.montant)}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Total Box */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text>Total Brut Hors Taxes :</Text>
              <Text>{formatFCFA(data.montant)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>TVA (0% - Régime TPS Bénin) :</Text>
              <Text>0 FCFA</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text>NET À PAYER :</Text>
              <Text>{formatFCFA(data.montant)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            RyHaD Tic-Medic — Entreprise enregistrée à Cotonou, Bénin.{"\n"}
            Garantie sur les pièces et prestations selon conditions d'intervention. Merci pour votre confiance !
          </Text>
        </View>
      </Page>
    </Document>
  );
}
