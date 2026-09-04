import { db } from "@/lib/db";
import { sendWebPushToUsers } from "@/lib/services/push";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { NotificationType, StaffRole } from "@prisma/client";
import { formatFCFA } from "@/lib/format";
import { broadcastCrmEvent } from "@/lib/realtime/eventBus";

const resendApiKey = env.RESEND_API_KEY;
const emailFrom = env.EMAIL_FROM || "RyHaD Tic-Medic <notifications@ryhad.bj>";
const appUrl = env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface StaffNotificationOptions {
  userIds: string[];
  pushUserIds?: string[];
  emailUserIds?: string[];
  actorId?: string;
  titre: string;
  message: string;
  type: NotificationType;
  lien?: string;
  sendPush?: boolean;
  emailSubject?: string;
  emailHtml?: string;
}

/**
 * Service universel d'envoi de notification au personnel (In-App + Web Push + Email facultatif)
 * avec filtrage strict pour ne jamais notifier l'auteur de l'action en Push.
 */
export async function sendStaffNotification({
  userIds,
  pushUserIds,
  emailUserIds,
  actorId,
  titre,
  message,
  type,
  lien = "/crm",
  sendPush = true,
  emailSubject,
  emailHtml,
}: StaffNotificationOptions) {
  if (!userIds || userIds.length === 0) return { success: true };

  try {
    // 1. Enregistrement In-App dans la table PostgreSQL Notification
    const notificationsData = userIds.map((userId) => ({
      userId,
      titre,
      message,
      type,
      lien,
      estLu: false,
    }));

    await db.notification.createMany({
      data: notificationsData,
    });

    // Émettre un événement temps réel pour actualiser immédiatement la cloche de notification
    broadcastCrmEvent("notification:new");

    // 2. Envoi de la notification Web Push ciblée (exclut systématiquement l'auteur de l'action)
    if (sendPush) {
      const rawPushTargets = pushUserIds || userIds;
      const filteredPushTargets = actorId
        ? rawPushTargets.filter((id) => id !== actorId)
        : rawPushTargets;

      if (filteredPushTargets.length > 0) {
        await sendWebPushToUsers(filteredPushTargets, {
          title: titre,
          body: message,
          url: lien,
          tag: `notif-${type}-${Date.now()}`,
        });
      }
    }

    // 3. Envoi par email aux collaborateurs si un template est fourni
    if (emailSubject && emailHtml && resend) {
      const rawEmailTargets = emailUserIds || userIds;
      const targetUsers = await db.user.findMany({
        where: { id: { in: rawEmailTargets }, isActive: true },
        select: { email: true, firstName: true },
      });

      const emailPromises = targetUsers.map((u) =>
        resend.emails
          .send({
            from: emailFrom,
            to: u.email,
            subject: emailSubject,
            html: emailHtml,
          })
          .catch((err) => console.error(`Erreur envoi email staff à ${u.email}:`, err))
      );

      await Promise.allSettled(emailPromises);
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur générale sendStaffNotification:", error);
    return { success: false, error };
  }
}

// ------------------------------------------------------------------------------
// ÉVÉNEMENTS MÉTIERS STAFF CIBLÉS
// ------------------------------------------------------------------------------

/**
 * 1. Dépôt de nouveau ticket sur la vitrine :
 * - Web Push : Réceptionnistes uniquement
 * - Email : Administrateurs (synthèse)
 * - In-App : Réception + Admin
 */
export async function notifyNewInterventionToStaff(ticket: {
  numero: string;
  typeMateriel: string;
  panneDeclaree: string;
  clientNom: string;
  clientTelephone: string;
}) {
  const staff = await db.user.findMany({
    where: {
      role: { in: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE] },
      isActive: true,
    },
    select: { id: true, role: true },
  });

  const allStaffIds = staff.map((s) => s.id);
  const receptionIds = staff.filter((s) => s.role === StaffRole.RECEPTIONNISTE).map((s) => s.id);
  const adminIds = staff.filter((s) => s.role === StaffRole.ADMIN).map((s) => s.id);

  if (!allStaffIds.length) return;

  const titre = `🚨 Nouveau Ticket : ${ticket.numero}`;
  const message = `Client ${ticket.clientNom} (${ticket.clientTelephone}) — ${ticket.typeMateriel.replace(/_/g, " ")} : ${ticket.panneDeclaree}`;
  const lien = `/crm/tickets/ponctuel`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
      <h2 style="color: #1E4D8B;">Nouveau ticket d'intervention enregistré</h2>
      <p><strong>N° de Dossier :</strong> ${ticket.numero}</p>
      <p><strong>Client :</strong> ${ticket.clientNom} (${ticket.clientTelephone})</p>
      <p><strong>Matériel :</strong> ${ticket.typeMateriel.replace(/_/g, " ")}</p>
      <p><strong>Panne signalée :</strong> ${ticket.panneDeclaree}</p>
      <p style="margin-top: 20px;">
        <a href="${appUrl}${lien}" style="background-color: #1E4D8B; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Ouvrir dans le CRM
        </a>
      </p>
    </div>
  `;

  await sendStaffNotification({
    userIds: allStaffIds,
    pushUserIds: receptionIds.length > 0 ? receptionIds : allStaffIds, // Push uniquement à la réception
    emailUserIds: adminIds, // Email à la direction
    titre,
    message,
    type: NotificationType.TICKET_CREE,
    lien,
    sendPush: true,
    emailSubject: `🚨 Nouveau Ticket Reçu : ${ticket.numero} (${ticket.clientNom})`,
    emailHtml,
  });
}

/**
 * 2. Assignation de technicien :
 * - Web Push & In-App : Technicien assigné uniquement (sauf si auteur)
 * - Email : Technicien assigné
 */
export async function notifyTechAssigned(
  ticket: {
    id: string;
    numero: string;
    typeMateriel: string;
    panneDeclaree: string;
    clientNom: string;
    technicienAssigneId: string;
  },
  actorId?: string
) {
  const tech = await db.user.findUnique({
    where: { id: ticket.technicienAssigneId },
  });

  if (!tech || !tech.isActive) return;

  const titre = `🛠️ Nouveau dossier assigné : ${ticket.numero}`;
  const message = `Le dossier ${ticket.numero} (${ticket.typeMateriel.replace(/_/g, " ")}) pour ${ticket.clientNom} vous a été confié.`;
  const lien = `/crm/tickets/${ticket.id}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
      <h2 style="color: #1E4D8B;">Un nouveau dossier vous a été assigné</h2>
      <p>Bonjour <strong>${tech.firstName}</strong>,</p>
      <p>Le dossier suivant vous a été affecté à l'atelier RyHaD Tic-Medic :</p>
      <div style="background: #F4F6F8; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0 0 5px 0;"><strong>Numéro :</strong> ${ticket.numero}</p>
        <p style="margin: 0 0 5px 0;"><strong>Client :</strong> ${ticket.clientNom}</p>
        <p style="margin: 0 0 5px 0;"><strong>Équipement :</strong> ${ticket.typeMateriel.replace(/_/g, " ")}</p>
        <p style="margin: 0;"><strong>Panne :</strong> ${ticket.panneDeclaree}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${appUrl}${lien}" style="background-color: #2CA58D; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Accéder à la fiche d'intervention
        </a>
      </p>
    </div>
  `;

  await sendStaffNotification({
    userIds: [tech.id],
    actorId,
    titre,
    message,
    type: NotificationType.TICKET_ASSIGNE,
    lien,
    sendPush: true,
    emailSubject: `🛠️ Nouveau Dossier Assigné : ${ticket.numero} (${ticket.typeMateriel.replace(/_/g, " ")})`,
    emailHtml,
  });
}

/**
 * 4. Diagnostic terminé (Devis généré) :
 * - Web Push & In-App : Réceptionnistes uniquement (pour transmission/relance client)
 */
export async function notifyDiagTermineToStaff({
  ticketId,
  numero,
  typeMateriel,
  clientNom,
  montantDevis,
  actorId,
}: {
  ticketId: string;
  numero: string;
  typeMateriel: string;
  clientNom: string;
  montantDevis: number;
  actorId?: string;
}) {
  const reception = await db.user.findMany({
    where: { role: StaffRole.RECEPTIONNISTE, isActive: true },
    select: { id: true },
  });

  const receptionIds = reception.map((r) => r.id);
  if (!receptionIds.length) return;

  const titre = `📋 Devis prêt à envoyer : ${numero}`;
  const message = `Diagnostic terminé pour ${clientNom} (${typeMateriel.replace(/_/g, " ")}). Devis chiffré à ${formatFCFA(montantDevis)}. Prêt pour transmission.`;

  await sendStaffNotification({
    userIds: receptionIds,
    actorId,
    titre,
    message,
    type: NotificationType.STATUT_CHANGE,
    lien: `/crm/tickets/${ticketId}`,
    sendPush: true,
  });
}

/**
 * 6. Devis validé par le client en ligne :
 * - Web Push & In-App : Réceptionnistes uniquement
 */
export async function notifyDevisAccepteEnLigneToStaff({
  ticketId,
  numero,
  clientNom,
  actorId,
}: {
  ticketId: string;
  numero: string;
  clientNom: string;
  actorId?: string;
}) {
  const reception = await db.user.findMany({
    where: { role: StaffRole.RECEPTIONNISTE, isActive: true },
    select: { id: true },
  });

  const receptionIds = reception.map((r) => r.id);
  if (!receptionIds.length) return;

  const titre = `✅ Devis validé en ligne : ${numero}`;
  const message = `Le client ${clientNom} a validé son devis depuis le portail de suivi. Facture émise en attente de règlement.`;

  await sendStaffNotification({
    userIds: receptionIds,
    actorId,
    titre,
    message,
    type: NotificationType.DEVIS_ACCEPTE,
    lien: `/crm/tickets/${ticketId}`,
    sendPush: true,
  });
}

/**
 * 7. Facture encaissée (Feu vert pour les travaux) :
 * - Web Push & In-App : Technicien assigné uniquement
 */
export async function notifyPaymentReceivedToTech({
  ticketId,
  numero,
  clientNom,
  typeMateriel,
  typeFactureLibelle,
  montant,
  technicienAssigneId,
  actorId,
}: {
  ticketId: string;
  numero: string;
  clientNom: string;
  typeMateriel: string;
  typeFactureLibelle: string;
  montant: number;
  technicienAssigneId?: string | null;
  actorId?: string;
}) {
  if (!technicienAssigneId) return;

  const tech = await db.user.findUnique({
    where: { id: technicienAssigneId },
    select: { id: true, isActive: true },
  });

  if (!tech || !tech.isActive) return;

  const titre = `💰 Règlement encaissé — Feu vert : ${numero}`;
  const message = `La ${typeFactureLibelle} (${formatFCFA(montant)}) pour ${clientNom} (${typeMateriel.replace(/_/g, " ")}) a été encaissée. Vous pouvez procéder aux opérations techniques !`;

  await sendStaffNotification({
    userIds: [tech.id],
    actorId,
    titre,
    message,
    type: NotificationType.STATUT_CHANGE,
    lien: `/crm/tickets/${ticketId}`,
    sendPush: true,
  });
}

/**
 * 9. Réparation terminée :
 * - Web Push & In-App : Réceptionnistes uniquement (pour préparer la restitution et appeler le client)
 */
export async function notifyReparationTermineeToStaff({
  ticketId,
  numero,
  clientNom,
  typeMateriel,
  actorId,
}: {
  ticketId: string;
  numero: string;
  clientNom: string;
  typeMateriel: string;
  actorId?: string;
}) {
  const reception = await db.user.findMany({
    where: { role: StaffRole.RECEPTIONNISTE, isActive: true },
    select: { id: true },
  });

  const receptionIds = reception.map((r) => r.id);
  if (!receptionIds.length) return;

  const titre = `🎉 Réparation achevée : ${numero}`;
  const message = `L'équipement de ${clientNom} (${typeMateriel.replace(/_/g, " ")}) a passé les tests de conformité. Prêt pour retrait au comptoir.`;

  await sendStaffNotification({
    userIds: receptionIds,
    actorId,
    titre,
    message,
    type: NotificationType.STATUT_CHANGE,
    lien: `/crm/tickets/${ticketId}`,
    sendPush: true,
  });
}

/**
 * 10. Clôture de dossier :
 * - Email : Direction (Administrateurs)
 */
export async function notifyTicketClosedToAdmin({
  numero,
  clientNom,
  typeMateriel,
  actorName,
}: {
  numero: string;
  clientNom: string;
  typeMateriel: string;
  actorName: string;
}) {
  const admins = await db.user.findMany({
    where: { role: StaffRole.ADMIN, isActive: true },
    select: { id: true, email: true },
  });

  const adminIds = admins.map((a) => a.id);
  if (!adminIds.length) return;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
      <h2 style="color: #2CA58D;">✅ Dossier Clôturé & Restitué</h2>
      <p>Le dossier <strong>${numero}</strong> (${typeMateriel.replace(/_/g, " ")}) pour le client <strong>${clientNom}</strong> a été restitué et clôturé avec succès par <strong>${actorName}</strong>.</p>
      <p style="margin-top: 20px;">
        <a href="${appUrl}/crm/tickets/ponctuel" style="background-color: #1E4D8B; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Consulter l'historique
        </a>
      </p>
    </div>
  `;

  await sendStaffNotification({
    userIds: adminIds,
    sendPush: false, // Aucun push pour la clôture
    emailUserIds: adminIds,
    titre: `Dossier ${numero} clôturé`,
    message: `Dossier ${numero} (${clientNom}) clôturé et livré.`,
    type: NotificationType.STATUT_CHANGE,
    emailSubject: `✅ Dossier Clôturé : ${numero} (${clientNom})`,
    emailHtml,
  });
}

/**
 * Demande commerciale reçue sur le site :
 * - Web Push : Réceptionnistes uniquement
 * - Email : Administrateurs
 */
export async function notifyNewCommercialRequestToStaff(demande: {
  id: string;
  nom: string;
  telephone: string;
  typeDemande: string;
  description: string;
}) {
  const staff = await db.user.findMany({
    where: {
      role: { in: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE] },
      isActive: true,
    },
    select: { id: true, role: true },
  });

  const allStaffIds = staff.map((s) => s.id);
  const receptionIds = staff.filter((s) => s.role === StaffRole.RECEPTIONNISTE).map((s) => s.id);
  const adminIds = staff.filter((s) => s.role === StaffRole.ADMIN).map((s) => s.id);

  if (!allStaffIds.length) return;

  const titre = `💼 Demande Commerciale : ${demande.typeDemande.replace(/_/g, " ")}`;
  const message = `Prospect ${demande.nom} (${demande.telephone}) — ${demande.description.slice(0, 80)}...`;
  const lien = `/crm/demandes-commerciales/${demande.id}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
      <h2 style="color: #1E4D8B;">Nouvelle demande commerciale</h2>
      <p><strong>Prospect :</strong> ${demande.nom} (${demande.telephone})</p>
      <p><strong>Type :</strong> ${demande.typeDemande.replace(/_/g, " ")}</p>
      <blockquote style="background: #F4F6F8; padding: 12px; border-left: 4px solid #1E4D8B;">
        ${demande.description}
      </blockquote>
      <p style="margin-top: 20px;">
        <a href="${appUrl}${lien}" style="background-color: #1E4D8B; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Consulter dans le CRM
        </a>
      </p>
    </div>
  `;

  await sendStaffNotification({
    userIds: allStaffIds,
    pushUserIds: receptionIds.length > 0 ? receptionIds : allStaffIds,
    emailUserIds: adminIds,
    titre,
    message,
    type: NotificationType.DEMANDE_COMMERCIALE,
    lien,
    sendPush: true,
    emailSubject: `💼 Nouvelle Demande Commerciale : ${demande.nom} (${demande.typeDemande.replace(/_/g, " ")})`,
    emailHtml,
  });
}

// ------------------------------------------------------------------------------
// NOTIFICATIONS RETOURS CLIENTS (Email Transactionnel Direct)
// ------------------------------------------------------------------------------

/**
 * Notifie le client lorsque son devis de réparation est prêt
 */
export async function sendClientQuoteEmail({
  clientEmail,
  clientNom,
  numeroTicket,
  numeroDevis,
  montantTotal,
  typeMateriel,
}: {
  clientEmail: string;
  clientNom: string;
  numeroTicket: string;
  numeroDevis: string;
  montantTotal: number;
  typeMateriel: string;
}) {
  if (!resend || !clientEmail) return;

  try {
    const trackingLink = `${appUrl}/suivi/${numeroTicket}`;
    const pdfLink = `${appUrl}/api/documents/${numeroDevis}/pdf`;

    await resend.emails.send({
      from: emailFrom,
      to: clientEmail,
      subject: `📄 Votre devis de réparation N° ${numeroDevis} — RyHaD Tic-Medic`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1E4D8B; margin: 0; font-size: 22px;">RyHaD Tic-Medic</h1>
            <p style="color: #666; font-size: 13px; margin-top: 5px;">Atelier de Maintenance & Diagnostic Technique</p>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px;">
            <h2 style="color: #1C222B; font-size: 18px; margin-top: 0;">Bonjour ${clientNom},</h2>
            <p style="color: #4B5563; font-size: 14px;">
              Le diagnostic technique de votre <strong>${typeMateriel.replace(/_/g, " ")}</strong> (Dossier <strong>${numeroTicket}</strong>) est terminé.
            </p>
            <div style="background-color: #F4F6F8; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280;">Montant total estimé des réparations :</p>
              <div style="font-size: 24px; font-weight: 800; color: #1E4D8B;">${formatFCFA(montantTotal)}</div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #6B7280;">Devis Réf : ${numeroDevis}</p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${pdfLink}" style="background-color: #1E4D8B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 10px;">
                📥 Télécharger le Devis PDF
              </a>
              <a href="${trackingLink}" style="background-color: #2CA58D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                🔍 Suivre en direct
              </a>
            </div>
            <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
              Pour valider ce devis ou pour toute précision, vous pouvez contacter notre atelier ou nous répondre directement.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #9CA3AF;">
            RyHaD Tic-Medic • Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin • +229 01 90 88 13 14
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erreur envoi email devis client:", error);
  }
}

/**
 * Notifie le client lorsque la réparation est achevée et prête pour retrait
 */
export async function sendClientReadyForPickupEmail({
  clientEmail,
  clientNom,
  numeroTicket,
  typeMateriel,
}: {
  clientEmail: string;
  clientNom: string;
  numeroTicket: string;
  typeMateriel: string;
}) {
  if (!resend || !clientEmail) return;

  try {
    const trackingLink = `${appUrl}/suivi/${numeroTicket}`;

    await resend.emails.send({
      from: emailFrom,
      to: clientEmail,
      subject: `🎉 Votre équipement est prêt pour retrait ! — Dossier ${numeroTicket}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1E4D8B; margin: 0; font-size: 22px;">RyHaD Tic-Medic</h1>
            <p style="color: #666; font-size: 13px; margin-top: 5px;">Atelier de Maintenance & Réparation</p>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px;">
            <h2 style="color: #2CA58D; font-size: 18px; margin-top: 0;">Bonne nouvelle ${clientNom} !</h2>
            <p style="color: #4B5563; font-size: 14px;">
              La réparation et tous les tests de conformité de votre <strong>${typeMateriel.replace(/_/g, " ")}</strong> (Dossier <strong>${numeroTicket}</strong>) sont terminés avec succès.
            </p>
            <div style="background-color: #F4F6F8; border-radius: 8px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #1C222B;">📍 Adresse de retrait :</p>
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #4B5563;">Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #1C222B;">🕒 Horaires d'ouverture :</p>
              <p style="margin: 0; font-size: 13px; color: #4B5563;">Lundi à Vendredi de 9h00 à 20h00</p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${trackingLink}" style="background-color: #2CA58D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                Consulter mon dossier de clôture
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erreur envoi email retrait client:", error);
  }
}
