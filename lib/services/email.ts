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
    const atelierRes = await resend.emails.send({
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

    if (atelierRes.error) {
      console.error("[RESEND ERROR] Envoi notification atelier:", atelierRes.error);
    }

    // 2. Email de confirmation au client (si email fourni)
    if (clientEmail) {
      const clientRes = await resend.emails.send({
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

      if (clientRes.error) {
        console.error("[RESEND ERROR] Envoi confirmation client:", clientRes.error);
      }
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

/**
 * Envoie un email à l'atelier lors de la réception d'un message depuis le formulaire de contact
 */
export async function sendContactNotification(data: {
  nom: string;
  telephone: string;
  email?: string | null;
  sujet: string;
  message: string;
}) {
  if (!resend) {
    console.log(`[EMAIL DEV MODE] Message de contact de ${data.nom} (${data.telephone}) - Sujet: ${data.sujet}`);
    return { success: true, mocked: true };
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to: workshopEmail,
      replyTo: data.email || undefined,
      subject: `📩 Message de Contact Site : ${data.sujet} (${data.nom})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B;">
          <h2 style="color: #1E4D8B;">Nouveau message reçu depuis le site RyHaD Tic-Medic</h2>
          <p><strong>Nom de l'expéditeur :</strong> ${data.nom}</p>
          <p><strong>Téléphone :</strong> ${data.telephone}</p>
          <p><strong>Email :</strong> ${data.email || "Non renseigné"}</p>
          <p><strong>Objet du message :</strong> ${data.sujet}</p>
          <p><strong>Message :</strong></p>
          <blockquote style="background: #F4F6F8; padding: 14px; border-left: 4px solid #1E4D8B; border-radius: 4px; font-style: normal; margin: 15px 0;">
            ${data.message.replace(/\n/g, "<br/>")}
          </blockquote>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">
            RyHaD Tic-Medic • Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin • Tél : +229 01 90 88 13 14
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email contact Resend:", error);
    return { success: false, error };
  }
}

/**
 * Envoie un email sécurisé de réinitialisation de mot de passe (valable 30 min)
 */
export async function sendPasswordResetEmail({
  email,
  firstName,
  resetUrl,
}: {
  email: string;
  firstName: string;
  resetUrl: string;
}) {
  if (!resend) {
    console.log(`[EMAIL DEV MODE] Lien de réinitialisation pour ${email} : ${resetUrl}`);
    return { success: true, mocked: true };
  }

  try {
    const res = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "🔒 Réinitialisation de votre mot de passe — RyHaD Tic-Medic",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1E4D8B; margin: 0; font-size: 22px;">RyHaD Tic-Medic</h1>
            <p style="color: #666; font-size: 13px; margin-top: 5px;">Portail d'Administration & Gestion d'Atelier</p>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px;">
            <h2 style="color: #1C222B; font-size: 18px; margin-top: 0;">Bonjour ${firstName},</h2>
            <p style="color: #4B5563; font-size: 14px;">
              Une demande de réinitialisation de votre mot de passe a été initiée pour votre compte staff RyHaD Tic-Medic.
            </p>
            <p style="color: #4B5563; font-size: 14px;">
              Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe sécurisé (ce lien est à usage unique et expire dans <strong>30 minutes</strong>) :
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #1E4D8B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                Définir un nouveau mot de passe
              </a>
            </div>
            <p style="color: #6B7280; font-size: 12px; margin-top: 25px; border-top: 1px solid #F3F4F6; padding-top: 15px;">
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #9CA3AF;">
            RyHaD Tic-Medic • Gbégamey, Cotonou, Bénin • +229 01 90 88 13 14
          </div>
        </div>
      `,
    });

    if (res.error) {
      console.error("[RESEND ERROR] Erreur envoi réinitialisation mot de passe:", res.error);
      return { success: false, error: res.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email réinitialisation Resend:", error);
    return { success: false, error };
  }
}

/**
 * Alerte de sécurité lors de la modification réussie d'un mot de passe
 */
export async function sendPasswordChangedAlert({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  if (!resend) {
    console.log(`[EMAIL DEV MODE] Alerte mot de passe modifié pour ${email}`);
    return { success: true, mocked: true };
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "🛡️ Confirmation : votre mot de passe a été modifié — RyHaD Tic-Medic",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2CA58D;">Mot de passe mis à jour avec succès</h2>
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Nous vous confirmons que le mot de passe de votre compte staff <strong>${email}</strong> vient d'être modifié avec succès.</p>
          <p>Si vous êtes à l'origine de cette action, aucune démarche supplémentaire n'est requise.</p>
          <p style="color: #E2574C; font-size: 13px; font-weight: bold; margin-top: 20px;">
            ⚠️ Si vous n'avez pas modifié votre mot de passe, contactez immédiatement l'administrateur de l'atelier RyHaD.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur alerte mot de passe Resend:", error);
    return { success: false, error };
  }
}

/**
 * Envoie un email de bienvenue à un nouveau collaborateur avec ses identifiants
 */
export async function sendWelcomeUserEmail({
  email,
  firstName,
  role,
  temporaryPassword,
  loginUrl,
}: {
  email: string;
  firstName: string;
  role: string;
  temporaryPassword?: string;
  loginUrl: string;
}) {
  if (!resend) {
    console.log(`[EMAIL DEV MODE] Bienvenue collaborateur ${firstName} (${email}) - Rôle: ${role}`);
    return { success: true, mocked: true };
  }

  try {
    const roleLabels: Record<string, string> = {
      ADMIN: "Administrateur",
      RECEPTIONNISTE: "Réceptionniste / Accueil",
      TECHNICIEN: "Technicien d'Atelier",
    };

    const res = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "🎉 Bienvenue dans l'équipe RyHaD Tic-Medic — Vos accès CRM",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1C222B; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1E4D8B; margin: 0; font-size: 22px;">RyHaD Tic-Medic</h1>
            <p style="color: #666; font-size: 13px; margin-top: 5px;">Espace de Gestion & Suivi d'Interventions</p>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px;">
            <h2 style="color: #1C222B; font-size: 18px; margin-top: 0;">Bienvenue ${firstName} !</h2>
            <p style="color: #4B5563; font-size: 14px;">
              Votre compte collaborateur a été créé sur l'application CRM de RyHaD Tic-Medic avec le rôle : <strong>${roleLabels[role] || role}</strong>.
            </p>
            <div style="background-color: #F4F6F8; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px;">
              <p style="margin: 0 0 8px 0;"><strong>Identifiant (Email) :</strong> ${email}</p>
              ${temporaryPassword ? `<p style="margin: 0;"><strong>Mot de passe initial :</strong> <code style="background: #E5E7EB; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code></p>` : ""}
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${loginUrl}" style="background-color: #1E4D8B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                Accéder au CRM Atelier
              </a>
            </div>
            <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
              Nous vous recommandons de modifier votre mot de passe dès votre première connexion.
            </p>
          </div>
        </div>
      `,
    });

    if (res.error) {
      console.error("[RESEND ERROR] Erreur envoi email bienvenue:", res.error);
      return { success: false, error: res.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur email bienvenue Resend:", error);
    return { success: false, error };
  }
}

