# ==============================================================================
# Dockerfile Multi-Stage de Production — RyHaD Tic-Medic (Coolify & VPS)
# Optimisé pour Next.js 15 Standalone + Prisma 6 + Alpine Linux
# ==============================================================================

# 1. Base commune
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dépendances de build
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# 3. Compilation Next.js
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables de build Next.js (inlinées dans les bundles client)
ARG NEXT_PUBLIC_APP_URL=https://ryhad.2krmarket.online
ARG NEXT_PUBLIC_COMPANY_NAME="RyHaD Tic-Medic"
ARG NEXT_PUBLIC_COMPANY_PHONE="+229 01 90 88 13 14"
ARG NEXT_PUBLIC_COMPANY_EMAIL="ryhadticmedic@gmail.com"
ARG NEXT_PUBLIC_COMPANY_WEBSITE_DISPLAY="ryhad.2krmarket.online"

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME
ENV NEXT_PUBLIC_COMPANY_PHONE=$NEXT_PUBLIC_COMPANY_PHONE
ENV NEXT_PUBLIC_COMPANY_EMAIL=$NEXT_PUBLIC_COMPANY_EMAIL
ENV NEXT_PUBLIC_COMPANY_WEBSITE_DISPLAY=$NEXT_PUBLIC_COMPANY_WEBSITE_DISPLAY

# Générer le client Prisma puis compiler Next.js
RUN npx prisma generate
RUN npx next build

# 4. Image finale légère d'exécution
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Utilisateur non-root sécurisé
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Fichiers statiques et assets publics
COPY --from=builder /app/public ./public

# Préparer le cache Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copier uniquement la sortie standalone ultra-légère
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Dossier d'uploads persistant
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
