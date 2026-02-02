/**
 * Comprehensive Monitoring Dashboard
 * Real-time system health, metrics, and task monitoring
 */

import React, { useState, useEffect } from 'react';
import { TaskMonitor } from './TaskMonitor';
import { HeadyLens } from './HeadyLens';
import { socket } from '../socket';
import { SacredCard } from '@heady/ui';
import { Activity, BarChart2, Terminal, Eye } from 'lucide-react';

interface TabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Tab({ active, onClick, icon, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all
        ${active 
          ? 'text-white border-b-2 border-purple-500 bg-white/5' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent'}
      `}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'metrics' | 'logs' | 'lens'>('lens');

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur">
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-gray-900/80">
        <Tab active={activeTab === 'lens'} onClick={() => setActiveTab('lens')} icon={<Eye size={16} />}>
          HeadyLens
        </Tab>
        <Tab active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Activity size={16} />}>
          Tasks & Monitoring
        </Tab>
        <Tab active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} icon={<BarChart2 size={16} />}>
          Metrics
        </Tab>
        <Tab active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal size={16} />}>
          Logs
        </Tab>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 relative">
        {activeTab === 'lens' && <HeadyLens />}
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
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-pulse">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mb-4" />
        Waiting for system metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white tracking-wide">System Metrics</h3>
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Stream
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Uptime" 
          value={`${Math.floor(metrics.uptime / 60)}m ${Math.round(metrics.uptime % 60)}s`} 
          color="text-emerald-400" 
          borderColor="border-emerald-500/30" 
        />
        <MetricCard 
          label="Total Requests" 
          value={metrics.totalRequests} 
          color="text-blue-400" 
          borderColor="border-blue-500/30" 
        />
        <MetricCard 
          label="Errors" 
          value={metrics.totalErrors} 
          color="text-red-400" 
          borderColor="border-red-500/30" 
        />
        <MetricCard 
          label="Avg Response" 
          value={`${Math.round(metrics.avgResponseTime)}ms`} 
          color="text-amber-400" 
          borderColor="border-amber-500/30" 
        />
      </div>

      <SacredCard title="Service Health" variant="glass" className="mt-6">
        <div className="flex flex-col gap-3">
          {metrics.services.map((service: any) => (
            <div key={service.service} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <div className="font-semibold text-gray-200">{service.service}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Reqs: {service.requestCount} | Errs: {service.errorCount}
                </div>
              </div>
              <div className={`
                px-3 py-1 rounded-full text-xs font-bold border
                ${service.status === 'healthy' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'}
              `}>
                {service.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </SacredCard>
    </div>
  );
}

function MetricCard({ label, value, color, borderColor }: { label: string; value: string | number; color: string; borderColor: string }) {
    return (
        <div className={`p-6 bg-gray-900/40 backdrop-blur-md border rounded-xl ${borderColor}`}>
            <div className="text-sm text-gray-400 mb-2">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

function LogsView() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Simulate initial logs
    setLogs([
        `[${new Date().toISOString()}] [INFO] System initialized`,
        `[${new Date().toISOString()}] [INFO] Real-time monitoring active`,
        `[${new Date().toISOString()}] [INFO] Connected to Heady Network`
    ]);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <h3 className="text-xl font-bold text-white tracking-wide">System Logs</h3>
      <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 overflow-auto font-mono text-xs">
        {logs.map((log, i) => (
            <div key={i} className={`mb-1 ${
              log.includes('ERROR') ? 'text-red-400' : 
              log.includes('WARN') ? 'text-amber-400' : 
              'text-gray-400'
            }`}>
                {log}
            </div>
        ))}
        <div className="animate-pulse text-purple-500 mt-2">_</div>
      </div>
    </div>
  );
}
