import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GovernanceEngine } from './engine';
import { GovernanceProtocolManager } from './protocol';
import { Concept, ScanResult, GovernanceStandard, ComplianceReport } from './types';
import type { KVNamespace } from '@cloudflare/workers-types';

type Bindings = {
  CONCEPTS_KV: KVNamespace;
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/', (c) => c.text('Heady Governance Worker Active'));

// --- Concept Evaluation Endpoints ---

// 1. Submit Concept for Evaluation
app.post('/evaluate', async (c) => {
  try {
    const concept = await c.req.json<Concept>();
    
    // Validate basics
    if (!concept.id || !concept.name) {
      return c.json({ error: 'Invalid concept data' }, 400);
    }

    const engine = new GovernanceEngine(c.env.CONCEPTS_KV, c.env.AI);
    const decision = await engine.evaluateConcept(concept);

    return c.json(decision);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// 2. Report Scan Results (Callback for external scanners)
app.post('/scan-results/:conceptId', async (c) => {
  const conceptId = c.req.param('conceptId');
  const result = await c.req.json<ScanResult>();
  
  const engine = new GovernanceEngine(c.env.CONCEPTS_KV, c.env.AI);
  await engine.recordScanResult(conceptId, result);
  
  return c.json({ success: true, message: 'Scan result recorded' });
});

// 3. Trigger Deep Scan (Manual or System trigger)
app.post('/trigger-scan/:conceptId', async (c) => {
  const conceptId = c.req.param('conceptId');
  
  // In a real implementation, this would queue a job or call an external scraper
  // For now, we simulate finding a better open source alternative
  
  const mockScanResult: ScanResult = {
    source: 'github_trending',
    conceptMatchScore: 92,
    implementationQuality: 95,
    details: 'Found "HyperOptimizedAlgo" repo which implements this concept 40% more efficiently.',
    url: 'https://github.com/example/hyper-optimized'
  };

  const engine = new GovernanceEngine(c.env.CONCEPTS_KV, c.env.AI);
  await engine.recordScanResult(conceptId, mockScanResult);

  return c.json({ 
    success: true, 
    message: 'Deep scan initiated and simulated result recorded', 
    result: mockScanResult 
  });
});

// 4. Get Concept Status
app.get('/concept/:id', async (c) => {
  const id = c.req.param('id');
  const conceptStr = await c.env.CONCEPTS_KV.get(`concept:${id}`);
  
  if (!conceptStr) {
    return c.json({ error: 'Concept not found' }, 404);
  }

  return c.json(JSON.parse(conceptStr));
});

// --- Protocol & Governance Endpoints ---

// 5. Register/Update Governance Standard
app.post('/protocol/standard', async (c) => {
  try {
    const standard = await c.req.json<GovernanceStandard>();
    const actor = c.req.header('X-Actor-ID') || 'anonymous';
    
    const manager = new GovernanceProtocolManager(c.env.CONCEPTS_KV);
    const hash = await manager.registerStandard(standard, actor);
    
    return c.json({ success: true, hash });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// 6. List Governance Standards
app.get('/protocol/standards', async (c) => {
  const manager = new GovernanceProtocolManager(c.env.CONCEPTS_KV);
  const standards = await manager.listStandards();
  return c.json(standards);
});

// 7. Submit Compliance Report
app.post('/protocol/compliance', async (c) => {
  try {
    const report = await c.req.json<ComplianceReport>();
    const actor = c.req.header('X-Actor-ID') || 'system_monitor';
    
    const manager = new GovernanceProtocolManager(c.env.CONCEPTS_KV);
    const hash = await manager.recordCompliance(report, actor);
    
    return c.json({ success: true, hash });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

// 8. Verify Audit Chain Integrity
app.get('/protocol/verify', async (c) => {
  const manager = new GovernanceProtocolManager(c.env.CONCEPTS_KV);
  const result = await manager.verifyChain();
  return c.json(result);
});

// 9. Ingest Scanned Governance Implementation
app.post('/scan/ingest', async (c) => {
  try {
    const data = await c.req.json();
    const source = data.source || 'unknown';
    
    // Here we would analyze the ingested governance implementation
    // For now, we'll just log it as a generic scan result linked to a 'governance' concept
    
    const engine = new GovernanceEngine(c.env.CONCEPTS_KV, c.env.AI);
    await engine.recordScanResult('global_governance', {
      source,
      conceptMatchScore: 100,
      implementationQuality: data.quality || 50,
      details: JSON.stringify(data),
      url: data.url || ''
    });

    return c.json({ success: true, message: 'Governance implementation ingested' });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

export default app;
