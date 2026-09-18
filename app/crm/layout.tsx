import { redirect } from "next/navigation";
import { auth, getCurrentUser } from "@/lib/auth";
import { CrmLayoutClient } from "@/components/layout/CrmLayoutClient";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata = {
  title: {
    template: "%s | RyHaD CRM",
    default: "RyHaD CRM",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Si l'utilisateur n'est pas connecté, redirection stricte vers la page de connexion
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <CrmLayoutClient user={user}>
      <ServiceWorkerRegister />
      {children}
    </CrmLayoutClient>
  );
}
