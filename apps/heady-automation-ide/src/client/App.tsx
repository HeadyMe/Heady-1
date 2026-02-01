import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { Footer, Sidebar } from '@heady/ui';
import type { SidebarItem } from '@heady/ui';
import { ArenaMode } from './components/ArenaMode';
import { AIAssistantPanel } from './components/AIAssistantPanel';
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

const socket = io('/', {
  path: '/socket.io',
});

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
              // Result is in execution.result.screenshot
              // Note: Backend might nest it. Let's check structure.
              // BrowserExecutor returns { screenshot: ... }
              // TaskManager stores this in `result`.
              // So execution.result.screenshot should be it.
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
        
        // Also listen for task:completed directly if emitted separately?
        // RealtimeEventsHandler emits task:status for completion.
        
        // Timeout safety
        setTimeout(() => {
          if (loading) {
            // setLoading(false); // Don't force stop, it might just be slow.
            // socket.off('task:status', resultListener);
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#09090b', color: '#fff', overflow: 'hidden' }}>
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
        style={{ borderRight: '1px solid #27272a', backgroundColor: '#18181b' }}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ 
          height: '48px', 
          padding: '0 1rem', 
          borderBottom: '1px solid #27272a', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#18181b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e4e4e7' }}>Heady Automation IDE</span>
            <span style={{ 
              fontSize: '0.7rem', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              backgroundColor: '#27272a', 
              color: '#a1a1aa' 
            }}>
              BETA
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setIsArenaMode(true)}
              style={{
                background: 'rgba(0, 255, 157, 0.1)',
                border: '1px solid #00ff9d',
                color: '#00ff9d',
                padding: '4px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} />
              ARENA MODE
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isConnected ? '#4caf50' : '#f44336',
              }} />
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </header>
        
        {/* Workspace */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Editor Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ flex: 1, position: 'relative' }}>
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
              />
            </div>
            
            {/* Bottom Panel (Terminal / Task Runner) */}
            <div style={{ 
              height: '300px', 
              borderTop: '1px solid #27272a', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#09090b'
            }}>
              <div style={{ 
                padding: '0.5rem 1rem', 
                borderBottom: '1px solid #27272a',
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                backgroundColor: '#18181b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7' }}>
                  <TerminalIcon size={14} />
                  <span>TASK RUNNER</span>
                </div>
              </div>
              
              <div style={{ padding: '1rem', overflow: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setApiKey(value);
                      localStorage.setItem('hcAutomationApiKey', value);
                    }}
                    style={{ 
                      width: '200px', 
                      padding: '0.5rem', 
                      backgroundColor: '#27272a', 
                      color: '#fff', 
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}
                    placeholder="API key"
                  />
                  <input 
                    type="text" 
                    value={taskUrl} 
                    onChange={(e) => setTaskUrl(e.target.value)}
                    style={{ 
                      flex: 1, 
                      padding: '0.5rem', 
                      backgroundColor: '#27272a', 
                      color: '#fff', 
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}
                    placeholder="Enter URL to screenshot"
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: '#e4e4e7' }}>
                    <input 
                      type="checkbox" 
                      checked={isInteractive}
                      onChange={(e) => setIsInteractive(e.target.checked)}
                      style={{ accentColor: '#00ff9d' }}
                    />
                    Interactive
                  </label>
                  <button 
                    onClick={runTask} 
                    disabled={loading}
                    style={{ 
                      padding: '0.5rem 1.5rem', 
                      backgroundColor: '#007acc', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    <Play size={14} />
                    {loading ? 'Running...' : 'Run'}
                  </button>
                </div>
                {taskResult && (
                  <div style={{ marginTop: '1rem', border: '1px solid #3f3f46', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: '#27272a', borderBottom: '1px solid #3f3f46', fontSize: '0.8rem', color: '#a1a1aa' }}>
                      Result Preview
                    </div>
                    <img src={taskResult} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Panel (AI Assistant) */}
          {showRightPanel && (
            <div style={{ width: '350px', borderLeft: '1px solid #27272a' }}>
              <AIAssistantPanel />
            </div>
          )}
        </main>
        
        <Footer companyName="Heady Automation IDE" style={{ backgroundColor: '#18181b', borderTop: '1px solid #27272a', padding: '4px 1rem', fontSize: '0.8rem', color: '#71717a' }} />
      </div>
    </div>
  );
}

export default App;
