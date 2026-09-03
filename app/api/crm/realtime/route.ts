import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { crmEventBus, CrmEventPayload } from "@/lib/realtime/eventBus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Envoyer un message initial de connexion réussie
      const initialMessage = `data: ${JSON.stringify({
        type: "crm:connected",
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // 2. Gestionnaire d'événements temps réel
      const onCrmEvent = (payload: CrmEventPayload) => {
        try {
          const message = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (err) {
          console.error("Erreur émission message SSE:", err);
        }
      };

      crmEventBus.on("crm-event", onCrmEvent);

      // 3. Heartbeat périodique (toutes les 25 secondes) pour maintenir le socket ouvert
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);

      // 4. Nettoyage lors de la fermeture de la connexion par le client
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        crmEventBus.off("crm-event", onCrmEvent);
        try {
          controller.close();
        } catch {
          // Stream déjà fermé
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
