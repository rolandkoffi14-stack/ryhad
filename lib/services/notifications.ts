import { db } from "@/lib/db";
import { sendWebPushToUsers } from "@/lib/services/push";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { NotificationType, StaffRole } from "@prisma/client";
import { formatFCFA } from "@/lib/format";

const resendApiKey = env.RESEND_API_KEY;
const emailFrom = env.EMAIL_FROM || "RyHaD Tic-Medic <notifications@ryhad.bj>";
const appUrl = env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface StaffNotificationOptions {
  userIds: string[];
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
 */
export async function sendStaffNotification({
  userIds,
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

    // 2. Envoi de la notification Web Push native
    if (sendPush) {
      await sendWebPushToUsers(userIds, {
        title: titre,
        body: message,
        url: lien,
        tag: `notif-${type}-${Date.now()}`,
      });
    }

    // 3. Envoi par email aux collaborateurs si un template est fourni
    if (emailSubject && emailHtml && resend) {
      const targetUsers = await db.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: { email: true, firstName: true },
      });

      const emailPromises = targetUsers.map((u) =>
        resend.emails.send({
          from: emailFrom,
          to: u.email,
          subject: emailSubject,
          html: emailHtml,
        }).catch((err) => console.error(`Erreur envoi email staff à ${u.email}:`, err))
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
// ÉVÉNEMENTS MÉTIERS STAFF
// ------------------------------------------------------------------------------

/**
 * Notifie l'administration et la réception lors du dépôt d'un nouveau ticket
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
    select: { id: true },
  });

  const staffIds = staff.map((s) => s.id);
  if (!staffIds.length) return;

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
    userIds: staffIds,
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
 * Notifie un technicien lorsqu'un ticket lui est assigné
 */
export async function notifyTechAssigned(ticket: {
  id: string;
  numero: string;
  typeMateriel: string;
  panneDeclaree: string;
  clientNom: string;
  technicienAssigneId: string;
}) {
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
 * Notifie le staff concerné lors de l'évolution d'un ticket (devis accepté, réparation terminée, etc.)
 */
export async function notifyStatusChangeToStaff({
  ticketId,
  numero,
  nouveauStatut,
  clientNom,
  technicienAssigneId,
}: {
  ticketId: string;
  numero: string;
  nouveauStatut: string;
  clientNom: string;
  technicienAssigneId?: string | null;
}) {
  const staffToNotify: string[] = [];

  // Ajouter le technicien assigné
  if (technicienAssigneId) {
    staffToNotify.push(technicienAssigneId);
  }

  // Ajouter admin et réceptionniste
  const receptionAndAdmin = await db.user.findMany({
    where: {
      role: { in: [StaffRole.ADMIN, StaffRole.RECEPTIONNISTE] },
      isActive: true,
    },
    select: { id: true },
  });

  receptionAndAdmin.forEach((s) => {
    if (!staffToNotify.includes(s.id)) staffToNotify.push(s.id);
  });

  if (!staffToNotify.length) return;

  let titre = `Dossier ${numero} mis à jour`;
  let message = `Le statut du ticket de ${clientNom} est passé à : ${nouveauStatut.replace(/_/g, " ")}`;
  let notifType: NotificationType = NotificationType.STATUT_CHANGE;

  if (nouveauStatut === "DEVIS_ACCEPTE") {
    titre = `✅ Devis accepté : ${numero}`;
    message = `Le client ${clientNom} a validé le devis. Facture de réparation émise.`;
    notifType = NotificationType.DEVIS_ACCEPTE;
  } else if (nouveauStatut === "DEVIS_REFUSE") {
    titre = `❌ Devis refusé : ${numero}`;
    message = `Le client ${clientNom} a refusé le devis. Matériel disponible pour restitution.`;
    notifType = NotificationType.DEVIS_REFUSE;
  } else if (nouveauStatut === "TERMINE") {
    titre = `🎉 Réparation terminée : ${numero}`;
    message = `Les tests sur l'équipement de ${clientNom} sont validés. Prêt pour retrait.`;
    notifType = NotificationType.STATUT_CHANGE;
  }

  await sendStaffNotification({
    userIds: staffToNotify,
    titre,
    message,
    type: notifType,
    lien: `/crm/tickets/${ticketId}`,
    sendPush: true,
  });
}

/**
 * Notifie le staff lors d'une nouvelle demande commerciale (vente, location, formation)
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
    select: { id: true },
  });

  const staffIds = staff.map((s) => s.id);
  if (!staffIds.length) return;

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
    userIds: staffIds,
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
