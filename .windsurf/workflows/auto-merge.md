---
description: Intelligent code merging using the Auto-Merge tool
---
# Auto-Merge Workflow

This workflow utilizes the custom `scripts/auto-merge.js` tool to intelligently merge code files, prioritizing quality, TypeScript usage, and error handling.

1. **Understand Auto-Merge**
   The tool compares two versions of a file (Left vs. Right) and merges them block-by-block, selecting the better implementation based on:
   - TypeScript types presence
   - Error handling (try/catch)
   - Documentation/Comments
   - Code complexity (lower is better)

2. **Run Auto-Merge**
   Use the script to merge two files or directories.
   ```powershell
   node scripts/auto-merge.js <left-path> <right-path> <output-path> --verbose
   ```
   *Example:*
   ```powershell
   node scripts/auto-merge.js ./old/utils.ts ./new/utils.ts ./src/utils.ts --verbose
   ```

3. **Triple-Merge Mode (Optional)**
   Generate Left, Right, and Auto-merged variants to manually compare.
   ```powershell
   node scripts/auto-merge.js <left> <right> <output> --triple
   ```

4. **Verify Merge**
   Always review the output file to ensure logical consistency.
   ```powershell
   // turbo
   pnpm lint
   ```
