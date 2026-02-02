# Local-First Development Guide

This repository is optimized for **Local-First Development**, meaning business logic and applications run natively on your machine, while infrastructure (Databases, Caches) runs in isolated containers.

## Why Local-First?
- **Speed:** Instant hot-reloading for UI and Backend.
- **Debugging:** Attach your IDE debugger directly to the process.
- **Stability:** Bypasses Docker networking/volume complexities on Windows.

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - pnpm (`npm i -g pnpm`)
   - Docker Desktop (running)

2. **Start the System**
   ```powershell
   .\scripts\start-local-dev.ps1
   ```
   This script will:
   - Start Postgres, Redis, and OTel Collector in Docker.
   - Install dependencies.
   - Launch all applications (`heady-automation-ide`, etc.) natively.

3. **Access Points**
   - **Automation IDE:** [http://localhost:5173](http://localhost:5173)
   - **API Server:** [http://localhost:4100](http://localhost:4100)
   - **Database:** `localhost:5432` (User: `heady`, Pass: `heady123`)

## Architecture Notes

### Core Logic (`packages/core-domain`)
- Strictly decoupled from frameworks.
- Pure TypeScript.
- **Verification:** Run `pnpm test` in `packages/core-domain`.

### Infrastructure
- Defined in `docker-compose.yml`.
- Only `db`, `redis`, and `otel-collector` are used in Local-First mode.
- The `ide`, `lens`, and `gateway` services in docker-compose are for **Production/Containerized** testing only.

## Troubleshooting

**"Port already in use"**
- Stop existing Node processes or Docker containers.
- Run `docker-compose down` to clear stuck containers.

**"Connection refused to localhost:5432"**
- Ensure Docker Desktop is running.
- Check if the database container is healthy: `docker ps`.
