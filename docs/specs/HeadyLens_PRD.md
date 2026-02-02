# HeadyLens: Smart Task Tracker & System Dashboard PRD

## 1. Master Product Prompt
**Product Identity**: HeadyLens
**Goal**: Primary control surface for users, connecting to Heady architecture.

### High-level Objectives
1.  **Real-time System Status**: Visual dashboard of Heady architecture (Health, Agents, Latency).
2.  **AI-Driven Task Management**: Deterministic, incremental integration.
    *   Lifecycle: Planned → Ready → In Progress → Blocked → Review → Done.
    *   Features: Natural language creation, smart scheduling, versioned history.
3.  **Productivity Integrations**: Deep links to Docs/Spreadsheets/Slides.
4.  **Creative Studio**: Brainstorming, multimodal creativity.
5.  **Configurable Logic**: Sliders for creativity vs determinism, risk tolerance.

### Core Architecture Requirements
#### A. System Status Layer
*   **Input**: Real-time events (WebSockets/Event Bus).
*   **Display**: Global health, active agents, recent events, latency metrics.
*   **Overlay**: "Explain Mode" context panel.

#### B. AI Task Management Subsystem
*   **Entities**: Workspace, Project, Goal, Task, Subtask, Routine, Dependency, Tag, Agent, User.
*   **Determinism**: "Why this?" and "What if?" panels for every recommendation.
*   **Views**: Kanban, Timeline, Calendar, "Heady Flow" (Dependency Graph).

#### C. Incremental Integration Protocol (Stages)
1.  **Stage 0 (Observation)**: Read-only status, manual tasks.
2.  **Stage 1 (Advisory)**: Suggestions only, explicit acceptance.
3.  **Stage 2 (Semi-Autonomous)**: Allowed policies (e.g., auto-tag), daily summary, rollback.
4.  **Stage 3 (Domain Orchestration)**: Full orchestration of low-risk actions.
5.  **Stage 4 (Primary Orchestrator)**: Policy contract, human veto only.

### UX Guidelines
*   **Style**: Modular dashboard, card-based, dark/light themes.
*   **Layout**:
    *   Top: Status strip.
    *   Left: Nav (Lens, Tasks, Projects, Creative, Settings).
    *   Center: Dynamic widgets (Focus, Timeline, Agents).
    *   Right: Insight Panel.
*   **Performance**: <200ms perceived response.

## 2. Implementation Guidelines
*   **Frontend**: React/Vue/Svelte SPA.
*   **Realtime**: WebSockets/GraphQL.
*   **Backend**: API Gateway proxying to orchestration engine.
*   **Data**: Event-sourced logs.

## 3. Integration Guide for Heady Architecture API Gateway
**Role**: Single entry point.
**Stack**: Kong, APISIX, or Cloud Native.
**Routes**:
*   `/auth/*`: Login, tokens.
*   `/users/*`: Profiles, preferences.
*   `/tasks/*`: CRUD, suggestions.
*   `/events/*`: Real-time stream (WebSockets/SSE).
*   `/creative/*`: Generative endpoints.

**Security**:
*   OAuth2/JWT.
*   Rate limiting.
*   mTLS for internal services.

## 4. OpenTelemetry Configuration
*   **Backend**: Node.js SDK with OTLP exporter.
*   **Frontend**: Web Tracer Provider.
*   **Collector**: Receive OTLP (HTTP/gRPC), batch, export to backend (Tempo/SigNoz).
*   **Metrics**: HTTP requests, WS connections, Latency.
