import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { COMPANY_CONFIG } from "@/lib/config/company";

export const metadata: Metadata = {
  title: {
    template: `%s | ${COMPANY_CONFIG.name}`,
    default: `${COMPANY_CONFIG.name} | ${COMPANY_CONFIG.tagline}`,
  },
  description:
    `Expert en maintenance informatique (PC, serveurs), biomédicale, audiovisuelle (TV, vidéoprojecteurs), réseaux, vidéosurveillance et vente de matériel à ${COMPANY_CONFIG.city}, ${COMPANY_CONFIG.country}.`,
  applicationName: COMPANY_CONFIG.name,
  keywords: [
    `maintenance informatique ${COMPANY_CONFIG.city}`,
    `réparation ordinateur ${COMPANY_CONFIG.country}`,
    `maintenance biomédicale ${COMPANY_CONFIG.city}`,
    `réparation vidéoprojecteur ${COMPANY_CONFIG.country}`,
    `caméra de surveillance ${COMPANY_CONFIG.city}`,
    COMPANY_CONFIG.name,
    COMPANY_CONFIG.shortName,
    "dépannage informatique atelier",
  ],
  authors: [{ name: COMPANY_CONFIG.name }],
  metadataBase: new URL(COMPANY_CONFIG.appUrl),
  manifest: "/manifest.webmanifest",
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
    title: `${COMPANY_CONFIG.shortName} CRM`,
  },
  openGraph: {
    title: `${COMPANY_CONFIG.name} — ${COMPANY_CONFIG.tagline}`,
    description:
      `Maintenance informatique, biomédicale et audiovisuelle à ${COMPANY_CONFIG.city}. Suivi en direct et interventions rapides par des experts certifiés.`,
    url: COMPANY_CONFIG.appUrl,
    siteName: COMPANY_CONFIG.name,
    locale: "fr_FR",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: COMPANY_CONFIG.name,
  image: `${COMPANY_CONFIG.appUrl}/icons/icon-512x512.png`,
  telephone: COMPANY_CONFIG.phone,
  email: COMPANY_CONFIG.email,
  url: COMPANY_CONFIG.appUrl,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_CONFIG.address,
    addressLocality: COMPANY_CONFIG.city,
    addressCountry: "BJ",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: COMPANY_CONFIG.geo.latitude,
    longitude: COMPANY_CONFIG.geo.longitude,
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
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
