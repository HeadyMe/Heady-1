const fs = require('fs');
const path = require('path');

// Resolve paths relative to the script location (in /scripts)
const PROJECT_ROOT = path.join(__dirname, '..');
const CONTEXT_FILE = path.join(PROJECT_ROOT, '.heady-context.json');
// Default ingest file
const DEFAULT_INGEST_FILE = path.join(PROJECT_ROOT, 'DATA_INGEST.md');

function getIngestFilePath() {
  const args = process.argv.slice(2);
  let filePath = DEFAULT_INGEST_FILE;

  // Handle "hc ingest @file <path>" or "hc ingest <path>"
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '@file' && args[i + 1]) {
      filePath = args[i + 1];
      break;
    } else if (args[i] && !args[i].startsWith('-') && i === 0) {
      // Assume first non-flag arg is file path if not using @file
      filePath = args[i];
    }
  }

  // Handle absolute/relative paths
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }
  
  return filePath;
}

function loadContext() {
  if (fs.existsSync(CONTEXT_FILE)) {
    return JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf-8'));
  }
  return {
    version: 0,
    events: [],
    snapshot: {
      sessionId: `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      services: [],
      environment: {},
      lastSync: new Date().toISOString()
    },
    savedAt: new Date().toISOString()
  };
}

function saveContext(ctx) {
  ctx.savedAt = new Date().toISOString();
  ctx.version++;
  fs.writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2));
  console.log(`✅ Context updated (v${ctx.version})`);
}

function parseIngestFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Ingest file not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📄 Parsing file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = {};
  let currentSection = null;

  content.split('\n').forEach(line => {
    // Match headers: #, ##, ###
    const sectionMatch = line.match(/^#+\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase();
      // Clean up common prefixes like "Phase 1 - "
      currentSection = currentSection.replace(/^phase \d+ – /, '').replace(/^phase \d+ - /, '');
      sections[currentSection] = [];
    } else if (currentSection && line.trim()) {
      sections[currentSection].push(line.trim());
    }
  });

  return sections;
}

function processServices(lines, ctx) {
  if (!lines) return;
  let count = 0;
  lines.forEach(line => {
    // Attempt to parse "Service: Status" or "- Service: Status"
    const match = line.match(/[-*]?\s*([^:]+):\s*(.+)/);
    if (match) {
      const name = match[1].trim();
      const status = match[2].trim().toLowerCase();
      
      const existing = ctx.snapshot.services.find(s => s.name === name);
      const service = existing || { name, metadata: {} };
      
      service.status = ['online', 'offline', 'degraded'].includes(status) ? status : 'unknown';
      service.lastHeartbeat = new Date().toISOString();
      if (!existing) ctx.snapshot.services.push(service);
      
      // Log event
      ctx.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'SERVICE_REGISTERED',
        payload: { name, status },
        timestamp: new Date().toISOString(),
        source: 'ingest',
        version: ctx.version + 1
      });
      count++;
    }
  });
  if (count > 0) console.log(`   Processed ${count} services`);
}

function processEnvironment(lines, ctx) {
  if (!lines) return;
  let count = 0;
  lines.forEach(line => {
    const match = line.match(/([^=]+)=(.+)/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      ctx.snapshot.environment[key] = value;
      count++;
    }
  });
  if (count > 0) {
    console.log(`   Processed ${count} environment variables`);
    ctx.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'ENVIRONMENT_UPDATED',
        payload: { count },
        timestamp: new Date().toISOString(),
        source: 'ingest',
        version: ctx.version + 1
    });
  }
}

function processTasks(lines, ctx) {
  if (!lines) return;
  console.log(`   Found ${lines.length} task lines (stored in events)`);
  ctx.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'TASKS_INGESTED',
      payload: { tasks: lines },
      timestamp: new Date().toISOString(),
      source: 'ingest',
      version: ctx.version + 1
  });
}

function main() {
  console.log('📥 Starting Data Ingestion...');
  const ingestFile = getIngestFilePath();
  const ctx = loadContext();
  const data = parseIngestFile(ingestFile);

  if (data.services) processServices(data.services, ctx);
  if (data.environment) processEnvironment(data.environment, ctx);
  if (data.tasks) processTasks(data.tasks, ctx);
  
  // Generic ingestion for all other sections
  Object.keys(data).forEach(section => {
    if (['services', 'environment', 'tasks'].includes(section)) return;
    
    if (data[section] && data[section].length > 0) {
      console.log(`   Ingesting ${section}...`);
      ctx.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: `KNOWLEDGE_INGESTED`,
        payload: { category: section, content: data[section] },
        timestamp: new Date().toISOString(),
        source: 'ingest',
        version: ctx.version + 1
      });
    }
  });

  saveContext(ctx);
}

main();
