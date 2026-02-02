import { EventEmitter } from 'events';
import { NodeStatus, MessageType } from './node-orchestrator.js';
export class OptimizedTaskRouter extends EventEmitter {
    orchestrator;
    monitor;
    workflowEngine;
    taskQueue = new Map();
    activeTasks = new Map();
    completedTasks = new Map();
    maxConcurrentPerNode = 5;
    taskTimeoutMs = 300000; // 5 minutes
    processingInterval = null;
    constructor(orchestrator, monitor, workflowEngine) {
        super();
        this.orchestrator = orchestrator;
        this.monitor = monitor;
        this.workflowEngine = workflowEngine;
        this.startProcessingLoop();
        this.setupEventHandlers();
    }
    // Submit task for routing and execution
    async submitTask(task) {
        const fullTask = {
            ...task,
            id: this.generateTaskId(task),
        };
        this.taskQueue.set(fullTask.id, fullTask);
        this.emit('task:submitted', {
            taskId: fullTask.id,
            type: fullTask.type,
            priority: fullTask.priority,
        });
        // Trigger immediate processing if high priority
        if (fullTask.priority >= 8) {
            this.processQueue();
        }
        return fullTask.id;
    }
    // Process task queue with optimal routing
    async processQueue() {
        const pendingTasks = Array.from(this.taskQueue.values())
            .filter(t => !this.activeTasks.has(t.id))
            .sort((a, b) => b.priority - a.priority);
        for (const task of pendingTasks) {
            const decision = this.makeRoutingDecision(task);
            if (decision.selectedNode) {
                await this.assignTask(task, decision);
            }
            else {
                // No suitable node found, emit backpressure signal
                this.emit('routing:backpressure', {
                    taskId: task.id,
                    reason: 'No available nodes with required capabilities',
                });
                break; // Stop processing to prevent overload
            }
        }
    }
    // Make optimal routing decision
    makeRoutingDecision(task) {
        // If target node specified, verify it's available
        if (task.targetNode) {
            const node = this.orchestrator.getNode(task.targetNode);
            if (node && node.status === NodeStatus.ONLINE) {
                return {
                    taskId: task.id,
                    selectedNode: task.targetNode,
                    strategy: 'targeted',
                    reason: 'Explicit target node specified and available',
                    alternatives: [],
                    estimatedLatency: node.latency,
                };
            }
        }
        // Get all online nodes with required tools
        const candidates = this.orchestrator.getAllNodes()
            .filter(n => n.status === NodeStatus.ONLINE)
            .filter(n => task.requiredTools.every(tool => n.tools.includes(tool)))
            .filter(n => {
            const activeCount = Array.from(this.activeTasks.values())
                .filter(t => t.nodeId === n.nodeId).length;
            return activeCount < this.maxConcurrentPerNode;
        });
        if (candidates.length === 0) {
            return {
                taskId: task.id,
                selectedNode: '',
                strategy: 'none',
                reason: 'No available nodes matching requirements',
                alternatives: [],
                estimatedLatency: Infinity,
            };
        }
        // Score candidates based on multiple factors
        const scored = candidates.map(node => {
            const activeTasks = Array.from(this.activeTasks.values())
                .filter(t => t.nodeId === node.nodeId).length;
            const loadFactor = activeTasks / this.maxConcurrentPerNode;
            // Get performance metrics
            const metrics = this.monitor.getMetrics(node.nodeId);
            const trend = metrics ? this.monitor.calculateTrend(node.nodeId, 'latency') : 'stable';
            // Calculate score (lower is better)
            let score = loadFactor * 50 + node.latency * 0.1;
            // Adjust for trends
            if (trend === 'degrading')
                score += 20;
            if (trend === 'improving')
                score -= 10;
            // Adjust for error rate
            if (metrics && metrics.errorRate > 1)
                score += metrics.errorRate * 5;
            return { nodeId: node.nodeId, score, latency: node.latency };
        });
        // Sort by score
        scored.sort((a, b) => a.score - b.score);
        // For deterministic tasks, use consistent hashing
        if (task.deterministic) {
            const hash = this.hashString(task.id + task.type);
            const index = hash % candidates.length;
            const selected = candidates[index];
            return {
                taskId: task.id,
                selectedNode: selected.nodeId,
                strategy: 'deterministic-hash',
                reason: 'Task marked as deterministic, using consistent hashing',
                alternatives: candidates.slice(0, 3).map(n => n.nodeId),
                estimatedLatency: selected.latency,
            };
        }
        // Select best node
        const best = scored[0];
        return {
            taskId: task.id,
            selectedNode: best.nodeId,
            strategy: 'optimal-load',
            reason: `Best score: ${best.score.toFixed(2)} (load + latency + trend adjusted)`,
            alternatives: scored.slice(1, 4).map(s => s.nodeId),
            estimatedLatency: best.latency,
        };
    }
    // Assign task to selected node
    async assignTask(task, decision) {
        this.taskQueue.delete(task.id);
        const assignment = {
            task,
            nodeId: decision.selectedNode,
            startTime: Date.now(),
        };
        this.activeTasks.set(task.id, assignment);
        // Send assignment message
        this.orchestrator.sendMessage({
            sourceNode: 'router',
            targetNode: decision.selectedNode,
            type: MessageType.TASK_ASSIGN,
            payload: {
                task,
                routingDecision: decision,
            },
            priority: task.priority,
            ttl: task.timeoutMs,
        });
        this.emit('task:assigned', {
            taskId: task.id,
            nodeId: decision.selectedNode,
            strategy: decision.strategy,
        });
        // Set timeout handler
        setTimeout(() => {
            this.handleTaskTimeout(task.id);
        }, task.timeoutMs);
    }
    // Handle task completion
    handleTaskComplete(taskId, nodeId, result) {
        const assignment = this.activeTasks.get(taskId);
        if (!assignment)
            return;
        const duration = Date.now() - assignment.startTime;
        const taskResult = {
            taskId,
            nodeId,
            success: true,
            result,
            duration,
            timestamp: Date.now(),
        };
        this.activeTasks.delete(taskId);
        this.completedTasks.set(taskId, taskResult);
        // Update node metrics
        const node = this.orchestrator.getNode(nodeId);
        if (node) {
            node.currentLoad = Math.max(0, node.currentLoad - 1);
        }
        this.emit('task:completed', taskResult);
    }
    // Handle task failure
    handleTaskFailed(taskId, nodeId, error) {
        const assignment = this.activeTasks.get(taskId);
        if (!assignment)
            return;
        const duration = Date.now() - assignment.startTime;
        const taskResult = {
            taskId,
            nodeId,
            success: false,
            error,
            duration,
            timestamp: Date.now(),
        };
        this.activeTasks.delete(taskId);
        this.completedTasks.set(taskId, taskResult);
        // Check if we should retry
        const task = assignment.task;
        if (task.deterministic) {
            // For deterministic tasks, try alternative nodes
            const decision = this.makeRoutingDecision(task);
            const alternatives = decision.alternatives.filter(id => id !== nodeId);
            if (alternatives.length > 0) {
                this.emit('task:retrying', {
                    taskId,
                    failedNode: nodeId,
                    retryNode: alternatives[0],
                });
                // Re-queue with alternative target
                this.submitTask({
                    ...task,
                    targetNode: alternatives[0],
                });
            }
            else {
                this.emit('task:failed', { taskId, nodeId, error, final: true });
            }
        }
        else {
            this.emit('task:failed', { taskId, nodeId, error, final: true });
        }
    }
    // Handle task timeout
    handleTaskTimeout(taskId) {
        const assignment = this.activeTasks.get(taskId);
        if (!assignment)
            return; // Already completed or failed
        this.handleTaskFailed(taskId, assignment.nodeId, 'Task timeout');
    }
    // Setup event handlers for orchestrator events
    setupEventHandlers() {
        this.orchestrator.on('message', (message) => {
            if (message.type === MessageType.TASK_COMPLETE) {
                this.handleTaskComplete(message.payload.taskId, message.sourceNode, message.payload.result);
            }
            else if (message.type === MessageType.TASK_FAILED) {
                this.handleTaskFailed(message.payload.taskId, message.sourceNode, message.payload.error);
            }
        });
        this.orchestrator.on('node:offline', ({ nodeId }) => {
            // Reassign tasks from offline node
            const affectedTasks = Array.from(this.activeTasks.entries())
                .filter(([_, a]) => a.nodeId === nodeId);
            for (const [taskId, assignment] of affectedTasks) {
                this.activeTasks.delete(taskId);
                this.submitTask(assignment.task); // Re-queue
            }
            this.emit('router:node-offline', { nodeId, requeuedTasks: affectedTasks.length });
        });
    }
    // Start processing loop
    startProcessingLoop() {
        this.processingInterval = setInterval(() => {
            this.processQueue();
        }, 1000); // Check queue every second
    }
    // Generate deterministic task ID
    generateTaskId(task) {
        const hash = this.hashString(task.type + task.name + Date.now());
        return `task-${hash.toString(16).slice(0, 12)}`;
    }
    // Hash string for deterministic behavior
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    // Get router statistics
    getStats() {
        const completed = Array.from(this.completedTasks.values());
        const failed = completed.filter(r => !r.success);
        const successful = completed.filter(r => r.success);
        const avgDuration = successful.length > 0
            ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
            : 0;
        return {
            queuedTasks: this.taskQueue.size,
            activeTasks: this.activeTasks.size,
            completedTasks: successful.length,
            failedTasks: failed.length,
            averageTaskDuration: avgDuration,
        };
    }
    // Get task status
    getTaskStatus(taskId) {
        if (this.taskQueue.has(taskId))
            return { status: 'queued' };
        if (this.activeTasks.has(taskId))
            return { status: 'active' };
        if (this.completedTasks.has(taskId)) {
            const result = this.completedTasks.get(taskId);
            return {
                status: result.success ? 'completed' : 'failed',
                result,
            };
        }
        return { status: 'unknown' };
    }
    // Dispose
    dispose() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.removeAllListeners();
        this.taskQueue.clear();
        this.activeTasks.clear();
        this.completedTasks.clear();
    }
}
//# sourceMappingURL=optimized-task-router.js.map