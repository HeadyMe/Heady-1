/**
 * Real-time Task Monitor Dashboard Component
 * Displays active tasks, system metrics, and alerts
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Task {
  id: string;
  type: string;
  name: string;
  description?: string;
  status: string;
  priority: number;
  progress: number;
  startedAt?: string | number;
  completedAt?: string | number;
  executionTime?: number;
  result?: any;
  error?: string;
}

interface SystemMetrics {
  timestamp: number;
  cpu: { usage: number };
  memory: { usagePercent: number };
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  service?: string;
  resolved: boolean;
}

export function TaskMonitor() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('/', { path: '/socket.io' });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('subscribe:tasks');
      newSocket.emit('subscribe:monitoring');
      newSocket.emit('subscribe:alerts');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Initial state
    newSocket.on('initial:tasks', (initialTasks: Task[]) => {
      setTasks(initialTasks);
    });

    newSocket.on('initial:stats', (initialStats: any) => {
      setStats(initialStats);
    });

    newSocket.on('initial:metrics', (initialMetrics: SystemMetrics) => {
      setMetrics(initialMetrics);
    });

    newSocket.on('initial:alerts', (initialAlerts: Alert[]) => {
      setAlerts(initialAlerts);
    });

    // Real-time updates
    newSocket.on('task:created', (task: Task) => {
      setTasks((prev) => [...prev, task]);
    });

    newSocket.on('task:status', ({ taskId, execution }: any) => {
      setTasks((prev) => prev.map((t) => {
        if (t.id !== taskId) return t;
        // Merge the update
        const updated = { ...t, ...execution };
        // Calculate execution time if completed and we have timestamps but no explicit execution time
        if (updated.status === 'completed' && !updated.executionTime && updated.startedAt && updated.completedAt) {
            const start = new Date(updated.startedAt).getTime();
            const end = new Date(updated.completedAt).getTime();
            updated.executionTime = end - start;
        } else if (updated.status === 'completed' && !updated.executionTime && updated.startedAt) {
            // Fallback if completedAt comes in execution object
            const completedAt = execution.completedAt ? new Date(execution.completedAt).getTime() : Date.now();
            const start = new Date(updated.startedAt).getTime();
            updated.executionTime = completedAt - start;
        }
        return updated;
      }));
    });

    newSocket.on('task:progress', ({ taskId, progress, execution }: any) => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...execution, progress } : t)));
    });

    newSocket.on('task:deleted', ({ taskId }: any) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });

    newSocket.on('system:metrics', (newMetrics: SystemMetrics) => {
      setMetrics(newMetrics);
    });

    newSocket.on('alert:created', (alert: Alert) => {
      setAlerts((prev) => [...prev, alert]);
    });

    newSocket.on('alert:resolved', (alert: Alert) => {
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const cancelTask = (taskId: string) => {
    socket?.emit('task:cancel', taskId);
  };

  const resolveAlert = (alertId: string) => {
    socket?.emit('alert:resolve', alertId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      case 'running':
        return '#2196f3';
      case 'pending':
      case 'queued':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  };

  const activeTasks = tasks.filter((t) => ['pending', 'queued', 'running'].includes(t.status));
  const activeAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div style={{ padding: '1rem', backgroundColor: '#1e1e1e', color: '#fff', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Heady Task Monitor</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: connected ? '#4caf50' : '#f44336',
            }}
          ></span>
          <span style={{ fontSize: '0.9rem' }}>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>System Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>CPU Usage</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.cpu.usage.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Memory Usage</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {metrics.memory.usagePercent.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Active Tasks</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeTasks.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Active Alerts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: activeAlerts.length > 0 ? '#ff9800' : '#4caf50' }}>
                {activeAlerts.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Active Alerts</h3>
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: '#2a2a2a',
                borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {alert.severity.toUpperCase()}: {alert.message}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                  {alert.service && ` • ${alert.service}`}
                </div>
              </div>
              <button
                onClick={() => resolveAlert(alert.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007acc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Tasks */}
      <div>
        <h3>Active Tasks ({activeTasks.length})</h3>
        {activeTasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>No active tasks</div>
        ) : (
          activeTasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                backgroundColor: '#2a2a2a',
                borderLeft: `4px solid ${getStatusColor(task.status)}`,
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{task.description || task.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    Type: {task.type} • Priority: {task.priority}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: getStatusColor(task.status),
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    {task.status.toUpperCase()}
                  </span>
                  {task.status === 'running' && (
                    <button
                      onClick={() => cancelTask(task.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#f44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#444', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${task.progress}%`,
                      height: '100%',
                      backgroundColor: getStatusColor(task.status),
                      transition: 'width 0.3s ease',
                    }}
                  ></div>
                </div>
              </div>

              {/* Execution time */}
              {task.executionTime && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>
                  Execution time: {(task.executionTime / 1000).toFixed(2)}s
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Task Statistics */}
      {stats && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#aaa' }}>Total Tasks</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total}</div>
            </div>
            <div>
              <div style={{ color: '#aaa' }}>Success Rate</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {(stats.successRate * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ color: '#aaa' }}>Avg Execution</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {(stats.avgExecutionTime / 1000).toFixed(2)}s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
