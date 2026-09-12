import { DocumentType, FactureType, StatutPaiement } from "@prisma/client";

export interface DocumentPrintItem {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface DocumentPaymentTransaction {
  id?: string;
  montant: number;
  modePaiement: string;
  referencePaiement?: string | null;
  datePaiement: string;
  note?: string | null;
}

export interface DocumentPrintData {
  id?: string;
  numero: string;
  type: DocumentType;
  typeFacture?: FactureType | string | null;
  dateEmission: string;
  datePaiement?: string | null;
  statutPaiement: StatutPaiement;
  modePaiement?: string | null;
  referencePaiement?: string | null;
  montant: number;
  montantPaye?: number;
  resteAPayer?: number;
  transactions?: DocumentPaymentTransaction[];
  client: {
    nom: string;
    telephone: string;
    email?: string | null;
    adresse?: string | null;
  };
  intervention?: {
    id?: string;
    numero: string;
    typeMateriel: string;
    panneDeclaree: string;
    diagnosticTechnicien?: string | null;
    montantMainOeuvre?: number | null;
    libelleMainOeuvre?: string | null;
    piecesUtilisees: DocumentPrintItem[];
  } | null;
  contract?: {
    id?: string;
    periodicite: string;
    equipementsCouverts: string;
  } | null;
  demandeCommerciale?: {
    id?: string;
    typeDemande: string;
    description: string;
    articles: DocumentPrintItem[];
  } | null;
}
