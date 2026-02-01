#!/usr/bin/env node

/**
 * Intelligent Auto-Merge Script for Windsurf Arena Mode
 * Analyzes and merges changes based on code quality, functionality, and consistency
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG_FILES = ['auto-merge.config.json', 'auto-merge.json', '.auto-merge.json'];

const parseEnvBool = (value) => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
};

const resolveConfigPath = (explicitPath) => {
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(process.cwd(), explicitPath);
    return fs.existsSync(resolved) ? resolved : null;
  }

  const envPath = process.env.AUTO_MERGE_CONFIG;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(resolved)) return resolved;
  }

  for (const filename of DEFAULT_CONFIG_FILES) {
    const candidate = path.resolve(process.cwd(), filename);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
};

const loadConfig = (explicitPath) => {
  const configPath = resolveConfigPath(explicitPath);
  if (!configPath) return { config: null, configPath: null };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return { config: JSON.parse(raw), configPath };
  } catch (error) {
    console.error(`❌ Failed to load config: ${configPath}`);
    console.error(error.message);
    process.exit(1);
  }
};

class IntelligentMerger {
  constructor(options = {}) {
    this.options = {
      preferNewer: options.preferNewer ?? true,
      preferShorter: options.preferShorter ?? false,
      preserveComments: options.preserveComments ?? true,
      preferTypescript: options.preferTypescript ?? true,
      verbose: options.verbose ?? false,
      ...options,
    };
  }

  ensureParentDir(targetPath) {
    const dir = path.dirname(targetPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  copyPath(sourcePath, targetPath) {
    if (path.resolve(sourcePath) === path.resolve(targetPath)) {
      return;
    }

    const stat = fs.statSync(sourcePath);
    this.ensureParentDir(targetPath);
    if (stat.isDirectory()) {
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  /**
   * Analyze code quality metrics
   */
  analyzeQuality(code) {
    const metrics = {
      hasTypes: /:\s*\w+/.test(code), // TypeScript type annotations
      hasComments: /\/\/|\/\*/.test(code),
      hasErrorHandling: /try|catch|throw/.test(code),
      hasLogging: /console\.|logger\.|log/.test(code),
      lineCount: code.split('\n').length,
      complexity: this.calculateComplexity(code),
      hasTests: /test|describe|it\(|expect/.test(code),
      hasDocumentation: /\/\*\*/.test(code),
    };

    // Calculate quality score
    let score = 0;
    if (metrics.hasTypes) score += 20;
    if (metrics.hasComments) score += 10;
    if (metrics.hasErrorHandling) score += 15;
    if (metrics.hasLogging) score += 10;
    if (metrics.hasTests) score += 20;
    if (metrics.hasDocumentation) score += 15;
    if (metrics.complexity < 10) score += 10;

    metrics.score = score;
    return metrics;
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   */
  calculateComplexity(code) {
    const patterns = [
      /if\s*\(/g,
      /else\s+if/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\?\s*.*\s*:/g, // ternary
      /&&|\|\|/g, // logical operators
    ];

    let complexity = 1;
    patterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  /**
   * Compare two code versions and decide which is better
   */
  compareVersions(left, right, context = {}) {
    const leftMetrics = this.analyzeQuality(left);
    const rightMetrics = this.analyzeQuality(right);

    if (this.options.verbose) {
      console.log('Left metrics:', leftMetrics);
      console.log('Right metrics:', rightMetrics);
    }

    // Decision factors
    const factors = [];

    // Quality score
    if (leftMetrics.score > rightMetrics.score) {
      factors.push({ winner: 'left', reason: 'Higher quality score', weight: 3 });
    } else if (rightMetrics.score > leftMetrics.score) {
      factors.push({ winner: 'right', reason: 'Higher quality score', weight: 3 });
    }

    // TypeScript preference
    if (this.options.preferTypescript) {
      if (leftMetrics.hasTypes && !rightMetrics.hasTypes) {
        factors.push({ winner: 'left', reason: 'Has TypeScript types', weight: 2 });
      } else if (rightMetrics.hasTypes && !leftMetrics.hasTypes) {
        factors.push({ winner: 'right', reason: 'Has TypeScript types', weight: 2 });
      }
    }

    // Error handling
    if (leftMetrics.hasErrorHandling && !rightMetrics.hasErrorHandling) {
      factors.push({ winner: 'left', reason: 'Has error handling', weight: 2 });
    } else if (rightMetrics.hasErrorHandling && !leftMetrics.hasErrorHandling) {
      factors.push({ winner: 'right', reason: 'Has error handling', weight: 2 });
    }

    // Documentation
    if (leftMetrics.hasDocumentation && !rightMetrics.hasDocumentation) {
      factors.push({ winner: 'left', reason: 'Has documentation', weight: 1 });
    } else if (rightMetrics.hasDocumentation && !leftMetrics.hasDocumentation) {
      factors.push({ winner: 'right', reason: 'Has documentation', weight: 1 });
    }

    // Complexity (lower is better)
    if (leftMetrics.complexity < rightMetrics.complexity - 2) {
      factors.push({ winner: 'left', reason: 'Lower complexity', weight: 2 });
    } else if (rightMetrics.complexity < leftMetrics.complexity - 2) {
      factors.push({ winner: 'right', reason: 'Lower complexity', weight: 2 });
    }

    // Calculate weighted score
    let leftScore = 0;
    let rightScore = 0;

    factors.forEach((factor) => {
      if (factor.winner === 'left') leftScore += factor.weight;
      if (factor.winner === 'right') rightScore += factor.weight;
    });

    // Prefer newer if scores are equal
    if (leftScore === rightScore && this.options.preferNewer) {
      factors.push({ winner: 'right', reason: 'Newer version (tie-breaker)', weight: 1 });
      rightScore += 1;
    }

    const decision = {
      winner: leftScore > rightScore ? 'left' : 'right',
      leftScore,
      rightScore,
      factors,
      confidence: Math.abs(leftScore - rightScore) / Math.max(leftScore, rightScore, 1),
    };

    if (this.options.verbose) {
      console.log('Decision:', decision);
    }

    return decision;
  }

  /**
   * Merge two files intelligently
   */
  mergeFiles(leftPath, rightPath, outputPath) {
    const left = fs.readFileSync(leftPath, 'utf-8');
    const right = fs.readFileSync(rightPath, 'utf-8');

    this.ensureParentDir(outputPath);

    // Split into logical blocks (functions, classes, etc.)
    const leftBlocks = this.splitIntoBlocks(left);
    const rightBlocks = this.splitIntoBlocks(right);

    const mergedBlocks = [];

    // Merge block by block
    const maxBlocks = Math.max(leftBlocks.length, rightBlocks.length);
    for (let i = 0; i < maxBlocks; i++) {
      const leftBlock = leftBlocks[i] || '';
      const rightBlock = rightBlocks[i] || '';

      if (!leftBlock) {
        mergedBlocks.push(rightBlock);
      } else if (!rightBlock) {
        mergedBlocks.push(leftBlock);
      } else if (leftBlock === rightBlock) {
        mergedBlocks.push(leftBlock);
      } else {
        const decision = this.compareVersions(leftBlock, rightBlock);
        mergedBlocks.push(decision.winner === 'left' ? leftBlock : rightBlock);

        if (this.options.verbose) {
          console.log(`Block ${i}: Chose ${decision.winner} (confidence: ${decision.confidence.toFixed(2)})`);
          console.log(`Reasons: ${decision.factors.map((f) => f.reason).join(', ')}`);
        }
      }
    }

    const merged = mergedBlocks.join('\n');
    fs.writeFileSync(outputPath, merged, 'utf-8');

    return {
      success: true,
      outputPath,
      blocksProcessed: maxBlocks,
    };
  }

  /**
   * Split code into logical blocks
   */
  splitIntoBlocks(code) {
    // Split by function/class declarations or significant blank lines
    const blocks = [];
    const lines = code.split('\n');
    let currentBlock = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for block boundaries
      const isBlockBoundary =
        /^(export\s+)?(async\s+)?function\s+/.test(line) ||
        /^(export\s+)?class\s+/.test(line) ||
        /^(export\s+)?interface\s+/.test(line) ||
        /^(export\s+)?type\s+/.test(line) ||
        /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/.test(line);

      if (isBlockBoundary && currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks;
  }

  /**
   * Merge directory recursively
   */
  mergeDirectory(leftDir, rightDir, outputDir, options = {}) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const leftFiles = fs.readdirSync(leftDir);
    const rightFiles = fs.readdirSync(rightDir);
    const allFiles = new Set([...leftFiles, ...rightFiles]);

    const results = [];

    for (const file of allFiles) {
      const leftPath = path.join(leftDir, file);
      const rightPath = path.join(rightDir, file);
      const outputPath = path.join(outputDir, file);

      const leftExists = fs.existsSync(leftPath);
      const rightExists = fs.existsSync(rightPath);

      if (leftExists && rightExists) {
        const leftStat = fs.statSync(leftPath);
        const rightStat = fs.statSync(rightPath);

        if (leftStat.isDirectory() && rightStat.isDirectory()) {
          // Recurse into directories
          const subResults = this.mergeDirectory(leftPath, rightPath, outputPath, options);
          results.push(...subResults);
        } else if (leftStat.isFile() && rightStat.isFile()) {
          // Merge files
          try {
            const result = this.mergeFiles(leftPath, rightPath, outputPath);
            results.push({ file, ...result });
          } catch (error) {
            results.push({ file, success: false, error: error.message });
          }
        }
      } else if (leftExists) {
        // Only in left, copy to output
        this.copyPath(leftPath, outputPath);
        results.push({ file, success: true, action: 'copied from left' });
      } else if (rightExists) {
        // Only in right, copy to output
        this.copyPath(rightPath, outputPath);
        results.push({ file, success: true, action: 'copied from right' });
      }
    }

    return results;
  }

  /**
   * Merge directory by selecting an entire side when both exist
   */
  mergeDirectoryBySide(leftDir, rightDir, outputDir, side) {
    const results = [];
    const leftExists = fs.existsSync(leftDir);
    const rightExists = fs.existsSync(rightDir);

    if (!leftExists && !rightExists) {
      return results;
    }

    if (!leftExists) {
      this.copyPath(rightDir, outputDir);
      results.push({ file: path.basename(outputDir), success: true, action: 'copied from right' });
      return results;
    }

    if (!rightExists) {
      this.copyPath(leftDir, outputDir);
      results.push({ file: path.basename(outputDir), success: true, action: 'copied from left' });
      return results;
    }

    const leftStat = fs.statSync(leftDir);
    const rightStat = fs.statSync(rightDir);

    if (!leftStat.isDirectory() || !rightStat.isDirectory()) {
      const preferredPath = side === 'left' ? leftDir : rightDir;
      const fallbackPath = side === 'left' ? rightDir : leftDir;
      const preferredExists = fs.existsSync(preferredPath);
      const chosenPath = preferredExists ? preferredPath : fallbackPath;
      const chosenSource = preferredExists ? side : side === 'left' ? 'right' : 'left';
      this.copyPath(chosenPath, outputDir);
      results.push({ file: path.basename(outputDir), success: true, action: `copied from ${chosenSource}` });
      return results;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const leftFiles = fs.readdirSync(leftDir);
    const rightFiles = fs.readdirSync(rightDir);
    const allFiles = new Set([...leftFiles, ...rightFiles]);

    for (const file of allFiles) {
      const leftPath = path.join(leftDir, file);
      const rightPath = path.join(rightDir, file);
      const outputPath = path.join(outputDir, file);

      const leftPathExists = fs.existsSync(leftPath);
      const rightPathExists = fs.existsSync(rightPath);

      const preferredPath = side === 'left' ? leftPath : rightPath;
      const fallbackPath = side === 'left' ? rightPath : leftPath;
      const preferredExists = fs.existsSync(preferredPath);
      const fallbackExists = fs.existsSync(fallbackPath);

      if (!preferredExists && !fallbackExists) {
        continue;
      }

      const chosenPath = preferredExists ? preferredPath : fallbackPath;
      const chosenSource = preferredExists ? side : side === 'left' ? 'right' : 'left';
      const chosenStat = fs.statSync(chosenPath);
      const fallbackStat = fallbackExists ? fs.statSync(fallbackPath) : null;

      if (chosenStat.isDirectory() && fallbackStat?.isDirectory()) {
        const subResults = this.mergeDirectoryBySide(leftPath, rightPath, outputPath, side);
        results.push(...subResults);
      } else {
        this.copyPath(chosenPath, outputPath);
        results.push({ file, success: true, action: `copied from ${chosenSource}` });
      }
    }

    return results;
  }
}

// CLI Interface
if (require.main === module) {
  const rawArgs = process.argv.slice(2);
  let configPathArg;
  const args = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '--config') {
      configPathArg = rawArgs[i + 1];
      i += 1;
      continue;
    }
    args.push(arg);
  }

  const optionArgs = new Set(args.filter((arg) => arg.startsWith('--')));
  const positionalArgs = args.filter((arg) => !arg.startsWith('--'));

  const { config, configPath } = loadConfig(configPathArg);
  const configOptions = config?.options ?? {};
  const configPaths = config?.paths ?? {};

  const envVerbose = parseEnvBool(process.env.AUTO_MERGE_VERBOSE);
  const envTriple = parseEnvBool(process.env.AUTO_MERGE_TRIPLE);

  const options = {
    verbose: configOptions.verbose ?? false,
    triple: configOptions.triple ?? false,
    preferNewer: configOptions.preferNewer ?? true,
    preferShorter: configOptions.preferShorter ?? false,
    preferTypescript: configOptions.preferTypescript ?? true,
  };

  if (configOptions.preferOlder === true) {
    options.preferNewer = false;
  }

  if (envVerbose !== undefined) options.verbose = envVerbose;
  if (envTriple !== undefined) options.triple = envTriple;

  if (optionArgs.has('--verbose')) options.verbose = true;
  if (optionArgs.has('--triple')) options.triple = true;
  if (optionArgs.has('--prefer-older')) options.preferNewer = false;
  if (optionArgs.has('--prefer-shorter')) options.preferShorter = true;
  if (optionArgs.has('--no-types')) options.preferTypescript = false;

  let [leftPath, rightPath, outputPath] = positionalArgs;
  leftPath =
    leftPath ||
    config?.leftPath ||
    config?.left ||
    configPaths.left ||
    process.env.AUTO_MERGE_LEFT;
  rightPath =
    rightPath ||
    config?.rightPath ||
    config?.right ||
    configPaths.right ||
    process.env.AUTO_MERGE_RIGHT;
  outputPath =
    outputPath ||
    config?.outputPath ||
    config?.output ||
    configPaths.output ||
    process.env.AUTO_MERGE_OUTPUT;

  if (!leftPath || !rightPath || !outputPath) {
    console.log('Usage: node auto-merge.js <left-path> <right-path> <output-path> [options]');
    console.log('Options:');
    console.log('  --config <path>     Load defaults from a config JSON file');
    console.log('  --verbose           Show detailed decision making');
    console.log('  --triple            Emit left/right/auto variants');
    console.log('  --prefer-older      Prefer older version on ties');
    console.log('  --prefer-shorter    Prefer shorter code');
    console.log('  --no-types          Don\'t prefer TypeScript');
    console.log('');
    console.log('Defaults can also come from:');
    console.log('  AUTO_MERGE_LEFT / AUTO_MERGE_RIGHT / AUTO_MERGE_OUTPUT');
    console.log('  AUTO_MERGE_VERBOSE=true | AUTO_MERGE_TRIPLE=true');
    process.exit(1);
  }

  const merger = new IntelligentMerger(options);

  console.log('🔄 Intelligent Auto-Merge Starting...');
  if (configPath) {
    console.log(`   Config: ${configPath}`);
  }
  console.log(`   Left:   ${leftPath}`);
  console.log(`   Right:  ${rightPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log('');

  try {
    const leftStat = fs.statSync(leftPath);
    const rightStat = fs.statSync(rightPath);

    let results;
    const isDirectoryMerge = leftStat.isDirectory() && rightStat.isDirectory();
    const isFileMerge = leftStat.isFile() && rightStat.isFile();

    if (!isDirectoryMerge && !isFileMerge) {
      console.error('❌ Both paths must be either files or directories');
      process.exit(1);
    }

    if (options.triple) {
      const parsed = path.parse(outputPath);
      const basePath = path.join(parsed.dir, parsed.name || parsed.base);
      const variantPaths = isDirectoryMerge
        ? {
            left: `${outputPath}-left`,
            right: `${outputPath}-right`,
            auto: `${outputPath}-auto`,
          }
        : {
            left: `${basePath}.left${parsed.ext}`,
            right: `${basePath}.right${parsed.ext}`,
            auto: `${basePath}.auto${parsed.ext}`,
          };

      console.log('📦 Triple output enabled:');
      console.log(`   Left : ${variantPaths.left}`);
      console.log(`   Right: ${variantPaths.right}`);
      console.log(`   Auto : ${variantPaths.auto}`);

      if (isDirectoryMerge) {
        merger.mergeDirectoryBySide(leftPath, rightPath, variantPaths.left, 'left');
        merger.mergeDirectoryBySide(leftPath, rightPath, variantPaths.right, 'right');
        results = merger.mergeDirectory(leftPath, rightPath, variantPaths.auto, options);
        console.log(`✅ Auto merged ${results.length} files`);
        const successful = results.filter((r) => r.success).length;
        console.log(`   Success: ${successful}/${results.length}`);
      } else {
        merger.copyPath(leftPath, variantPaths.left);
        merger.copyPath(rightPath, variantPaths.right);
        const result = merger.mergeFiles(leftPath, rightPath, variantPaths.auto);
        console.log(`✅ Auto merged file: ${result.outputPath}`);
        console.log(`   Blocks processed: ${result.blocksProcessed}`);
      }
    } else if (isDirectoryMerge) {
      results = merger.mergeDirectory(leftPath, rightPath, outputPath, options);
      console.log(`✅ Merged ${results.length} files`);
      const successful = results.filter((r) => r.success).length;
      console.log(`   Success: ${successful}/${results.length}`);
    } else {
      const result = merger.mergeFiles(leftPath, rightPath, outputPath);
      console.log(`✅ Merged file: ${result.outputPath}`);
      console.log(`   Blocks processed: ${result.blocksProcessed}`);
    }
  } catch (error) {
    console.error('❌ Merge failed:', error.message);
    process.exit(1);
  }
}

module.exports = { IntelligentMerger };
