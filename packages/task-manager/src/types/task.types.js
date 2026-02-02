import { z } from 'zod';
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["RETRYING"] = "retrying";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["CRITICAL"] = 1] = "CRITICAL";
    TaskPriority[TaskPriority["HIGH"] = 2] = "HIGH";
    TaskPriority[TaskPriority["NORMAL"] = 3] = "NORMAL";
    TaskPriority[TaskPriority["LOW"] = 4] = "LOW";
})(TaskPriority || (TaskPriority = {}));
export const TaskSchema = z.object({
    id: z.string().uuid(),
    type: z.string(),
    name: z.string(),
    description: z.string().optional(),
    payload: z.any(),
    status: z.nativeEnum(TaskStatus),
    priority: z.nativeEnum(TaskPriority),
    attempts: z.number().default(0),
    maxRetries: z.number().default(3),
    progress: z.number().min(0).max(100).default(0),
    result: z.any().optional(),
    error: z.string().optional(),
    createdAt: z.date(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    scheduledFor: z.date().optional(),
    metadata: z.record(z.any()).optional(),
    parentTaskId: z.string().uuid().optional(),
    childTaskIds: z.array(z.string().uuid()).optional(),
});
//# sourceMappingURL=task.types.js.map