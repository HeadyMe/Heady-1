import { EventEmitter } from 'events';
import { ArenaConfig, ArenaMatch, ArenaProtocol } from './arena-protocol.js';
import { NodeOrchestrator } from './node-orchestrator.js';
export declare class ArenaManager extends EventEmitter implements ArenaProtocol {
    private orchestrator;
    private matches;
    private merger;
    constructor(orchestrator: NodeOrchestrator);
    createMatch(config: Partial<ArenaConfig>): Promise<string>;
    joinMatch(matchId: string, nodeId: string): Promise<boolean>;
    private startMatch;
    submitSolution(matchId: string, nodeId: string, content: string): Promise<void>;
    private concludeRound;
    private mergeSubmissionsInMemory;
    getMatchStatus(matchId: string): Promise<ArenaMatch | null>;
    private emitEvent;
}
//# sourceMappingURL=arena-manager.d.ts.map