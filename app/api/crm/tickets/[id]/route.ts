import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStatutsAutorises } from "@/lib/interventions/statut-transitions";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { formatFCFA } from "@/lib/format";
import {
  ticketUpdateStatusSchema,
  ticketUpdateDiagnosticSchema,
  ticketUpdateMainOeuvreSchema,
  ticketAddPieceSchema,
  ticketDeletePieceSchema,
  ticketReassignTechSchema,
  ticketEncaisserDiagSchema,
  ticketEncaisserRepSchema,
} from "@/lib/validations";
import {
  InterventionStatut,
  DocumentType,
  FactureType,
  StatutPaiement,
  StaffRole,
  InterventionType,
} from "@prisma/client";
import {
  notifyTechAssigned,
  notifyDiagTermineToStaff,
  notifyPaymentReceivedToTech,
  notifyReparationTermineeToStaff,
  notifyTicketClosedToAdmin,
  sendClientQuoteEmail,
  sendClientReadyForPickupEmail,
} from "@/lib/services/notifications";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

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
    const userId = (session.user as any).id as string;
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

    // Vérification de sécurité IDOR/BOLA pour les techniciens
    const isAssignedTech = currentTicket.technicienAssigneId === userId;
    const isTechRestricted = userRole === StaffRole.TECHNICIEN && currentTicket.technicienAssigneId && !isAssignedTech;

    const actionType = body.actionType;

    // --------------------------------------------------------------------------
    // ACTION : Encaissement de la facture de DIAGNOSTIC (5.000 FCFA)
    // --------------------------------------------------------------------------
    if (actionType === "encaisser_diagnostic") {
      const validated = ticketEncaisserDiagSchema.parse(body);
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

      const modePaiement = validated.modePaiement || "ESPECES";
      const referencePaiement = validated.referencePaiement || null;

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

      // Alerter le technicien assigné que les frais de diagnostic sont encaissés
      if (currentTicket.technicienAssigneId) {
        notifyPaymentReceivedToTech({
          ticketId: currentTicket.id,
          numero: currentTicket.numero,
          clientNom: currentTicket.client.nom,
          typeMateriel: currentTicket.typeMateriel,
          typeFactureLibelle: "facture de diagnostic",
          montant: montantDiag,
          technicienAssigneId: currentTicket.technicienAssigneId,
          actorId: userId,
        }).catch((err) => console.error("Erreur notification encaissement diagnostic:", err));
      }

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({
        success: true,
        message: `Frais de diagnostic (${formatFCFA(montantDiag)}) encaissés avec succès.`,
      });
    }

    // --------------------------------------------------------------------------
    // ACTION : Encaissement de la facture de RÉPARATION
    // --------------------------------------------------------------------------
    if (actionType === "encaisser_reparation") {
      const validated = ticketEncaisserRepSchema.parse(body);
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

      const modePaiement = validated.modePaiement || "ESPECES";
      const referencePaiement = validated.referencePaiement || null;

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

      // Alerter le technicien assigné (Feu vert pour les réparations)
      if (currentTicket.technicienAssigneId) {
        notifyPaymentReceivedToTech({
          ticketId: currentTicket.id,
          numero: currentTicket.numero,
          clientNom: currentTicket.client.nom,
          typeMateriel: currentTicket.typeMateriel,
          typeFactureLibelle: "facture de réparation",
          montant: repDoc.montant,
          technicienAssigneId: currentTicket.technicienAssigneId,
          actorId: userId,
        }).catch((err) => console.error("Erreur notification encaissement réparation:", err));
      }

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: `Facture ${repDoc.numero} encaissée avec succès.` });
    }

    // --------------------------------------------------------------------------
    // ACTION : Mise à jour de statut avec validation stricte & automatismes
    // --------------------------------------------------------------------------
    if (actionType === "update_status") {
      const validated = ticketUpdateStatusSchema.parse(body);
      const newStatut = validated.newStatut;

      if (isTechRestricted) {
        return NextResponse.json(
          { success: false, message: "Accès refusé : ce dossier est assigné à un autre technicien." },
          { status: 403 }
        );
      }

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

      // Règle 1b : Passer en EN_INTERVENTION exige d'être le jour programmé ou après (pour les techniciens)
      if (
        newStatut === InterventionStatut.EN_INTERVENTION &&
        currentTicket.type === InterventionType.CONTRACTUEL &&
        currentTicket.dateProgrammee
      ) {
        const targetDay = new Date(currentTicket.dateProgrammee);
        targetDay.setHours(0, 0, 0, 0);
        const currentDay = new Date();
        currentDay.setHours(0, 0, 0, 0);

        if (currentDay < targetDay && userRole === StaffRole.TECHNICIEN) {
          return NextResponse.json(
            {
              success: false,
              message: `Intervention verrouillée : cette visite est programmée pour le ${targetDay.toLocaleDateString("fr-FR")}. Vous ne pouvez la démarrer qu'à partir du jour prévu.`,
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

      // 1. Diagnostic terminé : Alerter la réception pour transmission/relance du devis
      if (newStatut === InterventionStatut.DIAGNOSTIC_TERMINE) {
        const devisDoc = currentTicket.documents.find((d) => d.type === DocumentType.DEVIS);
        const montantDevis =
          devisDoc?.montant ||
          ((currentTicket.montantMainOeuvre || 0) +
            currentTicket.piecesUtilisees.reduce((acc, p) => acc + p.quantite * p.prixUnitaire, 0));

        notifyDiagTermineToStaff({
          ticketId: currentTicket.id,
          numero: currentTicket.numero,
          typeMateriel: currentTicket.typeMateriel,
          clientNom: currentTicket.client.nom,
          montantDevis,
          actorId: userId,
        }).catch((err) => console.error("Erreur notification devis prêt:", err));
      }

      // 2. Réparation terminée : Alerter la réception pour restitution
      if (newStatut === InterventionStatut.TERMINE) {
        notifyReparationTermineeToStaff({
          ticketId: currentTicket.id,
          numero: currentTicket.numero,
          clientNom: currentTicket.client.nom,
          typeMateriel: currentTicket.typeMateriel,
          actorId: userId,
        }).catch((err) => console.error("Erreur notification réparation terminée:", err));
      }

      // 3. Clôture de dossier : Notification de synthèse par email à la direction
      if (newStatut === InterventionStatut.LIVRE_CLOTURE || newStatut === InterventionStatut.CLOTURE) {
        notifyTicketClosedToAdmin({
          numero: currentTicket.numero,
          clientNom: currentTicket.client.nom,
          typeMateriel: currentTicket.typeMateriel,
          actorName: userName,
        }).catch((err) => console.error("Erreur notification clôture admin:", err));
      }

      // 4. Notification Email au client si un devis vient d'être généré/envoyé
      if (
        (newStatut === InterventionStatut.DIAGNOSTIC_TERMINE || newStatut === InterventionStatut.DEVIS_ENVOYE) &&
        currentTicket.client.email
      ) {
        const devisDoc = currentTicket.documents.find((d) => d.type === DocumentType.DEVIS);
        const montantDevis =
          devisDoc?.montant ||
          ((currentTicket.montantMainOeuvre || 0) +
            currentTicket.piecesUtilisees.reduce((acc, p) => acc + p.quantite * p.prixUnitaire, 0));
        if (devisDoc || createdDocNumero) {
          sendClientQuoteEmail({
            clientEmail: currentTicket.client.email,
            clientNom: currentTicket.client.nom,
            numeroTicket: currentTicket.numero,
            numeroDevis: createdDocNumero || devisDoc?.numero || "DEV-DEVIS",
            montantTotal: montantDevis,
            typeMateriel: currentTicket.typeMateriel,
          }).catch((err) => console.error("Erreur envoi email devis client:", err));
        }
      }

      // 5. Notification Email au client si la réparation est terminée et prête pour retrait
      if (newStatut === InterventionStatut.TERMINE && currentTicket.client.email) {
        sendClientReadyForPickupEmail({
          clientEmail: currentTicket.client.email,
          clientNom: currentTicket.client.nom,
          numeroTicket: currentTicket.numero,
          typeMateriel: currentTicket.typeMateriel,
        }).catch((err) => console.error("Erreur envoi email retrait client:", err));
      }

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: "Statut mis à jour avec succès" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Mise à jour du diagnostic technicien (TECHNICIEN & ADMIN, uniquement EN_DIAGNOSTIC)
    // --------------------------------------------------------------------------
    if (actionType === "update_diagnostic") {
      const validated = ticketUpdateDiagnosticSchema.parse(body);
      const diagnosticTechnicien = validated.diagnosticTechnicien;

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

      if (isTechRestricted) {
        return NextResponse.json(
          { success: false, message: "Accès refusé : ce dossier est assigné à un autre technicien." },
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
      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: "Rapport technique enregistré" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Mise à jour de la Main d'œuvre de réparation (OBLIGATOIRE EN PONCTUEL)
    // --------------------------------------------------------------------------
    if (actionType === "update_main_oeuvre") {
      const validated = ticketUpdateMainOeuvreSchema.parse(body);
      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          { success: false, message: "Action réservée aux techniciens et administrateurs." },
          { status: 403 }
        );
      }

      if (isTechRestricted) {
        return NextResponse.json(
          { success: false, message: "Accès refusé : ce dossier est assigné à un autre technicien." },
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

      const montant = parseInt(String(validated.montantMainOeuvre), 10);

      if (isNaN(montant) || montant < 0) {
        return NextResponse.json(
          { success: false, message: "Le montant de la main d'œuvre doit être un nombre valide (>= 0)." },
          { status: 400 }
        );
      }

      const libelle = (validated.libelleMainOeuvre && validated.libelleMainOeuvre.trim()) || "Main d'œuvre réparation & tests";

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

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: "Main d'œuvre enregistrée avec succès." });
    }

    // --------------------------------------------------------------------------
    // ACTION : Ajout d'une pièce détachée (FACULTATIF)
    // --------------------------------------------------------------------------
    if (actionType === "add_piece") {
      const validated = ticketAddPieceSchema.parse(body);
      const newPiece = validated.newPiece;

      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          {
            success: false,
            message: "Action réservée : l'ajout de lignes au devis est réservé au technicien ou à l'administrateur.",
          },
          { status: 403 }
        );
      }

      if (isTechRestricted) {
        return NextResponse.json(
          { success: false, message: "Accès refusé : ce dossier est assigné à un autre technicien." },
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

      const quantite = parseInt(String(newPiece.quantite), 10) || 1;
      const prixUnitaire = parseInt(String(newPiece.prixUnitaire), 10) || 0;

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

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: "Ligne ajoutée au devis" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Suppression d'une ligne du devis
    // --------------------------------------------------------------------------
    if (actionType === "delete_piece") {
      const validated = ticketDeletePieceSchema.parse(body);
      const pieceId = validated.pieceId;

      if (userRole === StaffRole.RECEPTIONNISTE) {
        return NextResponse.json(
          { success: false, message: "Action réservée aux techniciens et administrateurs." },
          { status: 403 }
        );
      }

      if (isTechRestricted) {
        return NextResponse.json(
          { success: false, message: "Accès refusé : ce dossier est assigné à un autre technicien." },
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

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: "Ligne supprimée du devis" });
    }

    // --------------------------------------------------------------------------
    // ACTION : Réassignation de technicien (RÉCEPTION & ADMIN)
    // --------------------------------------------------------------------------
    if (actionType === "reassign_technician") {
      const validated = ticketReassignTechSchema.parse(body);
      if (userRole === StaffRole.TECHNICIEN) {
        return NextResponse.json(
          { success: false, message: "Les techniciens ne peuvent pas réassigner les dossiers." },
          { status: 403 }
        );
      }

      const technicienId = validated.technicienId;
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

      if (technicienId && techUser) {
        notifyTechAssigned(
          {
            id: currentTicket.id,
            numero: currentTicket.numero,
            typeMateriel: currentTicket.typeMateriel,
            panneDeclaree: currentTicket.panneDeclaree,
            clientNom: currentTicket.client.nom,
            technicienAssigneId: technicienId,
          },
          userId
        ).catch((err) => console.error("Erreur notification assignation technicien:", err));
      }

      broadcastCrmEvent("ticket:updated", id);

      return NextResponse.json({ success: true, message: "Technicien assigné" });
    }

    return NextResponse.json({ success: false, message: "Action non reconnue" }, { status: 400 });

  } catch (error: any) {
    console.error("Erreur mise à jour ticket:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    const userMessage =
      error.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("SELECT")
        ? error.message
        : "Une erreur inattendue est survenue lors de l'opération sur le dossier.";
    return NextResponse.json({ success: false, message: userMessage }, { status: 500 });
  }
}
