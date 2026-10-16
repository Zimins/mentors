# Multi-stage Dockerfile for Google Cloud Run (Next.js 15 Standalone)
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN mkdir -p public/riv && npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV GOOGLE_CLOUD_PROJECT="h2gdm-hack26icn-2694"
ENV GCP_PROJECT_ID="h2gdm-hack26icn-2694"
ENV GOOGLE_CLOUD_PROJECT_NUMBER="1001204402150"
ENV GOOGLE_CLOUD_LOCATION="asia-northeast3"
ENV VERTEX_AGENT_DESIGNER_ID="agent_1792115718565"
ENV NEXT_PUBLIC_GCP_PROJECT_ID="h2gdm-hack26icn-2694"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
