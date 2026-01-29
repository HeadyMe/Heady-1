import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [code, setCode] = useState("// Select a file to edit");
  const [logs, setLogs] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure Axios with token
  const api = axios.create({
    headers: {
      'X-Admin-Token': token
    }
  });

  useEffect(() => {
    if (token) {
      verifyAuth();
    }
  }, [token]);

  const verifyAuth = async () => {
    try {
      await api.get('/api/files'); // Simple check
      setIsAuthenticated(true);
      fetchFiles();
      connectLogs();
    } catch (err) {
      console.error("Auth failed", err);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const inputToken = e.target.token.value;
    setToken(inputToken);
    localStorage.setItem('adminToken', inputToken);
  };

  const fetchFiles = async () => {
    try {
      const res = await api.get('/api/files');
      setFiles(res.data.files);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFile = async (path) => {
    try {
      const res = await api.get(`/api/files/${path}`);
      setCode(res.data.content);
      setCurrentFile(path);
    } catch (err) {
      console.error(err);
    }
  };

  const saveFile = async () => {
    if (!currentFile) return;
    try {
      await api.post('/api/files', { path: currentFile, content: code });
      alert('Saved!');
    } catch (err) {
      alert('Error saving file');
    }
  };

  const connectLogs = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/logs?token=${token}`);
    ws.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };
  };

  const triggerAction = async (action) => {
    try {
      await api.post('/api/action', { action });
    } catch (err) {
      console.error(err);
    }
  };

  const askAI = async () => {
    try {
      setAiSuggestion("Thinking...");
      const res = await api.post('/api/ai_assist', { context: code, prompt: aiPrompt });
      setAiSuggestion(res.data.suggestion);
    } catch (err) {
      console.error(err);
      setAiSuggestion("Error getting response.");
    }
  };

  const summarizeLogs = async () => {
    if (logs.length === 0) return;
    try {
      const logText = logs.join('\n');
      const res = await api.post('/api/summarize', { text: logText });
      alert(`Log Summary:\n\n${res.data.summary}`);
    } catch (err) {
      console.error(err);
      alert("Error summarizing logs.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Heady Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input name="token" type="password" placeholder="Admin Token" defaultValue={token} />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <h3>Explorer</h3>
        <ul>
          {files.map(f => (
            <li key={f} onClick={() => loadFile(f)} style={{ cursor: 'pointer' }}>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
          <button onClick={saveFile}>Save</button>
          <button onClick={() => triggerAction('full_audit')}>Audit</button>
          <button onClick={() => triggerAction('builder_build')}>Build</button>
          <button onClick={() => { setToken(''); setIsAuthenticated(false); localStorage.removeItem('adminToken'); }}>Logout</button>
        </div>
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={(val) => setCode(val)}
            theme="vs-dark"
          />
        </div>
        <div style={{ height: '150px', borderTop: '1px solid #ccc', padding: '10px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Logs</h4>
            <button onClick={summarizeLogs} style={{ fontSize: '0.8em' }}>Summarize Logs</button>
          </div>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
      <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '10px', display: 'flex', flexDirection: 'column' }}>
        <h3>AI Assistant</h3>
        <textarea
          placeholder="Ask AI..."
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          style={{ height: '100px' }}
        />
        <button onClick={askAI} style={{ marginTop: '5px' }}>Ask</button>
        <div style={{ marginTop: '10px', flex: 1, overflow: 'auto', backgroundColor: '#f0f0f0', padding: '5px' }}>
          <pre>{aiSuggestion}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
