import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ryhad.2krdigital.online";

export const metadata: Metadata = {
  title: {
    template: "%s | RyHaD Tic-Medic",
    default: "RyHaD Tic-Medic | Maintenance & Solutions Tech à Cotonou",
  },
  description:
    "Expert en maintenance informatique (PC, serveurs), biomédicale, audiovisuelle (TV, vidéoprojecteurs), réseaux, vidéosurveillance et vente de matériel à Cotonou, Bénin.",
  applicationName: "RyHaD Tic-Medic",
  keywords: [
    "maintenance informatique Cotonou",
    "réparation ordinateur Bénin",
    "maintenance biomédicale Cotonou",
    "réparation vidéoprojecteur Bénin",
    "caméra de surveillance Cotonou",
    "RyHaD Tic-Medic",
    "dépannage informatique Gbégamey",
  ],
  authors: [{ name: "RyHaD Tic-Medic" }],
  metadataBase: new URL(appUrl),
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RyHaD CRM",
  },
  openGraph: {
    title: "RyHaD Tic-Medic — Maintenance & Solutions Tech à Cotonou",
    description:
      "Maintenance informatique, biomédicale et audiovisuelle à Cotonou. Suivi en direct et interventions rapides par des experts certifiés.",
    url: appUrl,
    siteName: "RyHaD Tic-Medic",
    locale: "fr_FR",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "RyHaD Tic-Medic",
  image: `${appUrl}/icons/icon-512x512.png`,
  telephone: "+229 01 90 88 13 14",
  email: "ryhadticmedic@gmail.com",
  url: appUrl,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Gbégamey, rue avant le collège Clé de la réussite",
    addressLocality: "Cotonou",
    addressCountry: "BJ",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 6.3683,
    longitude: 2.4183,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "20:00",
    },
  ],
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={montserrat.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1E4D8B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${montserrat.className} bg-white text-brand-dark min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
