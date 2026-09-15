/**
 * Source Unique de Vérité — Configuration de l'Entreprise et du Domaine
 * Toutes les informations relatives à l'entreprise (nom, adresse, téléphone, email, domaine)
 * sont centralisées ici et configurables dynamiquement via les variables d'environnement.
 * Plus aucune information n'est codée en dur.
 */

export const COMPANY_CONFIG = {
  // Identité
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "RyHaD Tic-Medic",
  shortName: process.env.NEXT_PUBLIC_COMPANY_SHORT_NAME || "RyHaD",
  tagline:
    process.env.NEXT_PUBLIC_COMPANY_TAGLINE ||
    "Maintenance & Solutions Tech à Cotonou",
  legalForm:
    process.env.NEXT_PUBLIC_COMPANY_LEGAL_FORM || "Entreprise de Maintenance & Solutions Tech",

  // Coordonnées géographiques
  address:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin",
  shortAddress:
    process.env.NEXT_PUBLIC_COMPANY_SHORT_ADDRESS || "Gbégamey, Cotonou, Bénin",
  city: process.env.NEXT_PUBLIC_COMPANY_CITY || "Cotonou",
  country: process.env.NEXT_PUBLIC_COMPANY_COUNTRY || "Bénin",
  geo: {
    latitude: 6.3683,
    longitude: 2.4183,
  },

  // Contact
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "+229 01 90 88 13 14",
  phoneRaw: process.env.NEXT_PUBLIC_COMPANY_PHONE_RAW || "+2290190881314",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "ryhadticmedic@gmail.com",
  notificationEmail:
    process.env.NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_COMPANY_EMAIL ||
    "ryhadticmedic@gmail.com",
  emailFrom:
    process.env.EMAIL_FROM || "RyHaD Tic-Medic <notifications@ryhad.bj>",

  // Horaires
  hours:
    process.env.NEXT_PUBLIC_COMPANY_HOURS || "Lundi – Vendredi, 9h – 20h",
  hoursShort: "Lun - Ven (9h - 20h)",

  // Domaine & URLs
  appUrl: (
    process.env.NEXT_PUBLIC_APP_URL || "https://ryhad.2krmarket.online"
  ).replace(/\/$/, ""),
  websiteDisplay:
    process.env.NEXT_PUBLIC_COMPANY_WEBSITE_DISPLAY || "ryhad.2krmarket.online",
};

/**
 * Retourne l'URL absolue de l'application (utilise le domaine du navigateur en priorité si côté client)
 */
export function getAppBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return COMPANY_CONFIG.appUrl;
}
