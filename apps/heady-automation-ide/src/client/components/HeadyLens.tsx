
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket';
import { SacredCard, SacredContainer } from '@heady/ui';
import { Activity, GitBranch, Cpu, Database, Layers } from 'lucide-react';

interface SystemSnapshot {
  timestamp: number;
  components: SystemComponent[];
  variables: Record<string, any>;
  constants: Record<string, any>;
  relations: { source: string; target: string; type: string }[];
}

interface SystemComponent {
  id: string;
  type: 'service' | 'database' | 'queue' | 'interface' | 'variable';
  name: string;
  status: 'active' | 'inactive' | 'error' | 'unknown';
  dependencies: string[];
  metadata: Record<string, any>;
}

export function HeadyLens() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'data'>('visual');

  useEffect(() => {
    socket.emit('subscribe:lens');
    
    const handleSnapshot = (data: SystemSnapshot) => {
      setSnapshot(data);
    };

    socket.on('lens:snapshot', handleSnapshot);
    return () => {
      socket.off('lens:snapshot', handleSnapshot);
    };
  }, []);

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-full text-purple-400 animate-pulse">
        <Activity className="mr-2" /> Initializing HeadyLens...
      </div>
    );
  }

  return (
    <SacredContainer variant="cosmic" className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">HeadyLens</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1 rounded text-sm ${activeTab === 'visual' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500'}`}
          >
            Visual Cortex
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1 rounded text-sm ${activeTab === 'data' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500'}`}
          >
            Data Stream
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'visual' ? (
          <VisualCortex snapshot={snapshot} />
        ) : (
          <DataStream snapshot={snapshot} />
        )}
      </div>
    </SacredContainer>
  );
}

function VisualCortex({ snapshot }: { snapshot: SystemSnapshot }) {
  // Simple force-directed layout visualization
  // In a real implementation, we'd use D3 or React Flow
  // For now, we'll visualize components as orbiting nodes
  
  const components = snapshot.components;
  const center = { x: 50, y: 50 }; // percentages

  return (
    <div className="w-full h-full relative bg-black/40">
      {/* Central Hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-900/30 border border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)] z-10">
        <div className="text-xs text-center text-purple-300 font-mono">
          <div>HEADY</div>
          <div>CORE</div>
        </div>
      </div>

      {/* Orbiting Nodes */}
      {components.map((comp, i) => {
        const angle = (i / components.length) * 2 * Math.PI;
        const radius = 35; // percentage
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        
        return (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <SacredCard 
              variant="glass" 
              className="w-40 p-2 -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer border-l-2 border-l-emerald-500"
            >
              <div className="flex items-center gap-2 mb-1">
                <StatusDot status={comp.status} />
                <span className="text-xs font-bold text-white truncate">{comp.name}</span>
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{comp.type}</div>
            </SacredCard>
            
            {/* Connection Line (SVG) */}
            <svg className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none overflow-visible" style={{ left: `-${x}%`, top: `-${y}%`, width: '100vw', height: '100vh' }}>
               <line 
                 x1={`${x}%`} y1={`${y}%`} 
                 x2="50%" y2="50%" 
                 stroke="rgba(168, 85, 247, 0.2)" 
                 strokeWidth="1" 
               />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors = {
    active: 'bg-emerald-500',
    inactive: 'bg-gray-500',
    error: 'bg-red-500',
    unknown: 'bg-amber-500'
  };
  
  return (
    <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || colors.unknown} shadow-[0_0_5px_currentColor]`} />
  );
}

function DataStream({ snapshot }: { snapshot: SystemSnapshot }) {
  return (
    <div className="p-6 h-full overflow-auto font-mono text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SacredCard title="Component State" variant="solid">
          <pre className="text-emerald-400 overflow-x-auto">
            {JSON.stringify(snapshot.components, null, 2)}
          </pre>
        </SacredCard>
        
        <SacredCard title="Environment & Config" variant="solid">
          <pre className="text-blue-400 overflow-x-auto">
            {JSON.stringify({ variables: snapshot.variables, constants: snapshot.constants }, null, 2)}
          </pre>
        </SacredCard>
      </div>
    </div>
  );
}
