import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code, FileCode, Wrench, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCall?: {
    tool: string;
    status: 'running' | 'completed' | 'failed';
    args?: string;
  };
}

interface ContextItem {
  type: 'file' | 'selection' | 'terminal';
  label: string;
  icon: React.ReactNode;
}

export const AIAssistantPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your Heady AI assistant. I can help you write code, run automation tasks, or debug issues. I have context of your current file.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeContexts, setActiveContexts] = useState<ContextItem[]>([
    { type: 'file', label: 'App.tsx', icon: <FileCode size={12} /> },
    { type: 'terminal', label: 'Terminal', icon: <Terminal size={12} /> }
  ]);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch available MCP services
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/mcp/services');
        const data = await res.json();
        if (data.running) {
          setAvailableServices(data.running);
        }
      } catch (error) {
        console.error('Failed to fetch MCP services', error);
      }
    };
    fetchServices();
  }, []);

  const executeMcpTool = async (service: string, tool: string, args: any) => {
    try {
      const res = await fetch(`/api/mcp/${service}/tools/${tool}/call`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('hcAutomationApiKey') || ''
        },
        body: JSON.stringify(args)
      });
      return await res.json();
    } catch (error) {
      console.error('Tool execution failed', error);
      return { error: 'Failed to execute tool' };
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Simple command parser for MCP interaction
    if (currentInput.startsWith('/')) {
      const [command, ...args] = currentInput.slice(1).split(' ');
      
      let service = 'context-mcp'; // Default to context service
      let tool = '';
      let toolArgs = {};

      if (command === 'diagnostics') {
        tool = 'system_diagnostics';
        toolArgs = { detailLevel: 'basic' };
      } else if (command === 'context') {
        tool = 'get_context';
      } else if (command === 'services') {
        // Local command
        setIsTyping(false);
        const responseMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Available MCP Services: ${availableServices.join(', ')}`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, responseMsg]);
        return;
      }

      if (tool) {
        // 1. Show tool call
        const toolMsgId = (Date.now() + 1).toString();
        const toolMsg: Message = {
          id: toolMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          toolCall: {
            tool: tool,
            status: 'running',
            args: JSON.stringify(toolArgs)
          }
        };
        setMessages(prev => [...prev, toolMsg]);

        // 2. Execute
        try {
          const result = await executeMcpTool(service, tool, toolArgs);
          
          setMessages(prev => prev.map(msg => 
            msg.id === toolMsgId 
              ? { ...msg, toolCall: { ...msg.toolCall!, status: 'completed' } } 
              : msg
          ));

          const resultMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: '```json\n' + JSON.stringify(result, null, 2) + '\n```',
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, resultMsg]);
        } catch (error) {
           setMessages(prev => prev.map(msg => 
            msg.id === toolMsgId 
              ? { ...msg, toolCall: { ...msg.toolCall!, status: 'failed' } } 
              : msg
          ));
        }
        setIsTyping(false);
        return;
      }
    }

    // Default mock response for non-commands
    setTimeout(() => {
        const finalMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `I received: "${currentInput}". \n\nTry commands like:\n- /diagnostics\n- /context\n- /services`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, finalMsg]);
        setIsTyping(false);
    }, 800);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#18181b', // Zinc-900
      borderLeft: '1px solid #27272a', // Zinc-800
      color: '#e4e4e7', // Zinc-200
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#18181b'
      }}>
        <Sparkles size={18} color="#00ff9d" />
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Heady AI</span>
        <div style={{ 
          marginLeft: 'auto', 
          fontSize: '0.7rem', 
          backgroundColor: '#27272a', 
          padding: '2px 6px', 
          borderRadius: '4px',
          color: '#a1a1aa'
        }}>
          BETA
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Tool Call Visualization */}
            {msg.toolCall && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '0.5rem',
                fontSize: '0.8rem',
                color: '#a1a1aa',
                marginLeft: '36px',
                maxWidth: '85%'
              }}>
                <Wrench size={12} />
                <span>Used <strong>{msg.toolCall.tool}</strong></span>
                {msg.toolCall.status === 'running' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span style={{ color: '#4caf50' }}>✓</span>
                )}
              </div>
            )}

            {(msg.content || !msg.toolCall) && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: msg.role === 'assistant' ? '#00ff9d22' : '#3f3f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  {msg.role === 'assistant' ? 
                    <Bot size={14} color="#00ff9d" /> : 
                    <User size={14} color="#e4e4e7" />
                  }
                </div>
                
                <div style={{
                  maxWidth: '85%',
                  backgroundColor: msg.role === 'user' ? '#27272a' : 'transparent',
                  padding: msg.role === 'user' ? '0.75rem' : '0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: msg.role === 'user' ? '#fff' : '#d4d4d8'
                }}>
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.5rem' }}>
            <div style={{ width: '24px' }} /> {/* Spacer */}
            <div style={{ color: '#71717a', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #27272a',
        backgroundColor: '#18181b'
      }}>
        {/* Context Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {activeContexts.map((ctx, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              backgroundColor: '#27272a',
              color: '#a1a1aa',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #3f3f46',
              whiteSpace: 'nowrap'
            }}>
              {ctx.icon}
              {ctx.label}
            </div>
          ))}
          <div style={{
              fontSize: '0.7rem',
              color: '#00ff9d',
              padding: '2px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
            + Add Context
          </div>
        </div>

        <div style={{
          position: 'relative',
          backgroundColor: '#27272a',
          borderRadius: '8px',
          border: '1px solid #3f3f46'
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything (Ctrl+L)"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0.75rem',
              paddingRight: '2.5rem',
              color: '#fff',
              fontSize: '0.9rem',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '150px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              background: input.trim() ? '#00ff9d' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
          >
            <Send size={14} color={input.trim() ? '#000' : '#52525b'} />
          </button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          fontSize: '0.7rem',
          color: '#71717a'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Terminal size={10} /> Context: Active
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Code size={10} /> Model: Claude 3.5 Sonnet
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
