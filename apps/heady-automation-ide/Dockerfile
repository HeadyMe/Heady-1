# Base stage with dependencies
FROM node:20-slim AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
# Copy entire monorepo to ensure workspace structure matches lockfile
COPY . .

# Install dependencies for the whole workspace
RUN pnpm install --frozen-lockfile

# Build stage for client
FROM deps AS builder

# Build the specific app
WORKDIR /app/apps/heady-automation-ide
RUN pnpm run build

# Production stage
FROM node:20-slim AS runner
WORKDIR /app

# Copy built artifacts and necessary files
# We need the root node_modules because of hoisting
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy the app specific files
COPY --from=builder /app/apps/heady-automation-ide/package.json ./apps/heady-automation-ide/package.json
COPY --from=builder /app/apps/heady-automation-ide/dist ./apps/heady-automation-ide/dist
# Copy app node_modules if any (unhoisted)
COPY --from=builder /app/apps/heady-automation-ide/node_modules ./apps/heady-automation-ide/node_modules

WORKDIR /app/apps/heady-automation-ide
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
