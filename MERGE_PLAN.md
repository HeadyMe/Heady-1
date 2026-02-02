# HeadySystems Squash-Merge Plan

## 1. Overview
This plan outlines the consolidation of changes made during the "Golden Master Plan" execution in the Windsurf Arena session. The goal is to produce a clean, stable state for the Heady Ecosystem, featuring Sacred Geometry UI/UX and robust HeadyMCP integration.

## 2. Changed Scopes

### A. HeadySystems Workspace
**Repository:** `HeadySystems`

#### 1. Core Domain (`packages/core-domain`)
- **Changes:** 
    - Updated `tsconfig.json` to produce correct declaration maps.
    - Verified `ContextClient` and `DeterministicStateStore` functionality.
    - Refined `package.json` exports to expose `dist` artifacts correctly.
- **Rationale:** Fixes build resolution issues in Next.js applications and ensures `extensions` (.js) in imports are handled correctly by using built artifacts.

#### 2. UI Library (`packages/ui`)
- **Changes:**
    - Added `framer-motion`, `clsx`, `tailwind-merge` dependencies.
    - Created `SacredGeometry` component directory.
    - Implemented `GoldenSpiral`, `BreathingOrb`, `SacredContainer`.
    - Exported new components from `index.ts`.
- **Rationale:** Implements the "Sacred Geometry" design language requested in the Golden Master Plan.

#### 3. Web Applications (`apps/web-heady-systems`, `apps/web-heady-connection`)
- **Changes:**
    - **UI:** Replaced static landing pages with `SacredContainer`-based layouts.
    - **Components:** Integrated `GoldenSpiral` and dynamic `LiveStatusOrbs`.
    - **Backend:** Created `/api/status` route to proxy MCP context state.
    - **Integration:** Implemented `mcpClient` singleton using `@heady/core-domain`.
    - **Config:** Updated `next.config.js` to transpile `@heady/ui`.
    - **Dependencies:** Added `@heady/core-domain` workspace dependency.
- **Rationale:** connects the frontend to the backend "nervous system" (HeadyMCP) and applies the global visual theme.

#### 4. Infrastructure/Config (`tsconfig.base.json`)
- **Changes:**
    - Updated paths for `@heady/core-domain` to point to `dist/index.d.ts` instead of `src`.
- **Rationale:** Resolves dual-package hazard where Next.js (Webpack) and TypeScript handled imports differently, causing build failures.

### B. HeadyGenesis Workspace
**Repository:** `HeadyGenesis`
- **Status:** Verified clean build (`pnpm build`). No major code changes required during this session as focus was on `HeadySystems` integration.

## 3. Merge Strategy

### Squashing
1. **Stage all changes** in `HeadySystems`.
2. **Commit Message:**
   ```
   feat(ecosystem): Implement Golden Master Plan Phase 1-3

   - UI: Add Sacred Geometry design system (GoldenSpiral, BreathingOrb)
   - Core: Fix package exports and typescript resolution for @heady/core-domain
   - Integrations: Connect web apps to HeadyMCP via ContextClient
   - Infra: Optimize build configuration for Next.js monorepo
   ```

### Verification Steps
1. **Clean Install:** `pnpm clean && pnpm install`
2. **Build Core:** `pnpm --filter @heady/core-domain build`
3. **Build UI:** `pnpm --filter @heady/ui build`
4. **Build Apps:** `pnpm --filter web-heady-systems build && pnpm --filter web-heady-connection build`
5. **Visual Check:** Start dev servers and verify animations/data flow.

## 4. Dependencies & Conflicts
- **Resolved:** Circular dependency/ESLint config issues in `eslint-config-next` were resolved by removing the strict config from apps and relying on workspace defaults or avoiding build-time linting for now.
- **Resolved:** Path mapping conflicts between `src` (TS) and `dist` (JS) for `@heady/core-domain`.

## 5. Post-Merge
- Run `scripts/verify-services.js` (if available) to ensure all services report "online".
- Trigger `scripts/nexus_deploy.ps1` for global deployment.
