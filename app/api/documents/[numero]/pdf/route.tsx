import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DocumentPdfTemplate, PdfDocumentData } from "@/lib/documents/pdf-templates/DocumentPdfTemplate";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DocumentType, FactureType } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`pdf_${ip}`, { limit: 15, windowMs: 60 * 1000 });
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

    const pdfData: PdfDocumentData = {
      numero: doc.numero,
      type: doc.type,
      typeFacture: doc.typeFacture,
      dateEmission: format(new Date(doc.dateEmission), "dd/MM/yyyy", { locale: fr }),
      statutPaiement: doc.statutPaiement,
      montant: docMontant,
      client: {
        nom: client.nom,
        telephone: client.telephone,
        email: client.email,
        adresse: client.adresse,
      },
      intervention: doc.intervention
        ? {
            numero: doc.intervention.numero,
            typeMateriel: doc.intervention.typeMateriel,
            panneDeclaree: doc.intervention.panneDeclaree,
            diagnosticTechnicien: doc.intervention.diagnosticTechnicien,
            montantMainOeuvre: doc.intervention.montantMainOeuvre,
            libelleMainOeuvre: doc.intervention.libelleMainOeuvre,
            piecesUtilisees: doc.intervention.piecesUtilisees,
          }
        : null,
      contract: doc.contract
        ? {
            periodicite: doc.contract.periodicite,
            equipementsCouverts: doc.contract.equipementsCouverts,
          }
        : null,
      demandeCommerciale: doc.demandeCommerciale
        ? {
            typeDemande: doc.demandeCommerciale.typeDemande.replace(/_/g, " "),
            description: doc.demandeCommerciale.description,
            articles: commercialArticles,
          }
        : null,
    };

    const pdfBuffer = await renderToBuffer(<DocumentPdfTemplate data={pdfData} />);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.numero}.pdf"`,
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
