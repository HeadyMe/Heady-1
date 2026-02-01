# Automated Merge Guide

## Overview
The auto-merge scripts intelligently merge code changes by analyzing code quality, complexity, type safety, and other factors.

## 🆕 Enhanced Features (v2.0)

### **Configuration File Support**
Load merge settings from JSON config files:
- `auto-merge.config.json` (default)
- Custom path via `--config` flag
- Environment variable `AUTO_MERGE_CONFIG`

### **Triple Output Mode** (`--triple`)
Generate three versions for comparison:
- **Left variant**: All changes from left side
- **Right variant**: All changes from right side  
- **Auto variant**: Intelligently merged version

### **Environment Variables**
Configure via environment:
- `AUTO_MERGE_LEFT`, `AUTO_MERGE_RIGHT`, `AUTO_MERGE_OUTPUT` - Paths
- `AUTO_MERGE_VERBOSE=true` - Enable verbose mode
- `AUTO_MERGE_TRIPLE=true` - Enable triple output

### **Automatic Directory Creation**
Parent directories are created automatically - no more "directory not found" errors.

## Quick Start

### Using Node.js Script
```bash
node scripts/auto-merge.js <left-path> <right-path> <output-path> [options]
```

### Using PowerShell Script
```powershell
.\scripts\auto-merge.ps1 -LeftPath <path> -RightPath <path> -OutputPath <path> [options]
```

## Options

### Node.js Flags
- `--verbose` - Show detailed decision-making process
- `--prefer-older` - Prefer older version when scores are equal (default: prefer newer)
- `--prefer-shorter` - Prefer shorter code implementations
- `--no-types` - Don't give preference to TypeScript type annotations

### PowerShell Flags
- `-Verbose` - Show detailed output
- `-PreferOlder` - Prefer older version on ties
- `-PreferShorter` - Prefer shorter code
- `-NoTypes` - Don't prefer TypeScript
- `-DryRun` - Show what would be merged without making changes

## How It Works

### Quality Scoring System

The merger analyzes each code block and assigns scores based on:

| Factor | Points | Description |
|--------|--------|-------------|
| TypeScript Types | 20 | Has type annotations |
| Tests | 20 | Includes test code |
| Error Handling | 15 | Has try/catch blocks |
| Documentation | 15 | Has JSDoc comments |
| Logging | 10 | Includes logging statements |
| Comments | 10 | Has inline comments |
| Low Complexity | 10 | Cyclomatic complexity < 10 |

### Decision Process

1. **Analyze Both Versions** - Calculate quality metrics for each
2. **Compare Scores** - Apply weighted scoring based on factors
3. **Apply Preferences** - Consider user preferences (newer, shorter, etc.)
4. **Select Winner** - Choose the version with the highest weighted score
5. **Merge Blocks** - Combine the best blocks from both versions

### Complexity Calculation

Cyclomatic complexity is calculated by counting:
- `if` statements
- `else if` branches
- `for` loops
- `while` loops
- `case` statements
- `catch` blocks
- Ternary operators (`? :`)
- Logical operators (`&&`, `||`)

## Examples

### Example 1: Merge Two Files
```bash
node scripts/auto-merge.js \
  src/server/index.ts \
  src/server/index.ts.backup \
  src/server/index-merged.ts
```

### Example 2: Merge with Verbose Output
```bash
node scripts/auto-merge.js \
  src/services/mcp-client.ts \
  src/services/mcp-client-v2.ts \
  src/services/mcp-client-final.ts \
  --verbose
```

### Example 3: Merge Entire Directory
```bash
node scripts/auto-merge.js \
  src/server \
  src/server-backup \
  src/server-merged
```

### Example 4: PowerShell Dry Run
```powershell
.\scripts\auto-merge.ps1 `
  -LeftPath "src\server" `
  -RightPath "src\server-backup" `
  -OutputPath "src\server-merged" `
  -DryRun `
  -Verbose
```

### Example 5: Prefer Older Version
```bash
node scripts/auto-merge.js \
  old-version.ts \
  new-version.ts \
  merged.ts \
  --prefer-older
```

## Use Cases

### 1. Windsurf Arena Mode Integration
When Windsurf shows two columns of changes:
1. Export left column to `left.ts`
2. Export right column to `right.ts`
3. Run: `node scripts/auto-merge.js left.ts right.ts merged.ts --verbose`
4. Review `merged.ts` and apply to your file

### 2. Git Merge Conflicts
```bash
# Extract conflict versions
git show :2:file.ts > left.ts   # Your version
git show :3:file.ts > right.ts  # Their version

# Auto-merge
node scripts/auto-merge.js left.ts right.ts merged.ts

# Review and apply
git add merged.ts
```

### 3. Refactoring Comparison
```bash
# Compare original vs refactored
node scripts/auto-merge.js \
  src/original.ts \
  src/refactored.ts \
  src/best-of-both.ts \
  --verbose
```

### 4. Feature Branch Merge
```bash
# Merge feature branch changes intelligently
node scripts/auto-merge.js \
  main-branch/src \
  feature-branch/src \
  merged-src \
  --verbose
```

## Decision Examples

### Example: TypeScript vs JavaScript
```javascript
// Left (JavaScript)
function add(a, b) {
  return a + b;
}

// Right (TypeScript)
function add(a: number, b: number): number {
  return a + b;
}

// Winner: Right (TypeScript) - +20 points for types
```

### Example: Error Handling
```javascript
// Left (No error handling)
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

// Right (With error handling)
async function fetchData(url) {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    logger.error('Fetch failed', error);
    throw error;
  }
}

// Winner: Right - +15 points for error handling, +10 for logging
```

### Example: Documentation
```javascript
// Left (No docs)
function calculatePhi(base) {
  return base * 1.618;
}

// Right (With docs)
/**
 * Calculate Phi (golden ratio) spacing
 * @param base - Base unit in pixels
 * @returns Phi-scaled value
 */
function calculatePhi(base: number): number {
  return base * 1.618;
}

// Winner: Right - +15 for docs, +20 for types
```

## Verbose Output Example

```
Left metrics: {
  hasTypes: true,
  hasComments: false,
  hasErrorHandling: true,
  hasLogging: false,
  lineCount: 15,
  complexity: 3,
  hasTests: false,
  hasDocumentation: false,
  score: 45
}

Right metrics: {
  hasTypes: true,
  hasComments: true,
  hasErrorHandling: true,
  hasLogging: true,
  lineCount: 20,
  complexity: 4,
  hasTests: false,
  hasDocumentation: true,
  score: 80
}

Decision: {
  winner: 'right',
  leftScore: 2,
  rightScore: 7,
  confidence: 0.71,
  factors: [
    { winner: 'right', reason: 'Higher quality score', weight: 3 },
    { winner: 'right', reason: 'Has documentation', weight: 1 },
    { winner: 'right', reason: 'Has logging', weight: 2 }
  ]
}

Block 0: Chose right (confidence: 0.71)
Reasons: Higher quality score, Has documentation, Has logging
```

## Best Practices

1. **Always Review** - Auto-merge is smart but not perfect. Review the output.
2. **Use Verbose Mode** - Understand why decisions were made with `--verbose`
3. **Test After Merge** - Run tests to ensure merged code works
4. **Backup First** - Keep original files until you verify the merge
5. **Iterative Merging** - For complex merges, do it in stages
6. **Version Control** - Commit before and after merging

## Limitations

- **Context-Unaware** - Doesn't understand semantic meaning of code
- **Block-Based** - Merges by code blocks, not line-by-line
- **Heuristic** - Uses heuristics, not deep code analysis
- **No Testing** - Doesn't run tests to verify correctness

## Troubleshooting

### Issue: Wrong version chosen
**Solution**: Use `--verbose` to see decision factors, adjust preferences

### Issue: Merge creates invalid code
**Solution**: Review and manually fix, or adjust block splitting logic

### Issue: Can't find Node.js
**Solution**: Ensure Node.js is installed and in PATH

### Issue: Permission denied
**Solution**: Run with appropriate permissions or check file locks

## Integration with Windsurf

### Workflow
1. Open file in Windsurf Arena Mode
2. Review both columns
3. Export versions or copy to temp files
4. Run auto-merge script
5. Review merged result
6. Apply to your codebase

### Automation
Add to your `package.json`:
```json
{
  "scripts": {
    "merge": "node scripts/auto-merge.js",
    "merge:verbose": "node scripts/auto-merge.js --verbose"
  }
}
```

Then use:
```bash
npm run merge -- left.ts right.ts merged.ts
npm run merge:verbose -- src/old src/new src/merged
```

## Future Enhancements

- [ ] Semantic code analysis
- [ ] AST-based merging
- [ ] Machine learning for better decisions
- [ ] Integration with git mergetool
- [ ] GUI interface
- [ ] Undo/rollback support
- [ ] Merge conflict markers
- [ ] Custom scoring rules

---

**Status**: Production-ready
**Version**: 1.0.0
**Last Updated**: 2026-01-31

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
