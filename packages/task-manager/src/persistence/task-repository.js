import { Pool } from 'pg';
import { TaskStatus } from '../types/task.types.js';
import { logger } from '../utils/logger.js';
export class TaskRepository {
    pool;
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    async initialize() {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        payload JSONB,
        status VARCHAR(50) NOT NULL,
        priority INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        progress INTEGER DEFAULT 0,
        result JSONB,
        error TEXT,
        created_at TIMESTAMP NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        scheduled_for TIMESTAMP,
        metadata JSONB,
        parent_task_id UUID,
        child_task_ids UUID[],
        CONSTRAINT fk_parent_task FOREIGN KEY (parent_task_id) 
          REFERENCES tasks(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON tasks(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
    `;
        try {
            await this.pool.query(createTableQuery);
            logger.info('Task repository initialized');
        }
        catch (error) {
            logger.error('Failed to initialize task repository', error);
            throw error;
        }
    }
    async save(task) {
        const query = `
      INSERT INTO tasks (
        id, type, name, description, payload, status, priority,
        attempts, max_retries, progress, result, error,
        created_at, started_at, completed_at, scheduled_for,
        metadata, parent_task_id, child_task_ids
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        attempts = EXCLUDED.attempts,
        progress = EXCLUDED.progress,
        result = EXCLUDED.result,
        error = EXCLUDED.error,
        started_at = EXCLUDED.started_at,
        completed_at = EXCLUDED.completed_at,
        metadata = EXCLUDED.metadata
      RETURNING *
    `;
        const values = [
            task.id,
            task.type,
            task.name,
            task.description,
            JSON.stringify(task.payload),
            task.status,
            task.priority,
            task.attempts,
            task.maxRetries,
            task.progress,
            task.result ? JSON.stringify(task.result) : null,
            task.error,
            task.createdAt,
            task.startedAt,
            task.completedAt,
            task.scheduledFor,
            task.metadata ? JSON.stringify(task.metadata) : null,
            task.parentTaskId,
            task.childTaskIds,
        ];
        const result = await this.pool.query(query, values);
        return this.mapRowToTask(result.rows[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM tasks WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToTask(result.rows[0]);
    }
    async findByStatus(status) {
        const query = 'SELECT * FROM tasks WHERE status = $1 ORDER BY priority, created_at';
        const result = await this.pool.query(query, [status]);
        return result.rows.map(row => this.mapRowToTask(row));
    }
    async findByType(type) {
        const query = 'SELECT * FROM tasks WHERE type = $1 ORDER BY created_at DESC';
        const result = await this.pool.query(query, [type]);
        return result.rows.map(row => this.mapRowToTask(row));
    }
    async findByParentId(parentId) {
        const query = 'SELECT * FROM tasks WHERE parent_task_id = $1 ORDER BY created_at';
        const result = await this.pool.query(query, [parentId]);
        return result.rows.map(row => this.mapRowToTask(row));
    }
    async updateStatus(id, status) {
        const query = 'UPDATE tasks SET status = $1 WHERE id = $2';
        await this.pool.query(query, [status, id]);
    }
    async updateProgress(id, progress) {
        const query = 'UPDATE tasks SET progress = $1 WHERE id = $2';
        await this.pool.query(query, [progress, id]);
    }
    async markStarted(id) {
        const query = `
      UPDATE tasks 
      SET status = $1, started_at = $2 
      WHERE id = $3
    `;
        await this.pool.query(query, [TaskStatus.RUNNING, new Date(), id]);
    }
    async markCompleted(id, result) {
        const query = `
      UPDATE tasks 
      SET status = $1, completed_at = $2, result = $3, progress = 100
      WHERE id = $4
    `;
        await this.pool.query(query, [
            TaskStatus.COMPLETED,
            new Date(),
            result ? JSON.stringify(result) : null,
            id
        ]);
    }
    async markFailed(id, error) {
        const query = `
      UPDATE tasks 
      SET status = $1, error = $2, completed_at = $3
      WHERE id = $4
    `;
        await this.pool.query(query, [TaskStatus.FAILED, error, new Date(), id]);
    }
    async getStats() {
        const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `;
        const typeQuery = `
      SELECT type, COUNT(*) as count 
      FROM tasks 
      GROUP BY type
    `;
        const totalQuery = 'SELECT COUNT(*) as count FROM tasks';
        const [statusResult, typeResult, totalResult] = await Promise.all([
            this.pool.query(statusQuery),
            this.pool.query(typeQuery),
            this.pool.query(totalQuery),
        ]);
        const byStatus = {};
        statusResult.rows.forEach(row => {
            byStatus[row.status] = parseInt(row.count);
        });
        const byType = {};
        typeResult.rows.forEach(row => {
            byType[row.type] = parseInt(row.count);
        });
        return {
            total: parseInt(totalResult.rows[0].count),
            byStatus: byStatus,
            byType,
        };
    }
    async getRecentTasks(limit = 10) {
        const query = `
      SELECT * FROM tasks 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
        const result = await this.pool.query(query, [limit]);
        return result.rows.map(row => this.mapRowToTask(row));
    }
    async cleanup(olderThan) {
        const query = `
      DELETE FROM tasks 
      WHERE completed_at < $1 
      AND status IN ($2, $3, $4)
    `;
        const result = await this.pool.query(query, [
            olderThan,
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
        ]);
        return result.rowCount || 0;
    }
    mapRowToTask(row) {
        return {
            id: row.id,
            type: row.type,
            name: row.name,
            description: row.description,
            payload: row.payload,
            status: row.status,
            priority: row.priority,
            attempts: row.attempts,
            maxRetries: row.max_retries,
            progress: row.progress,
            result: row.result,
            error: row.error,
            createdAt: row.created_at,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            scheduledFor: row.scheduled_for,
            metadata: row.metadata,
            parentTaskId: row.parent_task_id,
            childTaskIds: row.child_task_ids,
        };
    }
    async close() {
        await this.pool.end();
        logger.info('Task repository closed');
    }
}
//# sourceMappingURL=task-repository.js.map