---
description: Protocol for creating and classifying new System Nodes (Local vs. Distributed)
---

# Node Creation Protocol (NCP)

Use this workflow when adding **ANY** new functionality, service, or logic block ("Node") to the Heady Ecosystem.

## 1. Classification Phase
**Objective:** Determine if the Node is "Core/Local" or "Edge/Distributed".

### Questionnaire
Ask the following questions about the new feature:
1. **State:** Does it need to share memory with the main application?
   - *Yes* -> **Local Node**
   - *No* -> Continue
2. **Latency:** Does it require <10ms response time anywhere in the world?
   - *Yes* -> **Distributed Node (Edge)**
   - *No* -> Continue
3. **Compute:** Is it a heavy, long-running process (video processing, AI training)?
   - *Yes* -> **Distributed Node (Worker)**
   - *No* -> **Local Node** (Default)

## 2. Assignment Phase

Based on the classification, assign the implementation path:

### Path A: Local Node (The "Organ")
*Best for: Business Logic, UI, CRUD, Orchestration*
- **Location:** `packages/core-domain/src/[domain]/` OR `packages/ui/src/components/`
- **Structure:** TypeScript Module.
- **Dependency:** Strictly coupled to `@heady/core-domain`.
- **Action:**
  1. Create folder in `packages/core-domain`.
  2. Export from `index.ts`.
  3. Register in `packages/core-domain/src/context/state-store.ts` if it needs state.

### Path B: Distributed Node Candidate (The "Limb")
*Best for: AI Agents, Scrapers, High-Scale APIs, Edge Functions*
- **Location:** `apps/services/[node-name]` (New Directory)
- **Structure:** Standalone `package.json`, Dockerfile.
- **Dependency:** Loose coupling via HTTP/MCP or Queue (Redis).
- **Action:**
  1. Create new directory in `apps/services/`.
  2. Initialize with `pnpm init`.
  3. Add `Dockerfile` for eventual deployment.
  4. Create `interface.ts` (The Contract) in `packages/core-domain` so Local Nodes know how to talk to it.

## 3. Execution Template

**For User/AI:** When requesting a new node, specify the Type:

```markdown
# New Node Request
**Name:** [Node Name]
**Type:** [Local | Distributed]
**Reason:** [Why this classification?]
```

## 4. Migration Protocol (Growth)
If a **Local Node** becomes too heavy:
1. Extract logic to `apps/services/[name]`.
2. Wrap in Fastify/Express/Hono server.
3. Replace Local direct calls with MCP/HTTP calls.
