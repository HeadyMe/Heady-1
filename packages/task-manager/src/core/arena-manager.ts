import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ArenaConfig, ArenaMatch, ArenaProtocol, MatchRound, PlayerSubmission, ArenaEvent } from './arena-protocol.js';
import { SquashMerger } from './squash-merger.js';
import { NodeOrchestrator, NodeStatus } from './node-orchestrator.js';
import { logger } from '../utils/logger.js';

export class ArenaManager extends EventEmitter implements ArenaProtocol {
  private matches: Map<string, ArenaMatch> = new Map();
  private merger: SquashMerger;

  constructor(private orchestrator: NodeOrchestrator) {
    super();
    this.merger = new SquashMerger({ verbose: true });
  }

  async createMatch(config: Partial<ArenaConfig>): Promise<string> {
    const matchId = uuidv4();
    const defaultConfig: ArenaConfig = {
      id: matchId,
      name: `Arena Match ${matchId.substring(0, 8)}`,
      maxPlayers: 2,
      minPlayers: 2,
      timeLimitMs: 30000,
      rounds: 1,
      squashStrategy: 'balanced',
      ...config
    } as ArenaConfig;

    const match: ArenaMatch = {
      id: matchId,
      arenaId: defaultConfig.id,
      taskId: uuidv4(),
      taskType: 'arena_challenge', // Default task type
      status: 'pending',
      players: [],
      startTime: Date.now(),
      rounds: [],
    };

    this.matches.set(matchId, match);
    this.emitEvent('MATCH_STARTED', matchId, { config: defaultConfig });
    
    // Auto-invite capable nodes if not specified
    if (this.orchestrator) {
        const nodes = this.orchestrator.getAllNodes();
        const capableNodes = nodes.filter(n => n.status === NodeStatus.ONLINE);
        // Logic to invite or wait for joins could go here
    }

    return matchId;
  }

  async joinMatch(matchId: string, nodeId: string): Promise<boolean> {
    const match = this.matches.get(matchId);
    if (!match) return false;
    if (match.status !== 'pending') return false;
    if (match.players.includes(nodeId)) return true;
    
    // Check max players (assuming default config for now, in real impl store config with match)
    // For simplicity, we'll allow joining up to a reasonable limit or if we stored config
    
    match.players.push(nodeId);
    this.emitEvent('PLAYER_JOINED', matchId, { nodeId });

    // Auto-start if min players reached? Or wait for explicit start?
    // For this prototype, we'll start if we have 2 players
    if (match.players.length >= 2) {
        this.startMatch(matchId);
    }

    return true;
  }

  private async startMatch(matchId: string) {
      const match = this.matches.get(matchId);
      if (!match) return;
      
      match.status = 'active';
      // Initialize first round
      match.rounds.push({
          id: 1,
          startTime: Date.now(),
          submissions: []
      });
      
      // In a real system, we would broadcast a start event to the nodes here
      this.emitEvent('MATCH_STARTED', matchId, { players: match.players });
  }

  async submitSolution(matchId: string, nodeId: string, content: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'active') return;

    const currentRound = match.rounds[match.rounds.length - 1];
    if (!currentRound) return;

    const submission: PlayerSubmission = {
      playerId: nodeId,
      content,
      timestamp: Date.now(),
      metrics: {
        executionTime: 0, // Placeholder
        memoryUsage: 0,   // Placeholder
        qualityScore: this.merger.analyzeQuality(content).score
      }
    };

    currentRound.submissions.push(submission);
    this.emitEvent('SUBMISSION_RECEIVED', matchId, { nodeId, qualityScore: submission.metrics?.qualityScore });

    // Check if all players have submitted
    const uniqueSubmitters = new Set(currentRound.submissions.map(s => s.playerId));
    if (uniqueSubmitters.size >= match.players.length) {
        await this.concludeRound(matchId);
    }
  }

  private async concludeRound(matchId: string) {
      const match = this.matches.get(matchId);
      if (!match) return;

      const currentRound = match.rounds[match.rounds.length - 1];
      match.status = 'judging';

      // Perform Intelligent Squash Merge
      let mergedContent = '';
      if (currentRound.submissions.length > 0) {
          // Sort by quality score descending
          const sortedSubmissions = [...currentRound.submissions].sort((a, b) => 
              (b.metrics?.qualityScore || 0) - (a.metrics?.qualityScore || 0)
          );

          if (sortedSubmissions.length === 1) {
              mergedContent = sortedSubmissions[0].content;
          } else {
              // Iteratively merge
              let base = sortedSubmissions[0].content;
              for (let i = 1; i < sortedSubmissions.length; i++) {
                  // We need to write to temp files for the merger to work as currently designed
                  // Or refactor merger to work with strings. 
                  // Let's assume we refactor or use temp files.
                  // For now, I'll simulate string merging support or update the merger.
                  // Actually, the merger currently reads from FS. I should overload it or write temp files.
                  // Writing temp files is safer for now.
                  const tempDir = `./temp/arena/${matchId}/${currentRound.id}`;
                  const leftPath = `${tempDir}/left_${i}.ts`;
                  const rightPath = `${tempDir}/right_${i}.ts`;
                  const outPath = `${tempDir}/merged_${i}.ts`;
                  
                  // This part assumes we have FS access and can write temp files
                  // We might need to import fs/path
              }
              // Wait, let's update SquashMerger to support string merging directly?
              // It effectively does in `compareVersions` but `mergeFiles` uses FS.
              // I'll create a helper to merge strings in memory using the logic.
              
              mergedContent = this.mergeSubmissionsInMemory(sortedSubmissions);
          }
      }

      currentRound.mergedResult = mergedContent;
      match.finalResult = mergedContent;
      match.status = 'completed';
      match.endTime = Date.now();
      
      this.emitEvent('MATCH_COMPLETE', matchId, { winner: 'composite', resultLength: mergedContent.length });
  }

  // Helper to merge strings using the squash logic without FS
  private mergeSubmissionsInMemory(submissions: PlayerSubmission[]): string {
      if (submissions.length === 0) return '';
      if (submissions.length === 1) return submissions[0].content;

      // Simple tournament merge or iterative
      // Let's do iterative: merge best with second best, then result with third...
      let currentMerged = submissions[0].content;
      
      for (let i = 1; i < submissions.length; i++) {
          const right = submissions[i].content;
          const leftBlocks = this.merger.splitIntoBlocks(currentMerged);
          const rightBlocks = this.merger.splitIntoBlocks(right);
          
          const newBlocks: string[] = [];
          const maxBlocks = Math.max(leftBlocks.length, rightBlocks.length);
          
          for (let j = 0; j < maxBlocks; j++) {
             const leftBlock = leftBlocks[j] || '';
             const rightBlock = rightBlocks[j] || '';
             
             if (!leftBlock) newBlocks.push(rightBlock);
             else if (!rightBlock) newBlocks.push(leftBlock);
             else if (leftBlock === rightBlock) newBlocks.push(leftBlock);
             else {
                 const decision = this.merger.compareVersions(leftBlock, rightBlock);
                 newBlocks.push(decision.winner === 'left' ? leftBlock : rightBlock);
             }
          }
          currentMerged = newBlocks.join('\n');
      }
      return currentMerged;
  }

  async getMatchStatus(matchId: string): Promise<ArenaMatch | null> {
    return this.matches.get(matchId) || null;
  }

  private emitEvent(type: ArenaEvent['type'], matchId: string, payload: any) {
      const event: ArenaEvent = {
          type,
          matchId,
          payload,
          timestamp: Date.now()
      };
      this.emit(type, event);
      // Also log
      // logger.info(`Arena Event: ${type}`, event);
  }
}
