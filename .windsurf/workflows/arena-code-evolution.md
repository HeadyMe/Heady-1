---
description: Evolve code using competitive Arena Mode
---
# Arena Mode Workflow

This workflow utilizes the "Arena Mode" to evolve code by pitting different implementations against each other and merging the best results.

1. **Concept**
   Arena Mode uses the `NodeOrchestrator` to manage "players" (different algorithms or LLM prompts) and the `ArenaManager` to evaluate their outputs. The `SquashMerger` combines the best parts of winning solutions.

2. **Run Arena Simulation**
   Execute the test script to see Arena Mode in action (creating a match, submitting solutions, and determining a winner).
   ```powershell
   // turbo
   tsx scripts/test-arena-mode.ts
   ```

3. **Analyze Results**
   The script outputs the "Winner" based on code quality metrics (TypeScript usage, documentation, complexity).
   - **Player 1**: Basic implementation.
   - **Player 2**: Typed, documented implementation (usually wins).

4. **Integration**
   In a production scenario, this workflow would be triggered by the Task System to resolve complex coding tasks by generating multiple variations and selecting the optimal one.
