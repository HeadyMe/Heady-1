---
description: Verify the health and status of the Heady System
---
# System Verification Workflow

This workflow performs a comprehensive health check of the Heady Systems environment.

1. **Run Verification Script**
   Execute the automated verification script.
   ```powershell
   // turbo
   node scripts/verify-services.js
   ```

2. **Check Docker Containers**
   Manually inspect running containers if the script reports issues.
   ```powershell
   // turbo
   docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
   ```

3. **Check Backend Logs**
   View logs for the IDE backend service to identify errors.
   ```powershell
   // turbo
   docker-compose logs --tail=50 ide
   ```

4. **Check Mobile Assets**
   Verify that mobile assets are generated correctly.
   ```powershell
   // turbo
   node scripts/generate-mobile-assets.js
   ```
