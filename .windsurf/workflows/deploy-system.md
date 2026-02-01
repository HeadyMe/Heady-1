---
description: Deploy the Heady System to production or staging environments
---
# System Deployment Workflow

This workflow covers the deployment of the Heady System to various targets including GitHub, Cloudflare, and Render.

1. **Nexus Deployment (Git Sync)**
   Push the latest code to the central GitHub repository (The "Nexus").
   ```powershell
   // turbo
   .\scripts\nexus_deploy.ps1
   ```

2. **Infrastructure Setup**
   Configure external services (GitHub, Cloudflare, Render, Drupal).
   ```powershell
   .\scripts\setup-infrastructure.ps1 -Environment development
   ```
   *Options:* `-SkipGitHub`, `-SkipCloudflare`, `-SkipRender`, `-SkipDrupal`

3. **Full Stack Local Deployment**
   Deploy the complete stack locally using Docker Compose (Build & Up).
   ```powershell
   .\scripts\deploy_heady_full_stack.ps1
   ```

4. **Verify Deployment**
   Check that all deployed services are running correctly.
   ```powershell
   // turbo
   node scripts/verify-services.js
   ```

## Deployment Targets
- **GitHub**: Source of Truth.
- **Render**: Backend services (Node.js) and Databases (Postgres/Redis).
- **Cloudflare**: Edge routing (Workers) and secure tunnels (Cloudflared).
- **Drupal**: Content Management System.
