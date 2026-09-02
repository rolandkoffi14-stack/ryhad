import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStatutsAutorises } from "@/lib/interventions/statut-transitions";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { formatFCFA } from "@/lib/format";
import {
  InterventionStatut,
  DocumentType,
  FactureType,
  StatutPaiement,
  StaffRole,
  InterventionType,
} from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role as StaffRole;
    const userName =
      `${(session.user as any).firstName || ""} ${(session.user as any).lastName || ""}`.trim() ||
      session.user.name ||
      "Staff";

    const { id } = await params;
    const body = await request.json();

    const currentTicket = await db.intervention.findUnique({
      where: { id },
      include: {
        client: true,
        piecesUtilisees: true,
        documents: true,
        technicienAssigne: true,
      },
    });

    if (!currentTicket) {
      return NextResponse.json({ success: false, message: "Ticket introuvable" }, { status: 404 });
    }

    const { actionType, newStatut, diagnosticTechnicien, technicienAssigneId, newPiece, pieceId } = body;

    // --------------------------------------------------------------------------
    // ACTION : Encaissement de la facture de DIAGNOSTIC (5.000 FCFA)
    // --------------------------------------------------------------------------
    if (actionType === "encaisser_diagnostic") {
      if (userRole === StaffRole.TECHNICIEN) {
        return NextResponse.json(
          { success: false, message: "Seule la réception ou l'administration peut encaisser un règlement." },
          { status: 403 }
        );
      }

      const diagDoc = currentTicket.documents.find(
        (d) =>
          (d.type === DocumentType.FACTURE && d.typeFacture === FactureType.DIAGNOSTIC) ||
          d.type === DocumentType.RECU_DIAGNOSTIC
      );

      const modePaiement = body.modePaiement || "ESPECES";
      const referencePaiement = body.referencePaiement || null;

      if (diagDoc) {
        await db.financialDocument.update({
          where: { id: diagDoc.id },
          data: {
            statutPaiement: StatutPaiement.PAYE,
            typeFacture: FactureType.DIAGNOSTIC,
            modePaiement,
            referencePaiement,
            datePaiement: new Date(),
          },
        });
      } else {
        const docNum = await generateDocumentNumber(DocumentType.FACTURE);
        await db.financialDocument.create({
          data: {
            numero: docNum,
            type: DocumentType.FACTURE,
            typeFacture: FactureType.DIAGNOSTIC,
            interventionId: currentTicket.id,
            montant: currentTicket.montantDiagnostic || 5000,
            statutPaiement: StatutPaiement.PAYE,
            modePaiement,
            referencePaiement,
            datePaiement: new Date(),
          },
        });
      }

      const montantDiag = currentTicket.montantDiagnostic || diagDoc?.montant || 1000;

      // Passer le ticket en FRAIS_DIAGNOSTIC_ENCAISSE (le technicien démarrera lui-même le diagnostic)
      await db.intervention.update({
        where: { id },
        data: {
          statut: InterventionStatut.FRAIS_DIAGNOSTIC_ENCAISSE,
          historique: {
            create: [
              {
                action: `Frais de diagnostic encaissés (${formatFCFA(montantDiag)}) via ${modePaiement.replace(/_/g, " ")}${referencePaiement ? ` (Réf: ${referencePaiement})` : ""}`,
                note: `Encaissé par la réception (${userName}) - Le ticket passe à 'Frais diagnostic encaissés'. Le technicien peut maintenant démarrer le diagnostic.`,
              },
            ],
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Frais de diagnostic (${formatFCFA(montantDiag)}) encaissés avec succès.`,
      });
    }

    // --------------------------------------------------------------------------
    // ACTION : Encaissement de la facture de RÉPARATION
    // --------------------------------------------------------------------------
    if (actionType === "encaisser_reparation") {
      if (userRole === StaffRole.TECHNICIEN) {
        return NextResponse.json(
          { success: false, message: "Seule la réception ou l'administration peut encaisser un règlement." },
          { status: 403 }
        );
      }

      const repDoc = currentTicket.documents.find(
        (d) => d.type === DocumentType.FACTURE && (d.typeFacture === FactureType.REPARATION || !d.typeFacture)
      );

      if (!repDoc) {
        return NextResponse.json(
          { success: false, message: "Aucune facture de réparation trouvée pour ce dossier." },
          { status: 400 }
        );
      }

      const modePaiement = body.modePaiement || "ESPECES";
      const referencePaiement = body.referencePaiement || null;

      await db.financialDocument.update({
        where: { id: repDoc.id },
        data: {
          statutPaiement: StatutPaiement.PAYE,
          modePaiement,
          referencePaiement,
          datePaiement: new Date(),
        },
      });

      // Enregistrer l'encaissement dans l'historique sans forcer le statut (c'est le technicien qui démarrera la réparation)
      await db.intervention.update({
        where: { id },
        data: {
          historique: {
            create: [
              {
                action: `Facture de réparation ${repDoc.numero} encaissée (${formatFCFA(repDoc.montant)}) via ${modePaiement.replace(/_/g, " ")}${referencePaiement ? ` (Réf: ${referencePaiement})` : ""}`,
                note: `Règlement encaissé par ${userName} (${userRole}). Le technicien peut maintenant démarrer les travaux.`,
              },
            ],
          },
        },
      });

      return NextResponse.json({ success: true, message: `Facture ${repDoc.numero} encaissée avec succès.` });
    }

    // --------------------------------------------------------------------------
    // ACTION : Mise à jour de statut avec validation stricte & automatismes
    // --------------------------------------------------------------------------
    if (actionType === "update_status" && newStatut) {
      const allowedNext = getStatutsAutorises(currentTicket.type, currentTicket.statut, {
        hasPieces: currentTicket.piecesUtilisees.length > 0,
        hasMainOeuvre: (currentTicket.montantMainOeuvre || 0) > 0,
      });

      if (!allowedNext.includes(newStatut as InterventionStatut)) {
        return NextResponse.json(
          {
            success: false,
            message: `Transition non autorisée de ${currentTicket.statut} vers ${newStatut}.`,
          },
          { status: 400 }
        );
      }

      // Règle 1 : Passer en EN_DIAGNOSTIC exige le paiement de la facture de diagnostic (pour ponctuel)
      if (newStatut === InterventionStatut.EN_DIAGNOSTIC && currentTicket.type === InterventionType.PONCTUEL) {
        const diagDoc = currentTicket.documents.find(
          (d) =>
            (d.type === DocumentType.FACTURE && d.typeFacture === FactureType.DIAGNOSTIC) ||
            d.type === DocumentType.RECU_DIAGNOSTIC
        );
        if (diagDoc?.statutPaiement !== StatutPaiement.PAYE) {
          const diagAmount = diagDoc?.montant || currentTicket.montantDiagnostic || 1000;
          return NextResponse.json(
            {
              success: false,
              message: `Impossible de passer en diagnostic : la facture de diagnostic (${diagAmount.toLocaleString("fr-FR")} FCFA) doit d'abord être encaissée par la réception.`,
            },
            { status: 400 }
          );
        }
      }

      // Règle 2 : DIAGNOSTIC_TERMINE -> Génère le DEVIS exact (MO ou Pièces en Ponctuel, Pièces seules en Contractuel)
      let createdDocNumero: string | null = null;
      if (newStatut === InterventionStatut.DIAGNOSTIC_TERMINE) {
        const isContractuel = currentTicket.type === InterventionType.CONTRACTUEL;
        const montantMO = currentTicket.montantMainOeuvre || 0;
        const sumPieces = currentTicket.piecesUtilisees.reduce(
          (acc, p) => acc + p.prixUnitaire * p.quantite,
          0
        );

        const montantDevis = (isContractuel ? 0 : montantMO) + sumPieces;

        // En ponctuel, le devis doit comporter au moins un élément chiffré (MO ou Pièce)
        if (!isContractuel && montantDevis <= 0) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Impossible d'émettre le devis : veuillez chiffrer la main d'œuvre ou ajouter au moins un accessoire/pièce.",
            },
            { status: 400 }
          );
        }

        // En contractuel, le devis ne sert qu'à facturer des pièces matérielles
        if (isContractuel && sumPieces <= 0) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Impossible d'émettre un devis sous contrat : veuillez ajouter au moins une pièce détachée à facturer.",
            },
            { status: 400 }
          );
        }

        const docNum = await generateDocumentNumber(DocumentType.DEVIS);
        createdDocNumero = docNum;

        await db.financialDocument.create({
          data: {
            numero: docNum,
            type: DocumentType.DEVIS,
            interventionId: currentTicket.id,
            montant: montantDevis,
            statutPaiement: StatutPaiement.EN_ATTENTE,
          },
        });
      }

      // Règle 3 : DEVIS_ACCEPTE -> Marque le DEVIS comme accepté & Génère automatiquement la FACTURE de réparation
      if (newStatut === InterventionStatut.DEVIS_ACCEPTE) {
        // Mettre à jour le devis existant
        await db.financialDocument.updateMany({
          where: {
            interventionId: currentTicket.id,
            type: DocumentType.DEVIS,
          },
          data: {
            statutPaiement: StatutPaiement.PAYE,
          },
        });

        const existingDevis = currentTicket.documents.find((d) => d.type === DocumentType.DEVIS);
        if (!existingDevis || existingDevis.montant <= 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Impossible de valider le devis : aucun devis chiffré valide n'a été trouvé.",
            },
            { status: 400 }
          );
        }

        const montantFacture = existingDevis.montant;
        const docNum = await generateDocumentNumber(DocumentType.FACTURE);
        createdDocNumero = docNum;

        await db.financialDocument.create({
          data: {
            numero: docNum,
            type: DocumentType.FACTURE,
            typeFacture: FactureType.REPARATION,
            interventionId: currentTicket.id,
            montant: montantFacture,
            statutPaiement: StatutPaiement.EN_ATTENTE,
          },
        });
      }

      // Règle 3b : DEVIS_REFUSE -> Marque le document DEVIS comme REFUSÉ
      if (newStatut === InterventionStatut.DEVIS_REFUSE) {
        await db.financialDocument.updateMany({
          where: {
            interventionId: currentTicket.id,
            type: DocumentType.DEVIS,
          },
          data: {
            statutPaiement: StatutPaiement.REFUSE,
          },
        });
      }

      // Règle 4 : EN_REPARATION exige que la facture soit payée si une facture de réparation existe
      if (newStatut === InterventionStatut.EN_REPARATION) {
        const repDoc = currentTicket.documents.find(
          (d) => d.type === DocumentType.FACTURE && d.typeFacture === FactureType.REPARATION
        );
        if (repDoc && repDoc.statutPaiement !== StatutPaiement.PAYE) {
          return NextResponse.json(
            {
              success: false,
              message: `Impossible de démarrer la réparation : la facture ${repDoc.numero} (${formatFCFA(repDoc.montant)}) doit d'abord être encaissée par la réception.`,
            },
            { status: 400 }
          );
        }
      }

      // Note d'audit
      let historyNote = `Par ${userName} (${userRole})`;
      if (newStatut === InterventionStatut.DIAGNOSTIC_TERMINE && createdDocNumero) {
        historyNote = `Diagnostic terminé. Devis ${createdDocNumero} généré automatiquement par le système.`;
      } else if (
        newStatut === InterventionStatut.TERMINE &&
        (currentTicket.statut === InterventionStatut.EN_DIAGNOSTIC ||
          currentTicket.statut === InterventionStatut.EN_INTERVENTION)
      ) {
        historyNote = `Intervention/Diagnostic terminé sans devis ni réparation. Matériel disponible pour restitution.`;
      } else if (newStatut === InterventionStatut.DEVIS_ACCEPTE && createdDocNumero) {
        historyNote = `Devis accepté par le client. Facture de réparation ${createdDocNumero} générée automatiquement en attente de paiement.`;
      } else if (newStatut === InterventionStatut.DEVIS_REFUSE) {
        historyNote = `Devis refusé par le client. Matériel disponible pour restitution.`;
      }

      await db.intervention.update({
        where: { id },
        data: {
          statut: newStatut as InterventionStatut,
          dateCloture:
            newStatut === InterventionStatut.LIVRE_CLOTURE || newStatut === InterventionStatut.CLOTURE
              ? new Date()
              : undefined,
          historique: {
            create: [
              {
                action: `Statut changé : ${currentTicket.statut} → ${newStatut}`,
                note: historyNote,
              },
            ],
          },
        },
      });

      return NextResponse.json({ success: true, message: "Statut mis à jour avec succès" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Mise à jour du diagnostic technicien (TECHNICIEN & ADMIN, uniquement EN_DIAGNOSTIC)
    // --------------------------------------------------------------------------
    if (actionType === "update_diagnostic" && diagnosticTechnicien !== undefined) {
      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Action réservée : la réception n'a pas accès à la saisie du diagnostic technique. Seul le technicien assigné peut rédiger le rapport technique.",
          },
          { status: 403 }
        );
      }

      // Verrouillage si le diagnostic/intervention est déjà terminé (sauf ADMIN)
      const isEditableDiag =
        currentTicket.statut === InterventionStatut.EN_DIAGNOSTIC ||
        (currentTicket.type === InterventionType.CONTRACTUEL &&
          currentTicket.statut === InterventionStatut.EN_INTERVENTION);

      if (!isEditableDiag && userRole !== StaffRole.ADMIN) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Le rapport technique est scellé car le dossier n'est plus en phase active. Seul un administrateur peut modifier ce dossier.",
          },
          { status: 400 }
        );
      }

      await db.intervention.update({
        where: { id },
        data: {
          diagnosticTechnicien,
          historique: {
            create: [
              {
                action: "Rapport technique rédigé par le technicien",
                note: diagnosticTechnicien,
              },
            ],
          },
        },
      });
      return NextResponse.json({ success: true, message: "Rapport technique enregistré" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Mise à jour de la Main d'œuvre de réparation (OBLIGATOIRE EN PONCTUEL)
    // --------------------------------------------------------------------------
    if (actionType === "update_main_oeuvre") {
      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          { success: false, message: "Action réservée aux techniciens et administrateurs." },
          { status: 403 }
        );
      }

      const isEditableMO =
        currentTicket.statut === InterventionStatut.EN_DIAGNOSTIC ||
        (currentTicket.type === InterventionType.CONTRACTUEL &&
          currentTicket.statut === InterventionStatut.EN_INTERVENTION);

      if (!isEditableMO && userRole !== StaffRole.ADMIN) {
        return NextResponse.json(
          {
            success: false,
            message: "La main d'œuvre ne peut être modifiée qu'en phase active d'intervention.",
          },
          { status: 400 }
        );
      }

      const { montantMainOeuvre, libelleMainOeuvre } = body;
      const montant = parseInt(montantMainOeuvre, 10);

      if (isNaN(montant) || montant < 0) {
        return NextResponse.json(
          { success: false, message: "Le montant de la main d'œuvre doit être un nombre valide (>= 0)." },
          { status: 400 }
        );
      }

      const libelle = (libelleMainOeuvre && libelleMainOeuvre.trim()) || "Main d'œuvre réparation & tests";

      await db.intervention.update({
        where: { id },
        data: {
          montantMainOeuvre: montant,
          libelleMainOeuvre: libelle,
          historique: {
            create: [
              {
                action: `Main d'œuvre chiffrée : ${libelle} (${formatFCFA(montant)})`,
                note: `Enregistré par ${userName}`,
              },
            ],
          },
        },
      });

      return NextResponse.json({ success: true, message: "Main d'œuvre enregistrée avec succès." });
    }

    // --------------------------------------------------------------------------
    // ACTION : Ajout d'une pièce détachée (FACULTATIF)
    // --------------------------------------------------------------------------
    if (actionType === "add_piece" && newPiece) {
      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          {
            success: false,
            message: "Action réservée : l'ajout de lignes au devis est réservé au technicien ou à l'administrateur.",
          },
          { status: 403 }
        );
      }

      const isEditablePieces =
        currentTicket.statut === InterventionStatut.EN_DIAGNOSTIC ||
        (currentTicket.type === InterventionType.CONTRACTUEL &&
          currentTicket.statut === InterventionStatut.EN_INTERVENTION);

      if (!isEditablePieces && userRole !== StaffRole.ADMIN) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Impossible d'ajouter des pièces : le dossier n'est plus en phase de diagnostic/intervention active.",
          },
          { status: 400 }
        );
      }

      const quantite = parseInt(newPiece.quantite, 10) || 1;
      const prixUnitaire = parseInt(newPiece.prixUnitaire, 10) || 0;

      await db.pieceUtilisee.create({
        data: {
          interventionId: currentTicket.id,
          designation: newPiece.designation.trim(),
          quantite,
          prixUnitaire,
        },
      });

      await db.historiqueTicket.create({
        data: {
          interventionId: currentTicket.id,
          action: `Ligne ajoutée au devis : ${newPiece.designation} (Qté: ${quantite}, P.U: ${formatFCFA(prixUnitaire)})`,
        },
      });

      return NextResponse.json({ success: true, message: "Ligne ajoutée au devis" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Suppression d'une ligne du devis
    // --------------------------------------------------------------------------
    if (actionType === "delete_piece" && pieceId) {
      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          { success: false, message: "Action réservée aux techniciens et administrateurs." },
          { status: 403 }
        );
      }

      const isEditablePieces =
        currentTicket.statut === InterventionStatut.EN_DIAGNOSTIC ||
        (currentTicket.type === InterventionType.CONTRACTUEL &&
          currentTicket.statut === InterventionStatut.EN_INTERVENTION);

      if (!isEditablePieces && userRole !== StaffRole.ADMIN) {
        return NextResponse.json(
          {
            success: false,
            message: "Impossible de supprimer une ligne : le dossier n'est plus en phase active.",
          },
          { status: 400 }
        );
      }

      const existingPiece = await db.pieceUtilisee.findUnique({ where: { id: pieceId } });
      if (existingPiece) {
        await db.pieceUtilisee.delete({ where: { id: pieceId } });
        await db.historiqueTicket.create({
          data: {
            interventionId: currentTicket.id,
            action: `Ligne supprimée du devis : ${existingPiece.designation}`,
          },
        });
      }

      return NextResponse.json({ success: true, message: "Ligne supprimée du devis" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Réassignation de technicien (RÉCEPTION & ADMIN)
    // --------------------------------------------------------------------------
    if (actionType === "reassign_technician") {
      if (userRole === StaffRole.TECHNICIEN) {
        return NextResponse.json(
          { success: false, message: "Les techniciens ne peuvent pas réassigner les dossiers." },
          { status: 403 }
        );
      }

      const { technicienId } = body;
      const techUser = technicienId ? await db.user.findUnique({ where: { id: technicienId } }) : null;

      await db.intervention.update({
        where: { id },
        data: {
          technicienAssigneId: technicienId || null,
          historique: {
            create: [
              {
                action: techUser
                  ? `Technicien assigné : ${techUser.firstName} ${techUser.lastName}`
                  : "Technicien retiré du dossier",
                note: `Par ${userName} (${userRole})`,
              },
            ],
          },
        },
      });
      return NextResponse.json({ success: true, message: "Technicien assigné" });
    }

  } catch (error: any) {
    console.error("Erreur mise à jour ticket:", error);
    const userMessage =
      error.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("SELECT")
        ? error.message
        : "Une erreur inattendue est survenue lors de l'opération sur le dossier.";
    return NextResponse.json({ success: false, message: userMessage }, { status: 500 });
  }
}
