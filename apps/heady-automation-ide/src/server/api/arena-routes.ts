import { Router, type Router as RouterType } from 'express';
import { ArenaManager, NodeOrchestrator } from '@heady/task-manager';
import type { ArenaConfig } from '@heady/task-manager';
import { asyncHandler } from '../middleware/error-handler.js';
import { rateLimits } from '../middleware/rate-limiter.js';
import { mcpManager } from '../services/mcp-manager.js';

const router: RouterType = Router();

function requireAutomationApiKey(req: any, res: any): boolean {
  const requiredKey = process.env.HC_AUTOMATION_API_KEY;
  if (!requiredKey) return true;

  const providedKey = req.header('x-api-key');
  if (providedKey && providedKey === requiredKey) return true;

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

const orchestrator = new NodeOrchestrator(process.env.HC_ARENA_DETERMINISTIC_SEED);

const ensureNode = (nodeId: string) => {
  if (orchestrator.getNode(nodeId)) return;
  orchestrator.registerNode(nodeId, {
    tools: ['code_generation', 'arena'],
    maxConcurrentTasks: 1,
    version: '1.0.0',
  });
};

ensureNode('jules');

const arenaManager = new ArenaManager(orchestrator);

const normalizeAiContent = (result: any): string => {
  if (typeof result === 'string') return result;

  if (result && typeof result === 'object') {
    if (typeof result.code === 'string') return result.code;
    if (typeof result.content === 'string') return result.content;
    if (typeof result.text === 'string') return result.text;
  }

  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

router.post('/arena/matches', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;

  const config: Partial<ArenaConfig> = (req.body?.config ?? req.body ?? {}) as Partial<ArenaConfig>;
  const matchId = await arenaManager.createMatch(config);
  res.status(201).json({ matchId });
}));

router.post('/arena/quickstart', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;

  const userId = String(req.body?.userId || '').trim();
  const aiService = String(req.body?.aiService || 'jules').trim();
  const aiMethod = String(req.body?.aiMethod || 'generate_code').trim();
  const initialCode = typeof req.body?.initialCode === 'string' ? req.body.initialCode : '';
  const challenge = typeof req.body?.challenge === 'string' ? req.body.challenge : 'Generate an improved solution.';
  const config: Partial<ArenaConfig> = (req.body?.config ?? {}) as Partial<ArenaConfig>;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  ensureNode(userId);
  ensureNode(aiService);

  const matchId = await arenaManager.createMatch({
    maxPlayers: 2,
    minPlayers: 2,
    ...config,
  });

  await arenaManager.joinMatch(matchId, aiService);
  await arenaManager.joinMatch(matchId, userId);

  let aiContent = initialCode;
  try {
    const result = await mcpManager.executeTask(aiService, aiMethod, {
      description: challenge,
      context: { initialCode },
      initialCode,
    });
    aiContent = normalizeAiContent(result);
  } catch {
    aiContent = initialCode;
  }

  await arenaManager.submitSolution(matchId, aiService, aiContent);

  res.status(201).json({ matchId, userId, aiNodeId: aiService });
}));

router.post('/arena/matches/:matchId/join', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;

  const matchId = String(req.params.matchId || '').trim();
  const nodeId = String(req.body?.nodeId || '').trim();

  if (!matchId || !nodeId) {
    res.status(400).json({ error: 'matchId and nodeId are required' });
    return;
  }

  ensureNode(nodeId);
  const success = await arenaManager.joinMatch(matchId, nodeId);
  res.json({ success });
}));

router.post('/arena/matches/:matchId/submit', rateLimits.standard, asyncHandler(async (req, res) => {
  if (!requireAutomationApiKey(req, res)) return;

  const matchId = String(req.params.matchId || '').trim();
  const nodeId = String(req.body?.nodeId || '').trim();
  const content = typeof req.body?.content === 'string' ? req.body.content : '';

  if (!matchId || !nodeId) {
    res.status(400).json({ error: 'matchId and nodeId are required' });
    return;
  }

  await arenaManager.submitSolution(matchId, nodeId, content);
  const match = await arenaManager.getMatchStatus(matchId);
  res.json({ success: true, match });
}));

router.get('/arena/matches/:matchId', rateLimits.standard, asyncHandler(async (req, res) => {
  const matchId = String(req.params.matchId || '').trim();
  const match = await arenaManager.getMatchStatus(matchId);

  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json(match);
}));

export default router;
