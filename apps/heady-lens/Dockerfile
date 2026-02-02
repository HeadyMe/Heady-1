FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./

# Copy packages
COPY packages/ui/package.json ./packages/ui/
COPY packages/core-domain/package.json ./packages/core-domain/
COPY apps/heady-lens/package.json ./apps/heady-lens/

# Install dependencies
RUN pnpm install

# Builder stage
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY . .

# Build
RUN pnpm --filter @heady/lens run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/heady-lens/public ./apps/heady-lens/public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/heady-lens/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/heady-lens/.next/static ./apps/heady-lens/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "apps/heady-lens/server.js"]
