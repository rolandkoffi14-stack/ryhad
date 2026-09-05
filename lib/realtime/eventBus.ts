import { EventEmitter } from "events";

/**
 * Types d'événements temps réel supportés dans le CRM
 */
export type CrmEventType =
  | "ticket:created"
  | "ticket:updated"
  | "tickets:batch_created"
  | "document:created"
  | "document:updated"
  | "demande:created"
  | "demande:updated"
  | "client:updated"
  | "contrat:updated"
  | "utilisateur:updated"
  | "notification:new"
  | "crm:refresh";

export interface CrmEventPayload {
  type: CrmEventType;
  resourceId?: string;
  userId?: string;
  timestamp: number;
}

// Déclaration globale pour conserver l'instance unique pendant le développement
declare global {
  var __crmEventBus: EventEmitter | undefined;
}

export const crmEventBus: EventEmitter =
  globalThis.__crmEventBus || new EventEmitter();

// Augmenter la limite pour supporter plusieurs collaborateurs connectés simultanément
crmEventBus.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalThis.__crmEventBus = crmEventBus;
}

/**
 * Diffuse un événement temps réel à tous les clients connectés au CRM
 */
export function broadcastCrmEvent(
  type: CrmEventType,
  resourceId?: string,
  userId?: string
) {
  try {
    const payload: CrmEventPayload = {
      type,
      resourceId,
      userId,
      timestamp: Date.now(),
    };
    crmEventBus.emit("crm-event", payload);
  } catch (err) {
    console.error("Erreur lors de l'émission broadcastCrmEvent:", err);
  }
}
