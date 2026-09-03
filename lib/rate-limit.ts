/**
 * Module de Rate Limiting Hybride
 * Supporte Upstash Redis (REST) en environnement distribué multi-instances
 * avec fallback transparent sur fenêtre glissante en mémoire locale.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const localTracker = new Map<string, RateLimitRecord>();

// Nettoyage périodique toutes les 5 minutes pour la mémoire locale
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of localTracker.entries()) {
      if (now > record.resetAt) {
        localTracker.delete(key);
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
  const windowSec = Math.ceil(windowMs / 1000);
  const now = Date.now();

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Si Upstash Redis est configuré (Multi-instances / Serverless distribué)
  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      // Incrément atomique via pipeline REST
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSec],
        ]),
      });

      if (pipelineRes.ok) {
        const results = await pipelineRes.json();
        const currentCount = (results[0]?.result as number) || 1;
        const remaining = Math.max(0, limit - currentCount);

        return {
          success: currentCount <= limit,
          remaining,
          resetAt: now + windowMs,
        };
      }
    } catch {
      // Fallback silencieux sur la mémoire locale en cas d'indisponibilité réseau Redis
    }
  }

  // 2. Fallback Mémoire Locale (Sliding Window)
  const record = localTracker.get(identifier);

  if (!record || now > record.resetAt) {
    localTracker.set(identifier, {
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

