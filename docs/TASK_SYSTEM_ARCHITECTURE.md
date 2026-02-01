# Real-time Task Management System Architecture

## Overview
The goal is to integrate the robust, Redis-backed `@heady/task-manager` package into the `heady-automation-ide` application, replacing the current in-memory task management. This ensures persistence, scalability, and better reliability.

## Architecture Components

### 1. Backend (`apps/heady-automation-ide/src/server`)
- **Core**: Replace `RealtimeTaskManager` (in-memory) with `TaskManager` from `@heady/task-manager`.
- **Queue**: Replace internal `TaskQueue` with `BullMQ` based queue from `@heady/task-manager`.
- **Storage**: Use PostgreSQL via `TaskRepository` for task persistence.
- **Real-time**:
  - Integrate `TaskWebSocketServer` logic into the existing Socket.IO setup.
  - Or, better yet, use `TaskManager`'s event emitters to bridge events to the existing `io` instance to maintain control over the socket server in the main app.

### 2. Frontend (`apps/heady-automation-ide/src/client`)
- **Dashboard**: Update `TaskMonitor.tsx` to consume events emitted by the new system.
- **Events**:
  - `task:created` -> `task:created` (Verify payload structure)
  - `task:status` -> `task:started`, `task:completed`, `task:failed` (Map these)
  - `task:progress` -> `task:progress`
  - `metrics:update` -> `system:metrics` (or add new metrics handler)

## Integration Steps

1.  **Dependencies**: Add `@heady/task-manager` to `heady-automation-ide` workspace dependencies.
2.  **Configuration**: Add Redis and Postgres configuration to `.env` and `heady-automation-ide` config loading.
3.  **Server Refactor**:
    - Initialize `TaskManager` in `src/server/index.ts`.
    - Replace `app.post('/api/task/execute')` handler to use `taskManager.createTask()`.
    - Register Executors: Move logic from `task-router.ts` into `TaskExecutor` implementations registered with `TaskManager`.
4.  **Frontend Refactor**:
    - Update `TaskMonitor` to handle the `Task` type definition from `@heady/task-manager`.
    - Update event listeners.

## Data Flow
1.  **Task Creation**: Client/API -> `TaskManager.createTask()` -> DB & Redis Queue.
2.  **Execution**: `BullMQ Worker` -> `Executor` (e.g., Playwright) -> Updates Progress.
3.  **Monitoring**: `TaskManager` emits events -> Socket.IO -> Client Dashboard.

## Key Changes
- **Persistence**: Tasks survive server restarts.
- **Scalability**: Workers can be scaled independently (though currently in same process for simplicity).
- **Reliability**: Retries and error handling provided by BullMQ.

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
