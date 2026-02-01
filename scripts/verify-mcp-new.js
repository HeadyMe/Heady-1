const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '../packages/core-domain/dist/mcp-server.js');
console.log(`Testing MCP Server at: ${serverPath}`);

const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    MCP_LOG_LEVEL: 'error' // Keep stderr clean
  }
});

let buffer = '';

server.stdout.on('data', (data) => {
  const chunk = data.toString();
  buffer += chunk;
  
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const msg = JSON.parse(line);
      handleMessage(msg);
    } catch (e) {
      console.log('Non-JSON output:', line);
    }
  }
});

server.stderr.on('data', (data) => {
  console.error(`[Server Log]: ${data.toString().trim()}`);
});

let step = 0;

function send(msg) {
  const json = JSON.stringify(msg);
  server.stdin.write(json + '\n');
}

function handleMessage(msg) {
  if (msg.error) {
    console.error('RPC Error:', msg.error);
    process.exit(1);
  }

  if (step === 0 && msg.id === 1) {
    console.log('✅ Initialization successful');
    console.log('Server Capabilities:', JSON.stringify(msg.result, null, 2));
    
    // Step 2: List Tools
    step++;
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });
  } else if (step === 1 && msg.id === 2) {
    console.log('✅ Tools listed successfully');
    const tools = msg.result.tools;
    console.log(`Found ${tools.length} tools`);
    
    const requiredTools = ['generate_sacred_geometry', 'system_diagnostics', 'search_context', 'configure_server'];
    const missing = requiredTools.filter(t => !tools.find(x => x.name === t));
    
    if (missing.length > 0) {
      console.error('❌ Missing required tools:', missing);
      process.exit(1);
    }
    
    console.log('✅ All new tools verified present');
    
    // Step 3: Test Sacred Geometry
    step++;
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'generate_sacred_geometry',
        arguments: { type: 'golden_spiral', scale: 100 }
      }
    });
  } else if (step === 2 && msg.id === 3) {
    console.log('✅ Sacred Geometry Generation successful');
    console.log('Result:', JSON.stringify(JSON.parse(msg.result.content[0].text), null, 2));
    
    // Step 4: System Diagnostics
    step++;
    send({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'system_diagnostics',
        arguments: { detailLevel: 'full' }
      }
    });
  } else if (step === 3 && msg.id === 4) {
    console.log('✅ System Diagnostics successful');
    const diag = JSON.parse(msg.result.content[0].text);
    console.log(`Server Uptime: ${diag.server.uptime}s`);
    console.log(`Memory RSS: ${Math.round(diag.server.memory.rss / 1024 / 1024)}MB`);
    
    console.log('🎉 All verification steps passed!');
    process.exit(0);
  }
}

// Start sequence
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'verifier',
      version: '1.0.0'
    }
  }
});

// Timeout
setTimeout(() => {
  console.error('❌ Timeout waiting for response');
  process.exit(1);
}, 5000);
