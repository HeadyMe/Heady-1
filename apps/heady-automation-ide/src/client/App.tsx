import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Footer, Sidebar, SacredContainer, SacredCard } from '@heady/ui';
import type { SidebarItem } from '@heady/ui';
import { ArenaMode } from './components/ArenaMode';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { socket } from './socket';
import { 
  Code2, 
  Terminal as TerminalIcon, 
  Play, 
  Settings, 
  Layout, 
  Bot,
  Zap,
  Globe,
  MonitorPlay
} from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [code, setCode] = useState('// Welcome to Heady Automation IDE\nconsole.log("Hello World");');
  const [taskUrl, setTaskUrl] = useState('https://example.com');
  const [isInteractive, setIsInteractive] = useState(false);
  const [taskResult, setTaskResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('hcAutomationApiKey') || '');
  const [isArenaMode, setIsArenaMode] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [showRightPanel, setShowRightPanel] = useState(true);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const runTask = async () => {
    setLoading(true);
    setTaskResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      const res = await fetch('/api/task/screenshot', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: taskUrl, interactive: isInteractive }),
      });
      const data = await res.json();
      
      if (data.success && data.taskId) {
        // Task queued, now wait for result via socket
        const taskId = data.taskId;
        console.log(`Task queued: ${taskId}, waiting for result...`);
        
        // Setup temporary listener
        const resultListener = ({ taskId: eventTaskId, status, execution }: any) => {
          if (eventTaskId === taskId) {
            if (status === 'completed') {
              if (execution.result && execution.result.screenshot) {
                setTaskResult(execution.result.screenshot);
              }
              setLoading(false);
              socket.off('task:status', resultListener);
            } else if (status === 'failed') {
              alert('Task failed: ' + (execution.error || 'Unknown error'));
              setLoading(false);
              socket.off('task:status', resultListener);
            }
          }
        };
        
        socket.on('task:status', resultListener);
        
        // Timeout safety
        setTimeout(() => {
          if (loading) {
            console.warn('Task taking a long time...');
          }
        }, 30000);
        
      } else {
        alert('Task failed to start: ' + (data.error || 'Unknown error'));
        setLoading(false);
      }
    } catch (e) {
      alert('Error running task: ' + e);
      setLoading(false);
    }
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'editor', icon: Code2, label: 'Code Editor', isActive: activeTab === 'editor', onClick: () => setActiveTab('editor') },
    { id: 'browser', icon: Globe, label: 'Browser', isActive: activeTab === 'browser', onClick: () => setActiveTab('browser') },
    { id: 'tasks', icon: MonitorPlay, label: 'Automation', isActive: activeTab === 'tasks', onClick: () => setActiveTab('tasks') },
    { id: 'ai', icon: Bot, label: 'AI Assistant', isActive: showRightPanel, onClick: () => setShowRightPanel(!showRightPanel) },
  ];

  const bottomSidebarItems: SidebarItem[] = [
    { id: 'settings', icon: Settings, label: 'Settings', onClick: () => {} },
  ];

  return (
    <SacredContainer variant="cosmic" className="h-screen flex overflow-hidden text-white">
      {isArenaMode && (
        <ArenaMode 
          initialCode={code}
          onCodeChange={setCode}
          onExit={() => setIsArenaMode(false)}
        />
      )}
      
      {/* Activity Bar */}
      <Sidebar 
        items={sidebarItems} 
        bottomItems={bottomSidebarItems}
        className="bg-gray-900/80 backdrop-blur border-r border-white/5"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 px-4 border-b border-white/5 flex justify-between items-center bg-gray-900/50 backdrop-blur">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sm text-gray-200">Heady Automation IDE</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              BETA
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsArenaMode(true)}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 cursor-pointer rounded text-xs font-mono flex items-center gap-2 hover:bg-emerald-500/20 transition-colors"
            >
              <Zap size={14} />
              ARENA MODE
            </button>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              <span className="text-xs text-gray-400">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </header>
        
        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden relative z-10">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 relative">
               <Editor
                height="100%"
                defaultLanguage="typescript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                }}
                className="bg-transparent"
              />
            </div>
            
            {/* Bottom Panel (Terminal / Task Runner) */}
            <SacredCard 
              variant="glass" 
              className="h-[300px] border-t border-white/5 rounded-none flex flex-col bg-gray-900/80 backdrop-blur"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-200 mb-4">
                <TerminalIcon size={14} className="text-purple-400" />
                <span>TASK RUNNER</span>
              </div>
              
              <div className="overflow-auto flex-1">
                <div className="flex gap-4 mb-4 items-center">
                  <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setApiKey(value);
                      localStorage.setItem('hcAutomationApiKey', value);
                    }}
                    className="w-[200px] px-3 py-2 bg-black/30 text-white border border-white/10 rounded text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                    placeholder="API key"
                  />
                  <input 
                    type="text" 
                    value={taskUrl} 
                    onChange={(e) => setTaskUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/30 text-white border border-white/10 rounded text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                    placeholder="Enter URL to screenshot"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={isInteractive}
                      onChange={(e) => setIsInteractive(e.target.checked)}
                      className="accent-purple-500"
                    />
                    Interactive
                  </label>
                  <button 
                    onClick={runTask} 
                    disabled={loading}
                    className={`px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white border-none rounded cursor-pointer flex items-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Play size={14} />
                    {loading ? 'Running...' : 'Run'}
                  </button>
                </div>
                {taskResult && (
                  <div className="mt-4 border border-white/10 rounded overflow-hidden bg-black/40">
                    <div className="p-2 bg-white/5 border-b border-white/10 text-xs text-gray-400">
                      Result Preview
                    </div>
                    <img src={taskResult} alt="Screenshot" className="max-w-full max-h-[200px] block" />
                  </div>
                )}
              </div>
            </SacredCard>
          </div>
          
          {/* Right Panel (AI Assistant) */}
          {showRightPanel && (
            <div className="w-[350px] border-l border-white/5 bg-gray-900/50 backdrop-blur">
              <AIAssistantPanel />
            </div>
          )}
        </main>
        
        <Footer companyName="Heady Automation IDE" className="bg-gray-900/80 border-t border-white/5 py-1 px-4 text-xs text-gray-500" />
      </div>
    </SacredContainer>
  );
}

export default App;
