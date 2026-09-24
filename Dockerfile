FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip libsndfile1 openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY requirements-audio.txt requirements-pitch.txt /tmp/
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements-audio.txt
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ARG NEXT_PUBLIC_APP_URL=""
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG DATABASE_URL="postgresql://u:p@localhost:5432/db"
ARG DIRECT_URL="postgresql://u:p@localhost:5432/db"
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prompts ./prompts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/catalog ./catalog
COPY --from=builder /app/i18n ./i18n
COPY --from=builder /app/tsconfig.json ./
ARG INSTALL_BASIC_PITCH=false
RUN if [ "$INSTALL_BASIC_PITCH" = "true" ]; then pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements-pitch.txt; fi
EXPOSE 8080
CMD ["npm", "start"]
