---
description: Deploy and manage Cloudflare Edge Router
---
# Edge Router Deployment Workflow

This workflow manages the deployment of the Cloudflare Worker that acts as the edge router for the Heady System.

1. **Navigate to Infrastructure Directory**
   The worker configuration is located in the infra folder.
   ```powershell
   cd infra/cloudflare-workers
   ```

2. **Start Local Development**
   Run the worker locally using Wrangler.
   ```powershell
   // turbo
   pnpm dev
   ```

3. **Deploy to Staging**
   Deploy the worker to the staging environment.
   ```powershell
   // turbo
   pnpm deploy:staging
   ```

4. **Deploy to Production**
   Deploy the worker to the production environment.
   ```powershell
   // turbo
   pnpm deploy:production
   ```

5. **View Logs (Tail)**
   Stream live logs from the deployed worker.
   ```powershell
   pnpm tail
   ```

## Configuration
- **Entry Point**: `edge-router.ts`
- **Config File**: `wrangler.toml`
- **Secrets**: Managed via Cloudflare Dashboard or `wrangler secret put`.
