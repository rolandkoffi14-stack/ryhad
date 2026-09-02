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
          blue: "#1E4D8B",       // Bleu Confiance
          "blue-dark": "#153663",
          "blue-light": "#EBF2FA",
          green: "#2CA58D",      // Vert Maintenance
          "green-dark": "#217C6A",
          "green-light": "#EAF6F4",
          slate: "#F4F6F8",      // Gris Ardoise
          dark: "#1C222B",       // Anthracite
          red: "#E2574C",        // Rouge Urgence
          "red-light": "#FDEEEC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
