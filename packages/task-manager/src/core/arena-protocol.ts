import { NodeCapabilities } from './node-orchestrator.js';

export interface ArenaConfig {
  id: string;
  name: string;
  maxPlayers: number;
  minPlayers: number;
  timeLimitMs: number;
  rounds: number;
  squashStrategy: 'aggressive' | 'conservative' | 'balanced';
}

export interface ArenaMatch {
  id: string;
  arenaId: string;
  taskId: string;
  taskType: string;
  status: 'pending' | 'active' | 'judging' | 'completed' | 'cancelled';
  players: string[]; // Node IDs
  startTime: number;
  endTime?: number;
  rounds: MatchRound[];
  winner?: string; // Node ID or 'composite'
  finalResult?: string; // Merged code/result
}

export interface MatchRound {
  id: number;
  startTime: number;
  submissions: PlayerSubmission[];
  mergedResult?: string;
}

export interface PlayerSubmission {
  playerId: string;
  content: string;
  timestamp: number;
  metrics?: {
    executionTime: number;
    memoryUsage: number;
    qualityScore: number;
  };
}

export interface ArenaEvent {
  type: 'MATCH_STARTED' | 'PLAYER_JOINED' | 'SUBMISSION_RECEIVED' | 'ROUND_COMPLETE' | 'MATCH_COMPLETE';
  matchId: string;
  payload: any;
  timestamp: number;
}

export interface ArenaProtocol {
  createMatch(config: Partial<ArenaConfig>): Promise<string>;
  joinMatch(matchId: string, nodeId: string): Promise<boolean>;
  submitSolution(matchId: string, nodeId: string, content: string): Promise<void>;
  getMatchStatus(matchId: string): Promise<ArenaMatch | null>;
}
