const { ArenaManager } = require('../packages/task-manager/dist/core/arena-manager');
const { NodeOrchestrator } = require('../packages/task-manager/dist/core/node-orchestrator');

async function main() {
    console.log(`[${new Date().toISOString()}] 🚀 JS Test Script Started`);
    
    console.log(`[${new Date().toISOString()}] 1. Instantiating Orchestrator`);
    const orchestrator = new NodeOrchestrator();
    
    console.log(`[${new Date().toISOString()}] 2. Instantiating ArenaManager`);
    const arena = new ArenaManager(orchestrator);
    
    console.log(`[${new Date().toISOString()}] 3. Creating Match`);
    const matchId = await arena.createMatch({ name: "Verification Match" });
    console.log(`[${new Date().toISOString()}]    Match ID: ${matchId}`);
    
    console.log(`[${new Date().toISOString()}] 4. Joining Match`);
    await arena.joinMatch(matchId, "PLAYER_1");
    await arena.joinMatch(matchId, "PLAYER_2");
    
    console.log(`[${new Date().toISOString()}] 5. Submitting Solutions`);
    await arena.submitSolution(matchId, "PLAYER_1", "function test() { return 1; }");
    await arena.submitSolution(matchId, "PLAYER_2", "function test() { return 2; }");
    
    console.log(`[${new Date().toISOString()}] 6. Getting Results`);
    const match = await arena.getMatchStatus(matchId);
    console.log(`[${new Date().toISOString()}]    Result: ${match.finalResult}`);
    
    console.log(`[${new Date().toISOString()}] ✅ Done`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
