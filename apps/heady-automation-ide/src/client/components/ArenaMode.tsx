import React, { useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface ArenaModeProps {
  initialCode: string;
  onCodeChange: (value: string) => void;
  onExit: () => void;
  theme?: string;
}

export const ArenaMode: React.FC<ArenaModeProps> = ({ 
  initialCode, 
  onCodeChange, 
  onExit,
  theme = 'vs-dark' 
}) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [stats, setStats] = useState({ wpm: 0, lines: 0, chars: 0 });
  const [startTime] = useState(Date.now());
  const [code, setCode] = useState(initialCode);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string>('idle');
  const [mergedResult, setMergedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenge, setChallenge] = useState('Improve the code and return a high-quality merged solution.');

  const getUserId = (): string => {
    const existing = localStorage.getItem('hcArenaUserId');
    if (existing) return existing;

    const generated = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? (globalThis.crypto as Crypto).randomUUID()
      : `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    localStorage.setItem('hcArenaUserId', generated);
    return generated;
  };

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = localStorage.getItem('hcAutomationApiKey') || '';
    if (apiKey) headers['x-api-key'] = apiKey;
    return headers;
  };

  const startArena = async () => {
    setError(null);
    setMergedResult(null);
    setIsStarting(true);
    try {
      const userId = getUserId();
      const res = await fetch('/api/arena/quickstart', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId,
          aiService: 'jules',
          aiMethod: 'generate_code',
          initialCode: code,
          challenge,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to start arena');
        setMatchStatus('error');
        return;
      }

      setMatchId(data.matchId);
      setMatchStatus('active');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMatchStatus('error');
    } finally {
      setIsStarting(false);
    }
  };

  const submitSolution = async () => {
    if (!matchId) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const userId = getUserId();
      const res = await fetch(`/api/arena/matches/${matchId}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ nodeId: userId, content: code })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to submit');
        return;
      }

      const match = data?.match;
      if (match?.status) setMatchStatus(match.status);
      if (match?.finalResult) setMergedResult(match.finalResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditor(editor);
    editor.focus();
    
    // Custom Arena Theme
    monaco.editor.defineTheme('arena-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f0f13', // Deep focused background
        'editor.lineHighlightBackground': '#1a1a23',
        'editorCursor.foreground': '#00ff9d', // Cyberpunk green cursor
        'editor.selectionBackground': '#00ff9d33',
      }
    });
    monaco.editor.setTheme('arena-dark');
  };

  useEffect(() => {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const updateStats = () => {
      const content = model.getValue();
      const lineCount = model.getLineCount();
      const charCount = content.length;
      
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      const words = content.split(/\s+/).length;
      const wpm = Math.round(words / (timeElapsed || 1));

      setStats({ wpm, lines: lineCount, chars: charCount });
    };

    const disposable = model.onDidChangeContent(updateStats);
    updateStats();

    return () => disposable.dispose();
  }, [editor, startTime]);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 1000,
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#0f0f13',
      color: '#e0e0e0'
    }}>
      {/* HUD / Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 2rem',
        borderBottom: '1px solid #333344',
        background: 'rgba(15, 15, 19, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', gap: '2rem', fontFamily: 'monospace', color: '#00ff9d' }}>
          <span><strong>ARENA MODE</strong></span>
          <span>WPM: {stats.wpm}</span>
          <span>LINES: {stats.lines}</span>
          <span>STATUS: {matchStatus}</span>
          {matchId && <span>MATCH: {matchId.substring(0, 8)}</span>}
        </div>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              style={{
                width: '420px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid #333344',
                color: '#e0e0e0',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}
              placeholder="Arena challenge"
            />
            <button
              onClick={startArena}
              disabled={isStarting}
              style={{
                background: 'rgba(0, 255, 157, 0.1)',
                border: '1px solid #00ff9d',
                color: '#00ff9d',
                padding: '0.25rem 0.85rem',
                cursor: isStarting ? 'not-allowed' : 'pointer',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                opacity: isStarting ? 0.6 : 1,
              }}
            >
              {isStarting ? 'STARTING…' : 'START'}
            </button>
            <button
              onClick={submitSolution}
              disabled={!matchId || isSubmitting}
              style={{
                background: matchId ? 'rgba(0, 184, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                border: matchId ? '1px solid #00b8ff' : '1px solid #333344',
                color: matchId ? '#00b8ff' : '#777799',
                padding: '0.25rem 0.85rem',
                cursor: !matchId || isSubmitting ? 'not-allowed' : 'pointer',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                opacity: !matchId || isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'SUBMITTING…' : 'SUBMIT'}
            </button>
            <button
              onClick={onExit}
              style={{
                background: 'transparent',
                border: '1px solid #ff4444',
                color: '#ff4444',
                padding: '0.25rem 1rem',
                cursor: 'pointer',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              EXIT
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={initialCode}
          onChange={(value) => {
            const next = value || '';
            setCode(next);
            onCodeChange(next);
          }}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false }, // Minimal distractions
            fontSize: 16,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'relative',
            renderLineHighlight: 'all',
            cursorBlinking: 'phase',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 32, bottom: 32 },
            scrollBeyondLastLine: false,
            // Hide non-essential UI
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            matchBrackets: 'always',
          }}
        />
      </div>

      {(error || mergedResult) && (
        <div style={{
          borderTop: '1px solid #333344',
          background: 'rgba(15, 15, 19, 0.98)',
          padding: '0.75rem 2rem',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#e0e0e0',
          maxHeight: '30vh',
          overflow: 'auto'
        }}>
          {error && (
            <div style={{ color: '#ff4444', marginBottom: mergedResult ? '0.75rem' : 0 }}>
              {error}
            </div>
          )}
          {mergedResult && (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{mergedResult}</pre>
          )}
        </div>
      )}
      
      {/* Ambient Glow Effects (Subtle) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #00ff9d, #00b8ff, #ff00ff)',
        opacity: 0.5,
        filter: 'blur(4px)'
      }} />
    </div>
  );
};
