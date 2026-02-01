---
description: Start the complete Heady Systems full-stack environment
---
# Full Stack Startup Workflow

This workflow guides you through starting the entire Heady Systems environment, including backend services, web apps, and databases.

1. **Check Prerequisites**
   Ensure you have Node.js (>=20), pnpm (>=8), and Docker installed.
   ```powershell
   node -v
   pnpm -v
   docker -v
   ```

2. **Install Dependencies**
   Install all project dependencies from the root.
   ```powershell
   // turbo
   pnpm install
   ```

3. **Build Packages**
   Build all shared packages and applications.
   ```powershell
   // turbo
   pnpm build
   ```

4. **Start Infrastructure (Docker)**
   Start the required database and cache services (PostgreSQL, Redis).
   ```powershell
   // turbo
   docker-compose up -d
   ```

5. **Start Development Servers**
   Start the development servers for the backend and web apps.
   ```powershell
   pnpm dev
   ```

6. **Verify Services**
   Run the verification script to ensure everything is healthy.
   ```powershell
   // turbo
   node scripts/verify-services.js
   ```

## Troubleshooting
- If Docker fails, check if ports 5432 (Postgres) or 6379 (Redis) are already in use.
- If `pnpm dev` fails, ensure `pnpm build` completed successfully first.
