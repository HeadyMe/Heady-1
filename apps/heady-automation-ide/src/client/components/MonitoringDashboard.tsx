/**
 * Comprehensive Monitoring Dashboard
 * Real-time system health, metrics, and task monitoring
 */

import React, { useState } from 'react';
import { TaskMonitor } from './TaskMonitor';

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
  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h3>System Metrics</h3>
      <p style={{ color: '#aaa' }}>Real-time system performance metrics will appear here.</p>
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
        <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>
          Metrics are collected every 5 seconds and displayed in real-time via WebSocket.
        </div>
        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
          Available metrics: CPU usage, memory usage, process stats, service health
        </div>
      </div>
    </div>
  );
}

function LogsView() {
  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h3>System Logs</h3>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          backgroundColor: '#0a0a0a',
          padding: '1rem',
          borderRadius: '4px',
          maxHeight: '500px',
          overflow: 'auto',
        }}
      >
        <div style={{ color: '#4caf50' }}>[INFO] System initialized</div>
        <div style={{ color: '#2196f3' }}>[INFO] MCP services loaded</div>
        <div style={{ color: '#4caf50' }}>[INFO] Real-time monitoring started</div>
        <div style={{ color: '#aaa' }}>Logs will stream here in real-time...</div>
      </div>
    </div>
  );
}
