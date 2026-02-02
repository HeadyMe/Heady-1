#!/usr/bin/env node

/**
 * HeadyRoid CLI - Command-line interface for HeadyRoid permission and activation
 */

import readline from 'readline';
import { HeadyRoidPermissionUI } from '../packages/task-manager/src/core/headyroid-permission-ui.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function showPermissionPrompt(promptData) {
  console.clear();
  console.log(HeadyRoidPermissionUI.generateCLIPrompt(promptData));
  console.log('');
  
  const answer = await question('Your choice [Y/S/P/N]: ');
  
  const choice = answer.trim().toUpperCase();
  
  switch (choice) {
    case 'Y':
      return {
        granted: true,
        constraints: {
          maxActivations: 1,
          maxDurationMs: 300000
        }
      };
    case 'S':
      return {
        granted: true,
        constraints: {
          maxActivations: undefined,
          maxDurationMs: 300000
        }
      };
    case 'P':
      return {
        granted: true,
        constraints: {
          maxActivations: undefined,
          maxDurationMs: undefined
        }
      };
    case 'N':
    default:
      return {
        granted: false,
        userNote: 'User denied activation'
      };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'prompt') {
    const promptData = {
      nodeType: 'HeadyRoid',
      reason: args[1] || 'System equilibrium disruption detected',
      scope: 'single-use',
      capabilities: [
        'Intensive CPU processing',
        'High memory allocation',
        'Task queue rebalancing',
        'Node load redistribution',
        'Emergency failover coordination',
      ],
      risks: [
        'Increased system resource usage',
        'Potential impact on other processes',
        'Network bandwidth for download',
      ],
      estimatedImpact: {
        cpu: 'Up to 80%',
        memory: 'Up to 2048MB',
        duration: 'Max 300s',
      },
    };

    const response = await showPermissionPrompt(promptData);
    
    console.log('\n' + '='.repeat(64));
    if (response.granted) {
      console.log('✅ PERMISSION GRANTED');
      console.log(`Scope: ${response.constraints?.maxActivations === 1 ? 'Single-use' : response.constraints?.maxActivations === undefined && response.constraints?.maxDurationMs === undefined ? 'Persistent' : 'Session'}`);
    } else {
      console.log('❌ PERMISSION DENIED');
      console.log(`Reason: ${response.userNote || 'User declined'}`);
    }
    console.log('='.repeat(64));
    
    rl.close();
  } else if (command === 'html') {
    const promptData = {
      nodeType: 'HeadyRoid',
      reason: args[1] || 'System equilibrium disruption detected',
      scope: 'single-use',
      capabilities: [
        'Intensive CPU processing',
        'High memory allocation',
        'Task queue rebalancing',
        'Node load redistribution',
        'Emergency failover coordination',
      ],
      risks: [
        'Increased system resource usage',
        'Potential impact on other processes',
        'Network bandwidth for download',
      ],
      estimatedImpact: {
        cpu: 'Up to 80%',
        memory: 'Up to 2048MB',
        duration: 'Max 300s',
      },
    };

    const html = HeadyRoidPermissionUI.generateHTMLPrompt(promptData);
    console.log(html);
    rl.close();
  } else {
    console.log('HeadyRoid CLI');
    console.log('');
    console.log('Commands:');
    console.log('  prompt [reason]  - Show interactive permission prompt');
    console.log('  html [reason]    - Generate HTML permission prompt');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/headyroid-cli.js prompt "Critical task queue overflow"');
    console.log('  node scripts/headyroid-cli.js html > permission.html');
    rl.close();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
