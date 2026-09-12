import { DocumentType, FactureType, StatutPaiement } from "@prisma/client";

export interface DocumentPrintItem {
  designation: string;
  quantite: number;
  prixUnitaire: number;
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
