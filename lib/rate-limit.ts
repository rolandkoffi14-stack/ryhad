/**
 * Utilitaire de Rate Limiting en mémoire (Sliding Window)
 * Conçu pour protéger les routes API contre le flood, le brute-force et le DoS
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

// Nettoyage périodique toutes les 5 minutes pour éviter toute fuite mémoire
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetAt) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit?: number; // Nombre max de requêtes autorisées
  windowMs?: number; // Durée de la fenêtre en millisecondes (ex: 60000 = 1 min)
}

/**
 * Vérifie et incrémente le compteur pour un identifiant donné (généralement l'IP)
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60 * 1000;
  const now = Date.now();

  const record = tracker.get(identifier);

  if (!record || now > record.resetAt) {
    // Nouvelle fenêtre
    tracker.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Extrait l'adresse IP du client depuis les en-têtes de la requête
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
