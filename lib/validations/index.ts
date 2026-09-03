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

// ============================================================================
// 19. POLITIQUE DE ROBUSTESSE DES MOTS DE PASSE (STAFF)
// ============================================================================
export const strongPasswordSchema = z
  .string()
  .min(10, "Le mot de passe doit comporter au moins 10 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)");

export const userCreateSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Adresse email valide requise"),
  password: strongPasswordSchema,
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(StaffRole),
  assignableAsTechnician: z.boolean().default(false),
});

// ============================================================================
// 7. SCHÉMAS DE VALIDATION SERVEUR DES MUTATIONS DE TICKETS (CRM)
// ============================================================================
export const ticketUpdateStatusSchema = z.object({
  actionType: z.literal("update_status"),
  newStatut: z.string().min(1, "Nouveau statut requis"),
});

export const ticketUpdateDiagnosticSchema = z.object({
  actionType: z.literal("update_diagnostic"),
  diagnosticTechnicien: z.string().min(3, "Rapport technique trop court (min 3 caractères)"),
});

export const ticketUpdateMainOeuvreSchema = z.object({
  actionType: z.literal("update_main_oeuvre"),
  montantMainOeuvre: z.union([z.number().min(0), z.string().regex(/^\d+$/)]),
  libelleMainOeuvre: z.string().optional(),
});

export const ticketAddPieceSchema = z.object({
  actionType: z.literal("add_piece"),
  newPiece: z.object({
    designation: z.string().min(2, "Désignation de pièce requise"),
    quantite: z.union([z.number().min(1), z.string()]),
    prixUnitaire: z.union([z.number().min(0), z.string()]),
  }),
});

export const ticketDeletePieceSchema = z.object({
  actionType: z.literal("delete_piece"),
  pieceId: z.string().min(1, "Identifiant de pièce requis"),
});

export const ticketReassignTechSchema = z.object({
  actionType: z.literal("reassign_technician"),
  technicienId: z.string().nullable().optional(),
});

export const ticketEncaisserDiagSchema = z.object({
  actionType: z.literal("encaisser_diagnostic"),
  modePaiement: z.string().optional(),
  referencePaiement: z.string().nullable().optional(),
});

export const ticketEncaisserRepSchema = z.object({
  actionType: z.literal("encaisser_reparation"),
  modePaiement: z.string().optional(),
  referencePaiement: z.string().nullable().optional(),
});
