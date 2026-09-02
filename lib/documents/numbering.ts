import { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";

export function getDocumentPrefix(type: DocumentType): string {
  switch (type) {
    case DocumentType.DEVIS:
      return "DEV";
    case DocumentType.FACTURE:
    case DocumentType.RECU_DIAGNOSTIC:
    case DocumentType.FACTURE_PERIODIQUE:
    default:
      return "FAC";
  }
}

/**
 * Génère un numéro de document unique incrémental du type : PREFIXE-ANNEE-XXXX
 * Ex: DEV-2026-0001, FAC-2026-0042
 */
export async function generateDocumentNumber(type: DocumentType): Promise<string> {
  const prefix = getDocumentPrefix(type);
  const year = new Date().getFullYear();

  try {
    const lastDoc = await db.financialDocument.findFirst({
      where: {
        numero: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      orderBy: {
        numero: "desc",
      },
    });

    let nextSequence = 1;
    if (lastDoc && lastDoc.numero) {
      const parts = lastDoc.numero.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    const paddedSeq = nextSequence.toString().padStart(4, "0");
    return `${prefix}-${year}-${paddedSeq}`;
  } catch (error) {
    // Fallback timestamp en cas d'indisponibilité momentanée
    const fallbackSeq = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${year}-${fallbackSeq}`;
  }
}

/**
 * Génère un numéro unique de ticket d'intervention du type : INT-ANNEE-XXXX
 */
export async function generateInterventionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INT-${year}`;

  try {
    const lastTicket = await db.intervention.findFirst({
      where: {
        numero: {
          startsWith: `${prefix}-`,
        },
      },
      orderBy: {
        numero: "desc",
      },
    });

    let nextSequence = 1;
    if (lastTicket && lastTicket.numero) {
      const parts = lastTicket.numero.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    const paddedSeq = nextSequence.toString().padStart(4, "0");
    return `${prefix}-${paddedSeq}`;
  } catch (error) {
    const fallbackSeq = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${fallbackSeq}`;
  }
}
