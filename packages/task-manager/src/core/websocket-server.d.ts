import { Server as HttpServer } from 'http';
import { TaskEvent, Task, TaskMetrics } from '../types/task.types.js';
export interface WebSocketConfig {
    cors: {
        origin: string | string[];
        credentials?: boolean;
    };
    pingInterval?: number;
    pingTimeout?: number;
}
export declare class TaskWebSocketServer {
    private config;
    private io;
    private connections;
    private subscriptions;
    constructor(httpServer: HttpServer, config: WebSocketConfig);
    private setupHandlers;
    private subscribeToTask;
    private unsubscribeFromTask;
    private handleDisconnect;
    emitTaskEvent(event: TaskEvent): void;
    emitTaskCreated(task: Task): void;
    emitTaskStarted(taskId: string, data?: any): void;
    emitTaskProgress(taskId: string, progress: number, data?: any): void;
    emitTaskCompleted(taskId: string, result?: any): void;
    emitTaskFailed(taskId: string, error: string): void;
    emitMetrics(metrics: TaskMetrics): void;
    broadcast(event: string, data: any): void;
    sendToClient(clientId: string, event: string, data: any): void;
    getConnectionsCount(): number;
    getSubscriptionsCount(): number;
    close(): Promise<void>;
}
//# sourceMappingURL=websocket-server.d.ts.map