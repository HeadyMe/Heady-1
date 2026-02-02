/**
 * Comprehensive Monitoring Dashboard
 * Real-time system health, metrics, and task monitoring
 */

import React, { useState, useEffect } from 'react';
import { TaskMonitor } from './TaskMonitor';
import { socket } from '../socket';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: active ? '#007acc' : '#2a2a2a',
        color: '#fff',
        border: 'none',
        borderBottom: active ? '2px solid #007acc' : '2px solid transparent',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      {children}
    </button>
  );
}

export function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'metrics' | 'logs'>('tasks');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e1e1e' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
        <Tab active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
          📋 Tasks & Monitoring
        </Tab>
        <Tab active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')}>
          📊 Metrics
        </Tab>
        <Tab active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
          📝 Logs
        </Tab>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'tasks' && <TaskMonitor />}
        {activeTab === 'metrics' && <MetricsView />}
        {activeTab === 'logs' && <LogsView />}
      </div>
    </div>
  );
}

function MetricsView() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    socket.emit('subscribe:monitoring');

    const handleMetrics = (data: any) => {
      setMetrics(data);
    };

    const handleInitialMetrics = (data: any) => {
        setMetrics(data);
    };

    socket.on('system:metrics', handleMetrics);
    socket.on('initial:metrics', handleInitialMetrics);

    return () => {
      socket.off('system:metrics', handleMetrics);
      socket.off('initial:metrics', handleInitialMetrics);
    };
  }, []);

  if (!metrics) {
    return <div style={{ padding: '1rem', color: '#aaa' }}>Waiting for metrics...</div>;
  }

  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h3>System Metrics</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <MetricCard label="Uptime" value={`${Math.floor(metrics.uptime / 60)}m ${Math.round(metrics.uptime % 60)}s`} color="#4caf50" />
        <MetricCard label="Total Requests" value={metrics.totalRequests} color="#2196f3" />
        <MetricCard label="Errors" value={metrics.totalErrors} color="#f44336" />
        <MetricCard label="Avg Response" value={`${Math.round(metrics.avgResponseTime)}ms`} color="#ff9800" />
      </div>

      <h4 style={{ marginTop: '2rem' }}>Service Health</h4>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {metrics.services.map((service: any) => (
          <div key={service.service} style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{service.service}</div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Requests: {service.requestCount} | Errors: {service.errorCount}</div>
            </div>
            <div style={{ 
              padding: '0.25rem 0.75rem', 
              borderRadius: '999px', 
              backgroundColor: service.status === 'healthy' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              color: service.status === 'healthy' ? '#4caf50' : '#f44336',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {service.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px', borderLeft: `4px solid ${color}` }}>
            <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{value}</div>
        </div>
    );
}

function LogsView() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // In a real implementation, we would subscribe to a logs channel
    // For now, we'll simulate some logs or use what we have
    const handleLog = (data: any) => {
       // Placeholder for log handling if we emit specific log events
    };
    
    // Simulate initial logs
    setLogs([
        `[${new Date().toISOString()}] [INFO] System initialized`,
        `[${new Date().toISOString()}] [INFO] Real-time monitoring active`,
        `[${new Date().toISOString()}] [INFO] Connected to Heady Network`
    ]);

    return () => {
       // cleanup
    };
  }, []);

  return (
    <div style={{ padding: '1rem', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3>System Logs</h3>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          backgroundColor: '#0a0a0a',
          padding: '1rem',
          borderRadius: '4px',
          flex: 1,
          overflow: 'auto',
          marginTop: '1rem'
        }}
      >
        {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '0.25rem', color: log.includes('ERROR') ? '#f44336' : log.includes('WARN') ? '#ff9800' : '#aaa' }}>
                {log}
            </div>
        ))}
      </div>
    </div>
  );
}
