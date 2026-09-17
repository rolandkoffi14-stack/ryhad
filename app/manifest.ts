import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RyHaD Tic-Medic",
    short_name: "RyHaD",
    description: "Maintenance Informatique, Biomédicale & CRM — RyHaD Tic-Medic (Cotonou)",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E4D8B",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "utilities"],
    shortcuts: [
      {
        name: "Tableau de bord CRM",
        short_name: "CRM",
        description: "Accéder à l'espace de gestion RyHaD",
        url: "/crm",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Suivi de réparation",
        short_name: "Suivi",
        description: "Suivre l'état d'un dossier de réparation",
        url: "/suivi",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Demande d'intervention",
        short_name: "Intervention",
        description: "Déposer une demande de réparation ou maintenance",
        url: "/demande-intervention",
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
