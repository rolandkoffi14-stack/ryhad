import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DocumentPdfTemplate, PdfDocumentData } from "@/lib/documents/pdf-templates/DocumentPdfTemplate";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DocumentType, FactureType } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`pdf_${ip}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Trop de téléchargements de documents demandés. Veuillez patienter une minute." },
        { status: 429 }
      );
    }

    const { numero } = await params;

    const doc = await db.financialDocument.findUnique({
      where: { numero: numero.toUpperCase().trim() },
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
      },
    });

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document non trouvé" }, { status: 404 });
    }

    const client = doc.intervention?.client || doc.contract?.client || doc.demandeCommerciale?.client || {
      nom: "Client RyHaD",
      telephone: "+229 01 90 88 13 14",
      email: null,
      adresse: "Cotonou, Bénin",
    };

    // Recalcul dynamique pour garantir la conformité mathématique parfaite
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

    const pdfData: PdfDocumentData = {
      numero: doc.numero,
      type: doc.type,
      typeFacture: doc.typeFacture,
      dateEmission: dateFormatted,
      statutPaiement: doc.statutPaiement,
      montant: docMontant,
      client: {
        nom: client.nom || "Client",
        telephone: client.telephone || "",
        email: client.email || null,
        adresse: client.adresse || null,
      },
      intervention: doc.intervention
        ? {
            numero: doc.intervention.numero,
            typeMateriel: doc.intervention.typeMateriel || "MATERIEL",
            panneDeclaree: doc.intervention.panneDeclaree || "Non spécifiée",
            diagnosticTechnicien: doc.intervention.diagnosticTechnicien || null,
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
            periodicite: String(doc.contract.periodicite),
            equipementsCouverts: doc.contract.equipementsCouverts || "Parc sous contrat",
          }
        : null,
      demandeCommerciale: doc.demandeCommerciale
        ? {
            typeDemande: doc.demandeCommerciale.typeDemande.replace(/_/g, " "),
            description: doc.demandeCommerciale.description || "",
            articles: commercialArticles,
          }
        : null,
    };

    const pdfBuffer = await renderToBuffer(<DocumentPdfTemplate data={pdfData} />);
    const uint8Array = new Uint8Array(pdfBuffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.numero}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la compilation du PDF." },
      { status: 500 }
    );
  }
}
