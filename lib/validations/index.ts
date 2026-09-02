import { z } from "zod";
import { TypeMateriel, ModeIntervention, TypeDemandeCommerciale, Periodicite, ClientType, StaffRole } from "@prisma/client";

// Formulaire public de demande d'intervention
export const interventionRequestSchema = z.object({
  nom: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  telephone: z.string().min(8, "Numéro de téléphone invalide (ex: +229 01 90 88 13 14)"),
  email: z.string().email("Adresse email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
  typeMateriel: z.nativeEnum(TypeMateriel, {
    errorMap: () => ({ message: "Veuillez sélectionner un type de matériel valide" }),
  }),
  panneDeclaree: z.string().min(10, "Veuillez décrire le problème rencontré en au moins 10 caractères"),
  modeIntervention: z.nativeEnum(ModeIntervention, {
    errorMap: () => ({ message: "Veuillez sélectionner un mode d'intervention" }),
  }),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export type InterventionRequestInput = z.infer<typeof interventionRequestSchema>;

// Formulaire public de demande commerciale (Vente / Location / Formation)
export const commercialRequestSchema = z.object({
  nom: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  telephone: z.string().min(8, "Numéro de téléphone requis"),
  email: z.string().email("Adresse email invalide").optional().or(z.literal("")),
  entreprise: z.string().optional(),
  typeDemande: z.nativeEnum(TypeDemandeCommerciale, {
    errorMap: () => ({ message: "Veuillez sélectionner le type de demande" }),
  }),
  description: z.string().min(10, "Veuillez préciser votre besoin (quantités, durée, options...)"),
});

export type CommercialRequestInput = z.infer<typeof commercialRequestSchema>;

// Création / Modification de Client
export const clientFormSchema = z.object({
  type: z.nativeEnum(ClientType),
  nom: z.string().min(2, "Nom requis"),
  contactNom: z.string().optional(),
  telephone: z.string().min(8, "Téléphone requis"),
  email: z.string().email().optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;

// Création / Modification de Contrat
export const contractFormSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().optional(),
  periodicite: z.nativeEnum(Periodicite),
  montantMainOeuvre: z.number().min(0, "Montant invalide"),
  equipementsCouverts: z.string().min(3, "Description des équipements requise"),
});

export type ContractFormInput = z.infer<typeof contractFormSchema>;

// Création de ticket ponctuel (CRM)
export const ticketPonctuelCrmSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  typeMateriel: z.nativeEnum(TypeMateriel),
  panneDeclaree: z.string().min(5, "Description de panne requise"),
  modeIntervention: z.nativeEnum(ModeIntervention),
  montantDiagnostic: z
    .number({ required_error: "Le montant du diagnostic est requis" })
    .min(1000, "Les frais de diagnostic doivent être d'au moins 1 000 FCFA")
    .default(1000),
  technicienAssigneId: z.string().optional(),
});

// Création de ticket contractuel (CRM)
export const ticketContractuelCrmSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  contractId: z.string().min(1, "Contrat de rattachement requis"),
  typeMateriel: z.nativeEnum(TypeMateriel),
  panneDeclaree: z.string().min(5, "Motif d'intervention requis"),
  modeIntervention: z.nativeEnum(ModeIntervention),
  technicienAssigneId: z.string().optional(),
});
