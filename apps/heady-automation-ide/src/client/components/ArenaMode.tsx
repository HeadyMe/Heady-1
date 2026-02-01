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
        </div>
        
        <div>
           <button
            onClick={onExit}
            style={{
              background: 'transparent',
              border: '1px solid #ff4444',
              color: '#ff4444',
              padding: '0.25rem 1rem',
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            EXIT ARENA
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={initialCode}
          onChange={(value) => onCodeChange(value || '')}
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
