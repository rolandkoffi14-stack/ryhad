import { Resend } from "resend";
import { env } from "@/lib/env";

const resendApiKey = env.RESEND_API_KEY;
const emailFrom = env.EMAIL_FROM || "RyHaD Tic-Medic <notifications@ryhad.bj>";
const workshopEmail = env.NOTIFICATION_EMAIL || "ryhadticmedic@gmail.com";
const appUrl = env.NEXT_PUBLIC_APP_URL || "https://www.ryhad.bj";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendInterventionNotificationParams {
  numeroTicket: string;
  clientNom: string;
  clientEmail?: string | null;
  clientTelephone: string;
  typeMateriel: string;
  panneDeclaree: string;
}

/**
 * Envoie un email de confirmation au client et une alerte à l'atelier
 */
export async function sendInterventionNotification({
  numeroTicket,
  clientNom,
  clientEmail,
  clientTelephone,
  typeMateriel,
  panneDeclaree,
}: SendInterventionNotificationParams) {
  if (!resend) {
    console.log(`[EMAIL DEV MODE] Notification Ticket ${numeroTicket} pour ${clientNom} (${clientTelephone})`);
    return { success: true, mocked: true };
  }

  try {
    const trackingLink = `${appUrl}/suivi/${numeroTicket}`;

    // 1. Notification à l'atelier RyHaD Tic-Medic
    await resend.emails.send({
      from: emailFrom,
      to: workshopEmail,
      subject: `🚨 Nouveau Ticket Reçu : ${numeroTicket} (${clientNom})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
          <h2 style="color: #1E4D8B;">Nouveau dossier d'intervention déposé</h2>
          <p><strong>Numéro du Ticket :</strong> ${numeroTicket}</p>
          <p><strong>Client :</strong> ${clientNom} (${clientTelephone})</p>
          <p><strong>Matériel :</strong> ${typeMateriel.replace(/_/g, " ")}</p>
          <p><strong>Panne signalée :</strong> ${panneDeclaree}</p>
          <p style="margin-top: 20px;">
            <a href="${appUrl}/crm" style="background-color: #1E4D8B; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Consulter le ticket dans le CRM
            </a>
          </p>
        </div>
      `,
    });

    // 2. Email de confirmation au client (si email fourni)
    if (clientEmail) {
      await resend.emails.send({
        from: emailFrom,
        to: clientEmail,
        subject: `Prise en charge de votre matériel — Dossier N° ${numeroTicket}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
            <h2 style="color: #1E4D8B;">RyHaD Tic-Medic — Votre demande a bien été reçue</h2>
            <p>Bonjour <strong>${clientNom}</strong>,</p>
            <p>Nous vous confirmons l'enregistrement de votre demande d'intervention pour votre <strong>${typeMateriel.replace(
              /_/g,
              " "
            )}</strong>.</p>
            <p>Votre numéro de dossier est : <strong style="color: #1E4D8B; font-size: 16px;">${numeroTicket}</strong></p>
            <p>Vous pouvez suivre l'état d'avancement du diagnostic et de la réparation en temps réel :</p>
            <p style="margin: 25px 0;">
              <a href="${trackingLink}" style="background-color: #2CA58D; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Suivre mon dossier en direct
              </a>
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777;">
              RyHaD Tic-Medic • Gbégamey, Cotonou, Bénin • Tél : +229 01 90 88 13 14
            </p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email Resend:", error);
    return { success: false, error };
  }
}

/**
 * Envoie une notification lors d'une demande commerciale (vente, location, formation)
 */
export async function sendCommercialNotification(data: {
  nom: string;
  telephone: string;
  email?: string | null;
  typeDemande: string;
  description: string;
}) {
  if (!resend) {
    console.log(`[EMAIL DEV MODE] Demande commerciale reçue de ${data.nom} (${data.typeDemande})`);
    return { success: true, mocked: true };
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to: workshopEmail,
      subject: `💼 Demande Commerciale : ${data.typeDemande.replace(/_/g, " ")} (${data.nom})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
          <h2 style="color: #1E4D8B;">Nouvelle demande commerciale reçue</h2>
          <p><strong>Prospect :</strong> ${data.nom} (${data.telephone})</p>
          <p><strong>Type :</strong> ${data.typeDemande.replace(/_/g, " ")}</p>
          <p><strong>Description du besoin :</strong></p>
          <blockquote style="background: #F4F6F8; padding: 12px; border-left: 4px solid #1E4D8B;">
            ${data.description}
          </blockquote>
          <p style="margin-top: 20px;">
            <a href="${appUrl}/crm/demandes-commerciales" style="background-color: #1E4D8B; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Traiter dans le CRM
            </a>
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email commercial Resend:", error);
    return { success: false, error };
  }
}
