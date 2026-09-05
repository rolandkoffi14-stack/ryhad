import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/crm",
    name: "RyHaD CRM",
    short_name: "RyHaD CRM",
    description: "Gestion d'Atelier & Maintenance — RyHaD Tic-Medic",
    start_url: "/crm",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E4D8B",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "Tableau de bord",
        short_name: "Dashboard",
        description: "Accéder au tableau de bord CRM",
        url: "/crm",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Tickets Ponctuels",
        short_name: "Ponctuel",
        description: "Suivre les tickets de réparation ponctuelle",
        url: "/crm/tickets/ponctuel",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Contrats de Maintenance",
        short_name: "Contrats",
        description: "Consulter les contrats et visites planifiées",
        url: "/crm/contrats",
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
