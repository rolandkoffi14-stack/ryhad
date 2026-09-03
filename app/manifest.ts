import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RyHaD Tic-Medic — Maintenance & Gestion",
    short_name: "RyHaD",
    description: "Application de maintenance informatique, biomédicale et audiovisuelle à Cotonou, Bénin.",
    start_url: "/crm",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E4D8B",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/images/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/images/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/images/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
