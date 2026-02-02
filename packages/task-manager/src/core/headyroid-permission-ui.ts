/**
 * HeadyRoid Permission UI - User consent interface for node activation
 */

import { EventEmitter } from 'events';
import type { HeadyRoidPermission } from './headyroid-node.js';

export interface PermissionPromptData {
  nodeType: string;
  reason: string;
  scope: 'single-use' | 'session' | 'persistent';
  capabilities: string[];
  risks: string[];
  estimatedImpact: {
    cpu: string;
    memory: string;
    duration: string;
  };
}

export interface PermissionResponse {
  granted: boolean;
  constraints?: {
    maxActivations?: number;
    maxDurationMs?: number;
    allowedTriggers?: string[];
  };
  userNote?: string;
}

export class HeadyRoidPermissionUI extends EventEmitter {
  private pendingPrompts: Map<string, (response: PermissionResponse) => void> = new Map();

  /**
   * Show permission prompt to user
   */
  async showPermissionPrompt(promptData: PermissionPromptData): Promise<PermissionResponse> {
    const promptId = `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingPrompts.delete(promptId);
        reject(new Error('Permission prompt timed out'));
      }, 60000);

      this.pendingPrompts.set(promptId, (response: PermissionResponse) => {
        clearTimeout(timeout);
        this.pendingPrompts.delete(promptId);
        resolve(response);
      });

      this.emit('prompt:show', {
        promptId,
        ...promptData,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Handle user response to permission prompt
   */
  handleUserResponse(promptId: string, response: PermissionResponse): void {
    const resolver = this.pendingPrompts.get(promptId);
    if (resolver) {
      resolver(response);
      this.emit('prompt:responded', { promptId, granted: response.granted });
    }
  }

  /**
   * Generate CLI prompt text
   */
  static generateCLIPrompt(promptData: PermissionPromptData): string {
    const lines: string[] = [];
    
    lines.push('╔════════════════════════════════════════════════════════════════╗');
    lines.push('║           HEADYROID NODE ACTIVATION REQUEST                   ║');
    lines.push('╚════════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Reason: ${promptData.reason}`);
    lines.push(`Scope: ${promptData.scope.toUpperCase()}`);
    lines.push('');
    lines.push('CAPABILITIES:');
    promptData.capabilities.forEach(cap => lines.push(`  • ${cap}`));
    lines.push('');
    lines.push('ESTIMATED IMPACT:');
    lines.push(`  CPU Usage: ${promptData.estimatedImpact.cpu}`);
    lines.push(`  Memory: ${promptData.estimatedImpact.memory}`);
    lines.push(`  Duration: ${promptData.estimatedImpact.duration}`);
    lines.push('');
    lines.push('RISKS:');
    promptData.risks.forEach(risk => lines.push(`  ⚠ ${risk}`));
    lines.push('');
    lines.push('────────────────────────────────────────────────────────────────');
    lines.push('Do you authorize HeadyRoid Node download and activation?');
    lines.push('  [Y] Yes, activate now (single use)');
    lines.push('  [S] Yes, for this session');
    lines.push('  [P] Yes, persistently (until revoked)');
    lines.push('  [N] No, deny activation');
    lines.push('────────────────────────────────────────────────────────────────');
    
    return lines.join('\n');
  }

  /**
   * Generate HTML prompt for web UI
   */
  static generateHTMLPrompt(promptData: PermissionPromptData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HeadyRoid Activation Request</title>
  <style>
    :root {
      --bg-dark: #0b1120;
      --bg-panel: rgba(15, 23, 42, 0.9);
      --accent: #4fd1c5;
      --text: #e2e8f0;
      --warning: #f97316;
      --danger: #ef4444;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: radial-gradient(circle at 20% 10%, #1b2440 0%, transparent 55%),
                  linear-gradient(160deg, var(--bg-dark), #111827);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    
    .modal {
      background: var(--bg-panel);
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.15);
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.6);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, rgba(79, 209, 197, 0.2), rgba(139, 92, 246, 0.2));
      padding: 24px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .header h1 {
      font-size: 22px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .header .reason {
      font-size: 14px;
      color: rgba(226, 232, 240, 0.8);
    }
    
    .content {
      padding: 24px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent);
      margin-bottom: 12px;
    }
    
    .list {
      list-style: none;
      padding: 0;
    }
    
    .list li {
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 8px;
      margin-bottom: 6px;
      font-size: 13px;
    }
    
    .list.risks li {
      border-left: 3px solid var(--warning);
    }
    
    .impact-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .impact-item {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px;
      border-radius: 10px;
      text-align: center;
    }
    
    .impact-item .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(226, 232, 240, 0.6);
      margin-bottom: 6px;
    }
    
    .impact-item .value {
      font-size: 16px;
      font-weight: 600;
      color: var(--accent);
    }
    
    .actions {
      display: grid;
      gap: 10px;
      margin-top: 24px;
    }
    
    .btn {
      padding: 12px 18px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, rgba(79, 209, 197, 0.9), rgba(79, 209, 197, 0.6));
      color: #0b1120;
    }
    
    .btn-secondary {
      background: rgba(148, 163, 184, 0.2);
      color: var(--text);
    }
    
    .btn-danger {
      background: rgba(239, 68, 68, 0.2);
      color: #fecdd3;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(79, 209, 197, 0.3);
    }
    
    .scope-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      background: rgba(79, 209, 197, 0.15);
      color: var(--accent);
      border: 1px solid rgba(79, 209, 197, 0.3);
    }
  </style>
</head>
<body>
  <div class="modal">
    <div class="header">
      <h1>🚀 HeadyRoid Node Activation</h1>
      <p class="reason">${promptData.reason}</p>
      <div style="margin-top: 12px;">
        <span class="scope-badge">${promptData.scope}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Capabilities</h2>
        <ul class="list">
          ${promptData.capabilities.map(cap => `<li>✓ ${cap}</li>`).join('')}
        </ul>
      </div>
      
      <div class="section">
        <h2>Estimated Impact</h2>
        <div class="impact-grid">
          <div class="impact-item">
            <div class="label">CPU</div>
            <div class="value">${promptData.estimatedImpact.cpu}</div>
          </div>
          <div class="impact-item">
            <div class="label">Memory</div>
            <div class="value">${promptData.estimatedImpact.memory}</div>
          </div>
          <div class="impact-item">
            <div class="label">Duration</div>
            <div class="value">${promptData.estimatedImpact.duration}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Risks & Considerations</h2>
        <ul class="list risks">
          ${promptData.risks.map(risk => `<li>⚠ ${risk}</li>`).join('')}
        </ul>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary" onclick="respond(true, 'single-use')">
          Authorize (Single Use)
        </button>
        <button class="btn btn-secondary" onclick="respond(true, 'session')">
          Authorize (This Session)
        </button>
        <button class="btn btn-danger" onclick="respond(false)">
          Deny Activation
        </button>
      </div>
    </div>
  </div>
  
  <script>
    function respond(granted, scope) {
      const response = {
        granted,
        constraints: granted ? {
          maxActivations: scope === 'single-use' ? 1 : undefined,
          maxDurationMs: 300000
        } : undefined
      };
      
      // Send response to parent or backend
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'HEADYROID_PERMISSION_RESPONSE', response }, '*');
      } else {
        console.log('Permission response:', response);
        alert(granted ? 'Permission granted!' : 'Permission denied.');
      }
    }
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Get pending prompts count
   */
  getPendingCount(): number {
    return this.pendingPrompts.size;
  }

  /**
   * Cancel all pending prompts
   */
  cancelAllPrompts(): void {
    this.pendingPrompts.forEach((resolver, promptId) => {
      resolver({ granted: false, userNote: 'Cancelled by system' });
    });
    this.pendingPrompts.clear();
    this.emit('prompts:cancelled');
  }
}
