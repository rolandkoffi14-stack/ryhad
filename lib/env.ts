import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire pour connecter PostgreSQL."),
  NEXTAUTH_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("RyHaD Tic-Medic <notifications@ryhad.bj>"),
  NOTIFICATION_EMAIL: z.string().default("ryhadticmedic@gmail.com"),
  NEXT_PUBLIC_APP_URL: z.string().default("https://www.ryhad.bj"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default("ryhad-media"),
  R2_PUBLIC_URL: z.string().default("https://media.ryhad.bj"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:ryhadticmedic@gmail.com"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ ERREUR DE CONFIGURATION ENVIRONNEMENT :");
    console.error(parsed.error.format());
    // En production, lever une erreur bloquante explicite
    if (process.env.NODE_ENV === "production") {
      throw new Error("Variables d'environnement critiques manquantes.");
    }
  }
  return parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();
