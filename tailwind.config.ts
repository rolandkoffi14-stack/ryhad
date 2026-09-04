import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      colors: {
        brand: {
          blue: "#1E4D8B",       // Bleu Confiance (Primaire Marque)
          "blue-dark": "#153663",
          "blue-light": "#EBF2FA",
          green: "#2CA58D",      // Vert Maintenance (Accent Conversion / Action)
          "green-dark": "#217C6A",
          "green-light": "#EAF6F4",
          slate: "#F4F6F8",      // Gris Ardoise (Surfaces neutres claires)
          surface: "#F8FAFC",    // Surface alternée douce
          dark: "#1C222B",       // Anthracite (Texte & Navigation sombre)
          "dark-surface": "#111827", // Surface sombre profonde
          red: "#E2574C",        // Rouge Urgence / Alerte
          "red-light": "#FDEEEC",
          amber: "#D97706",      // Ambre Attente / Attention
          "amber-light": "#FEF3C7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
