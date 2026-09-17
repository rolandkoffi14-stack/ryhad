import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { DocumentPrintData } from "@/types/documents";
import { DocumentType } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PublicDocumentClient } from "./PublicDocumentClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ format?: string; auto?: string; phone?: string; phoneSuffix?: string }>;
}

function maskClientName(name: string): string {
  if (!name) return "Client";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].length > 2 ? `${parts[0].slice(0, 2)}***` : `${parts[0]}***`;
  }
  return parts
    .map((part, index) => {
      if (index === 0) return part;
      return `${part.charAt(0)}.`;
    })
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  const cleanNum = decodeURIComponent(numero).toUpperCase().trim();
  return {
    title: `Document ${cleanNum} | RyHaD Tic-Medic`,
    description: `Consultez votre facture ou devis officiel ${cleanNum} émis par RyHaD Tic-Medic à Cotonou.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicDocumentPage({ params, searchParams }: Props) {
  const { numero } = await params;
  const { format: reqFormat, auto, phone, phoneSuffix } = await searchParams;

  const cleanNum = decodeURIComponent(numero).toUpperCase().trim();

  const doc = await db.financialDocument.findUnique({
    where: { numero: cleanNum },
    include: {
      intervention: {
        include: {
          client: true,
          piecesUtilisees: true,
        },
      },
      contract: {
        include: {
          client: true,
        },
      },
      demandeCommerciale: {
        include: {
          client: true,
        },
      },
      transactions: {
        orderBy: { datePaiement: "asc" },
      },
    },
  });

  if (!doc) {
    notFound();
  }

  const client = doc.intervention?.client || doc.contract?.client || doc.demandeCommerciale?.client || {
    nom: "Client RyHaD",
    telephone: "+229 01 90 88 13 14",
    email: null,
    adresse: "Gbégamey, Cotonou, Bénin",
  };

  // Contrôle d'accès : Session CRM staff ou vérification des 4 derniers chiffres du téléphone
  const session = await auth();
  const isStaff = !!session?.user;

  const cleanClientPhone = (client.telephone || "").replace(/\D/g, "");
  const cleanInputPhone = (phone || phoneSuffix || "").replace(/\D/g, "");
  const isUnlocked =
    isStaff ||
    (cleanInputPhone.length >= 4 &&
      cleanClientPhone.length >= 4 &&
      cleanClientPhone.endsWith(cleanInputPhone.slice(-4)));

  let docMontant = doc.montant;
  if (
    (doc.type === DocumentType.DEVIS || doc.typeFacture === "REPARATION" || !doc.typeFacture) &&
    doc.intervention
  ) {
    const sumPieces = doc.intervention.piecesUtilisees
      ? doc.intervention.piecesUtilisees.reduce((acc, p) => acc + p.quantite * p.prixUnitaire, 0)
      : 0;
    const mo = doc.intervention.montantMainOeuvre || 0;
    if (mo + sumPieces > 0) {
      docMontant = mo + sumPieces;
    }
  } else if (doc.demandeCommerciale && doc.demandeCommerciale.montantTotal) {
    docMontant = doc.demandeCommerciale.montantTotal;
  }

  let commercialArticles: { designation: string; quantite: number; prixUnitaire: number }[] = [];
  if (doc.demandeCommerciale?.lignesCotation) {
    try {
      commercialArticles = JSON.parse(doc.demandeCommerciale.lignesCotation);
    } catch (e) {
      commercialArticles = [];
    }
  }

  const dateFormatted = doc.dateEmission
    ? format(new Date(doc.dateEmission), "dd/MM/yyyy", { locale: fr })
    : format(new Date(), "dd/MM/yyyy", { locale: fr });

  const datePaiementFormatted = doc.datePaiement
    ? format(new Date(doc.datePaiement), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
    : null;

  const data: DocumentPrintData = {
    id: doc.id,
    numero: doc.numero,
    type: doc.type,
    typeFacture: doc.typeFacture,
    dateEmission: dateFormatted,
    datePaiement: datePaiementFormatted,
    statutPaiement: doc.statutPaiement,
    modePaiement: doc.modePaiement,
    referencePaiement: doc.referencePaiement,
    montant: docMontant,
    montantPaye: doc.montantPaye || 0,
    resteAPayer: Math.max(0, docMontant - (doc.montantPaye || 0)),
    transactions: (doc.transactions || []).map((t) => ({
      id: t.id,
      montant: t.montant,
      modePaiement: t.modePaiement,
      referencePaiement: t.referencePaiement,
      datePaiement: format(new Date(t.datePaiement), "dd/MM/yyyy 'à' HH:mm", { locale: fr }),
      note: t.note,
    })),
    client: isUnlocked
      ? {
          nom: client.nom || "Client",
          telephone: client.telephone || "",
          email: client.email || null,
          adresse: client.adresse || null,
        }
      : {
          nom: maskClientName(client.nom),
          telephone: client.telephone
            ? `+229 •• •• •• ${client.telephone.replace(/\D/g, "").slice(-2)}`
            : "",
          email: null,
          adresse: "Cotonou, Bénin (accès restreint)",
        },
    intervention: doc.intervention
      ? {
          id: doc.intervention.id,
          numero: doc.intervention.numero,
          typeMateriel: doc.intervention.typeMateriel || "MATÉRIEL",
          panneDeclaree: isUnlocked ? (doc.intervention.panneDeclaree || "Non spécifiée") : "Détails confidentiels (saisissez votre téléphone)",
          diagnosticTechnicien: isUnlocked ? (doc.intervention.diagnosticTechnicien || null) : null,
          montantMainOeuvre: doc.intervention.montantMainOeuvre || 0,
          libelleMainOeuvre: doc.intervention.libelleMainOeuvre || null,
          piecesUtilisees: (doc.intervention.piecesUtilisees || []).map((p) => ({
            designation: p.designation,
            quantite: p.quantite,
            prixUnitaire: p.prixUnitaire,
          })),
        }
      : null,
    contract: doc.contract
      ? {
          id: doc.contract.id,
          periodicite: String(doc.contract.periodicite),
          equipementsCouverts: doc.contract.equipementsCouverts || "Parc sous contrat",
        }
      : null,
    demandeCommerciale: doc.demandeCommerciale
      ? {
          id: doc.demandeCommerciale.id,
          typeDemande: doc.demandeCommerciale.typeDemande.replace(/_/g, " "),
          description: isUnlocked ? (doc.demandeCommerciale.description || "") : "Détails confidentiels",
          articles: commercialArticles,
        }
      : null,
  };

  const initialFormat = reqFormat === "ticket" ? "ticket" : "a4";
  const shouldAutoPrint = auto === "true" || auto === "1";

  return (
    <PublicDocumentClient
      data={data}
      initialFormat={initialFormat}
      autoPrint={shouldAutoPrint}
      initialUnlocked={isUnlocked}
    />
  );
}
