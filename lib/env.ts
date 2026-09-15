import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire pour connecter PostgreSQL."),
  NEXTAUTH_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("RyHaD Tic-Medic <notifications@ryhad.bj>"),
  NOTIFICATION_EMAIL: z.string().default("ryhadticmedic@gmail.com"),
  NEXT_PUBLIC_APP_URL: z.string().default("https://ryhad.2krmarket.online"),
  NEXT_PUBLIC_COMPANY_NAME: z.string().default("RyHaD Tic-Medic"),
  NEXT_PUBLIC_COMPANY_SHORT_NAME: z.string().default("RyHaD"),
  NEXT_PUBLIC_COMPANY_ADDRESS: z.string().default("Gbégamey, rue avant le collège Clé de la réussite, Cotonou, Bénin"),
  NEXT_PUBLIC_COMPANY_SHORT_ADDRESS: z.string().default("Gbégamey, Cotonou, Bénin"),
  NEXT_PUBLIC_COMPANY_PHONE: z.string().default("+229 01 90 88 13 14"),
  NEXT_PUBLIC_COMPANY_EMAIL: z.string().default("ryhadticmedic@gmail.com"),
  NEXT_PUBLIC_COMPANY_HOURS: z.string().default("Lundi – Vendredi, 9h – 20h"),
  NEXT_PUBLIC_COMPANY_WEBSITE_DISPLAY: z.string().default("ryhad.2krmarket.online"),
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

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXTAUTH_SECRET &&
    !process.env.AUTH_SECRET
  ) {
    throw new Error(
      "AUTH_SECRET ou NEXTAUTH_SECRET est obligatoire en environnement de production pour sécuriser les sessions."
    );
  }

  return parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();
