---
name: web-development
description: Develop and deploy the Heady Web Frontends (Next.js)
auto_execution_mode: 2
---
# Web Frontend Development Workflow

This workflow covers the development lifecycle for the Next.js web applications in the Heady ecosystem.

1. **Start Development Servers**
   Run the development servers for both web applications.
   - `web-heady-connection`: Port 3000
   - `web-heady-systems`: Port 3001
   ```powershell
   // turbo
   pnpm dev --filter web-heady-connection --filter web-heady-systems
   ```

2. **Run Individual App**
   If you only need one app, filter by its package name.
   ```powershell
   pnpm dev --filter web-heady-connection
   ```

3. **Build Applications**
   Create production builds for deployment.
   ```powershell
   // turbo
   pnpm build --filter web-heady-connection
   pnpm build --filter web-heady-systems
   ```

4. **Lint and Format**
   Ensure code quality before committing.
   ```powershell
   // turbo
   pnpm lint --filter web-heady-connection
   pnpm lint --filter web-heady-systems
   ```

## Application Details
- **Heady Connection (`web-heady-connection`)**: The main user portal for connecting services.
- **Heady Systems (`web-heady-systems`)**: The dashboard for system administration and monitoring.
