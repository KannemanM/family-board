# syntax=docker/dockerfile:1

# ---------- Dependencias ----------
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# better-sqlite3 trae binarios precompilados; estas herramientas son el
# respaldo por si npm tiene que compilarlo en la arquitectura del servidor.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ---------- Build ----------
FROM node:24-bookworm-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/familyboard.db \
    TZ=America/Argentina/Buenos_Aires

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /data \
  && chown -R nextjs:nodejs /data

# El servidor standalone incluye solo lo que la app usa en producción.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Las migraciones se aplican al arrancar, desde ./drizzle.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
# Utilidad de recuperación de contraseñas.
COPY --from=builder --chown=nextjs:nodejs /app/scripts/reset-password.mjs ./scripts/reset-password.mjs

# El build genera una base vacía en ./data; no debe viajar a la imagen.
RUN rm -rf /app/data

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r) => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "server.js"]
