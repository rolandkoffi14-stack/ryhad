import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/crm",
    name: "RyHaD Tic-Medic CRM",
    short_name: "RyHaD CRM",
    description: "Application de gestion CRM interne — RyHaD Tic-Medic (Cotonou)",
    start_url: "/crm",
    scope: "/crm",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E4D8B",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "utilities"],
    shortcuts: [
      {
        name: "Tableau de bord CRM",
        short_name: "Dashboard",
        description: "Accéder au tableau de bord CRM",
        url: "/crm",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Tickets Ponctuels",
        short_name: "Ponctuels",
        description: "Gérer les tickets d'intervention ponctuelle",
        url: "/crm/tickets/ponctuel",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Tickets Contrats",
        short_name: "Contrats",
        description: "Gérer les interventions sous contrat",
        url: "/crm/tickets/contractuel",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
