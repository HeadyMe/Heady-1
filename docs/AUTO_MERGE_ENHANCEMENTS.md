# Auto-Merge Script - Enhanced Features

## 🎉 New Features Added

Your enhancements to `auto-merge.js` have added powerful new capabilities:

### **1. Configuration File Support**

The script now supports loading defaults from a JSON config file.

#### **Config File Locations** (checked in order):
1. Explicit path via `--config` flag
2. `AUTO_MERGE_CONFIG` environment variable
3. `auto-merge.config.json` (current directory)
4. `auto-merge.json` (current directory)
5. `.auto-merge.json` (current directory)

#### **Sample Config** (`auto-merge.config.json`):
```json
{
  "options": {
    "verbose": false,
    "triple": false,
    "preferNewer": true,
    "preferShorter": false,
    "preferTypescript": true
  },
  "paths": {
    "left": "src/version1",
    "right": "src/version2",
    "output": "src/merged"
  }
}
```

#### **Usage with Config**:
```bash
# Use default config file
node scripts/auto-merge.js

# Use specific config file
node scripts/auto-merge.js --config my-merge-config.json

# Override config with CLI args
node scripts/auto-merge.js --config base-config.json --verbose
```

### **2. Triple Output Mode** (`--triple`)

Generate **three versions** for comparison:
- **Left variant**: All changes from left side
- **Right variant**: All changes from right side
- **Auto variant**: Intelligently merged version

#### **File Merge Example**:
```bash
node scripts/auto-merge.js old.ts new.ts merged.ts --triple

# Creates:
# - merged.left.ts   (all from old.ts)
# - merged.right.ts  (all from new.ts)
# - merged.auto.ts   (intelligent merge)
```

#### **Directory Merge Example**:
```bash
node scripts/auto-merge.js src/old src/new src/merged --triple

# Creates:
# - src/merged-left/   (all from src/old)
# - src/merged-right/  (all from src/new)
# - src/merged-auto/   (intelligent merge)
```

#### **Benefits**:
- **Compare all three** versions side-by-side
- **Verify auto-merge** decisions
- **Manual review** easier with all options available
- **Rollback** to either original version if needed

### **3. Environment Variable Support**

Configure merge behavior via environment variables:

```bash
# Set default paths
export AUTO_MERGE_LEFT="src/version1"
export AUTO_MERGE_RIGHT="src/version2"
export AUTO_MERGE_OUTPUT="src/merged"

# Set options
export AUTO_MERGE_VERBOSE=true
export AUTO_MERGE_TRIPLE=true

# Run without arguments
node scripts/auto-merge.js
```

#### **Supported Variables**:
- `AUTO_MERGE_CONFIG` - Path to config file
- `AUTO_MERGE_LEFT` - Left input path
- `AUTO_MERGE_RIGHT` - Right input path
- `AUTO_MERGE_OUTPUT` - Output path
- `AUTO_MERGE_VERBOSE` - Enable verbose mode (true/false)
- `AUTO_MERGE_TRIPLE` - Enable triple output (true/false)

### **4. Directory-by-Side Merge**

New method `mergeDirectoryBySide()` allows selecting an entire side when both directories exist:

```javascript
merger.mergeDirectoryBySide(leftDir, rightDir, outputDir, 'left');
// Copies everything from left, with fallback to right for missing files

merger.mergeDirectoryBySide(leftDir, rightDir, outputDir, 'right');
// Copies everything from right, with fallback to left for missing files
```

This is used internally by triple mode to generate left/right variants.

### **5. Automatic Directory Creation**

The script now automatically creates parent directories:

```javascript
// Before: Would fail if parent doesn't exist
merger.mergeFiles('a.ts', 'b.ts', 'output/nested/merged.ts');

// Now: Automatically creates output/nested/ directory
```

### **6. Improved Path Handling**

- Resolves relative paths from current working directory
- Handles absolute paths correctly
- Creates missing parent directories
- Validates paths before processing

## 🚀 Usage Examples

### **Example 1: Simple Merge with Config**

Create `auto-merge.config.json`:
```json
{
  "options": {
    "verbose": true,
    "preferTypescript": true
  }
}
```

Run:
```bash
node scripts/auto-merge.js old.ts new.ts merged.ts
```

### **Example 2: Triple Output for Review**

```bash
node scripts/auto-merge.js \
  src/server/index.ts \
  src/server/index-refactored.ts \
  src/server/index-merged.ts \
  --triple --verbose

# Creates:
# - src/server/index-merged.left.ts   (original)
# - src/server/index-merged.right.ts  (refactored)
# - src/server/index-merged.auto.ts   (intelligent merge)
```

Then review all three in your editor to pick the best version.

### **Example 3: Environment-Based Workflow**

```bash
# Setup environment
export AUTO_MERGE_CONFIG="project-merge-config.json"
export AUTO_MERGE_VERBOSE=true
export AUTO_MERGE_TRIPLE=true

# Run merge (uses env vars)
node scripts/auto-merge.js feature-branch/src main-branch/src merged/src
```

### **Example 4: Windsurf Arena Mode Integration**

```bash
# 1. Export both columns from Windsurf to temp files
# 2. Run triple merge
node scripts/auto-merge.js \
  windsurf-left.ts \
  windsurf-right.ts \
  result.ts \
  --triple --verbose

# 3. Review all three versions:
# - result.left.ts   (Windsurf left column)
# - result.right.ts  (Windsurf right column)
# - result.auto.ts   (Intelligent merge)

# 4. Choose the best version or manually combine
```

### **Example 5: Config-Driven Batch Merge**

Create `batch-merge.config.json`:
```json
{
  "options": {
    "verbose": false,
    "triple": true,
    "preferNewer": true
  },
  "paths": {
    "left": "backup/2024-01-30",
    "right": "current",
    "output": "merged"
  }
}
```

Run:
```bash
node scripts/auto-merge.js --config batch-merge.config.json
```

## 🎯 Priority Order

Configuration is resolved in this order (later overrides earlier):

1. **Config file** (`auto-merge.config.json`)
2. **Environment variables** (`AUTO_MERGE_*`)
3. **CLI arguments** (positional and flags)

Example:
```bash
# Config says verbose=false
# ENV says AUTO_MERGE_VERBOSE=true
# CLI says --verbose
# Result: verbose=true (CLI wins)
```

## 📊 Triple Mode Output Structure

### **For Files**:
```
input:
  old.ts
  new.ts

output (--triple):
  merged.left.ts   ← All from old.ts
  merged.right.ts  ← All from new.ts
  merged.auto.ts   ← Intelligent merge
```

### **For Directories**:
```
input:
  src/old/
  src/new/

output (--triple):
  src/merged-left/   ← All from src/old/
  src/merged-right/  ← All from src/new/
  src/merged-auto/   ← Intelligent merge
```

## 🔧 Advanced Workflows

### **Workflow 1: Safe Merge with Review**

```bash
# Generate all three versions
node scripts/auto-merge.js old/ new/ merged/ --triple --verbose

# Review auto-merged version
code merged-auto/

# If auto-merge looks good, use it
cp -r merged-auto/* final/

# If not, manually pick from left/right variants
```

### **Workflow 2: Automated CI/CD Merge**

```yaml
# .github/workflows/auto-merge.yml
name: Auto-Merge Feature Branches

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Fetch base branch
        run: git fetch origin ${{ github.base_ref }}
      
      - name: Auto-merge
        run: |
          node scripts/auto-merge.js \
            origin/${{ github.base_ref }} \
            ${{ github.head_ref }} \
            merged-preview \
            --triple --verbose
      
      - name: Upload merge results
        uses: actions/upload-artifact@v4
        with:
          name: merge-preview
          path: merged-preview-*
```

### **Workflow 3: Config-Based Project Merges**

Create project-specific configs:

**frontend-merge.json**:
```json
{
  "options": {
    "preferTypescript": true,
    "preferShorter": true
  },
  "paths": {
    "left": "src/components/old",
    "right": "src/components/new",
    "output": "src/components/merged"
  }
}
```

**backend-merge.json**:
```json
{
  "options": {
    "preferTypescript": true,
    "preferShorter": false
  },
  "paths": {
    "left": "src/server/old",
    "right": "src/server/new",
    "output": "src/server/merged"
  }
}
```

Run:
```bash
node scripts/auto-merge.js --config frontend-merge.json --triple
node scripts/auto-merge.js --config backend-merge.json --triple
```

## 💡 Pro Tips

1. **Always use `--triple` for important merges** - Gives you all options to review
2. **Use `--verbose` to understand decisions** - Learn what the merger values
3. **Create project-specific configs** - Consistent merge behavior across team
4. **Combine with version control** - Commit before merging, easy rollback
5. **Review auto-merged output** - AI is smart but not perfect

## 🎊 Benefits of Enhancements

- ✅ **Repeatable**: Config files ensure consistent merges
- ✅ **Flexible**: Environment variables for CI/CD integration
- ✅ **Safe**: Triple mode lets you review all options
- ✅ **Automated**: Can run without arguments using config
- ✅ **Transparent**: Verbose mode shows decision-making
- ✅ **Robust**: Automatic directory creation prevents errors

---

**Status**: Enhanced auto-merge script ready for production use
**New Features**: Config files, triple output, env vars, directory-by-side
**Version**: 2.0.0

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>
