const fs = require('fs');
const path = require('path');

const INGEST_FILE = path.join(process.cwd(), 'DATA_INGEST.md');
const CONTEXT_FILE = path.join(process.cwd(), '.heady-context.json');

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

function parseIngestFile() {
  if (!fs.existsSync(INGEST_FILE)) {
    console.error(`❌ Ingest file not found: ${INGEST_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(INGEST_FILE, 'utf-8');
  const sections = {};
  let currentSection = null;

  content.split('\n').forEach(line => {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase();
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
  // This is a placeholder for task ingestion if we had a task list in context
  // Currently extracting to logs or notes
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
  const ctx = loadContext();
  const data = parseIngestFile();

  if (data.services) processServices(data.services, ctx);
  if (data.environment) processEnvironment(data.environment, ctx);
  if (data.tasks) processTasks(data.tasks, ctx);
  
  // Generic notes/architecture storage in events for now
  ['architecture', 'notes'].forEach(section => {
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
