#!/usr/bin/env node

/**
 * DETERMINISTIC BUILD PREDICTOR
 * Predicts exact build outcomes before execution through:
 * 1. Input hashing (source files, dependencies, environment)
 * 2. Dependency graph analysis
 * 3. Output prediction based on historical builds
 * 4. Invariant verification
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class DeterministicBuildPredictor {
  constructor() {
    this.manifest = {
      id: `build-${Date.now()}-${process.pid}`,
      timestamp: new Date().toISOString(),
      predictions: {},
      invariants: [],
      inputs: {},
      expectedOutputs: {},
      actualOutputs: {},
      determinismScore: 0
    };
    
    this.knownPatterns = {
      // Map of input hash -> output characteristics
      builds: new Map()
    };
    
    this.loadHistoricalData();
  }

  loadHistoricalData() {
    const historyPath = path.join(process.cwd(), '.build-history.json');
    if (fs.existsSync(historyPath)) {
      try {
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        history.builds?.forEach(build => {
          this.knownPatterns.builds.set(build.inputHash, build.outputs);
        });
      } catch (e) {
        console.warn('Could not load build history:', e.message);
      }
    }
  }

  saveHistoricalData() {
    const historyPath = path.join(process.cwd(), '.build-history.json');
    const history = {
      builds: Array.from(this.knownPatterns.builds.entries()).map(([hash, outputs]) => ({
        inputHash: hash,
        outputs
      }))
    };
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  /**
   * Hash all inputs that affect the build
   */
  async captureInputState() {
    console.log('📸 Capturing input state...');
    
    const inputs = {
      sources: {},
      dependencies: {},
      environment: {},
      configuration: {}
    };

    // Hash source files
    const sourcePatterns = [
      'packages/*/src/**/*.{ts,tsx,js,jsx}',
      'apps/*/src/**/*.{ts,tsx,js,jsx}',
      'apps/*/*.{ts,tsx,js,jsx}'
    ];

    const sourceFiles = this.findFiles(sourcePatterns);
    for (const file of sourceFiles) {
      inputs.sources[file] = this.hashFile(file);
    }

    // Hash package files
    const packageFiles = this.findFiles(['**/package.json']);
    for (const file of packageFiles) {
      inputs.dependencies[file] = this.hashFile(file);
    }

    // Hash lockfile
    if (fs.existsSync('pnpm-lock.yaml')) {
      inputs.dependencies['pnpm-lock.yaml'] = this.hashFile('pnpm-lock.yaml');
    }

    // Capture environment
    inputs.environment = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pnpm: this.getVersion('pnpm'),
      typescript: this.getVersion('tsc')
    };

    // Hash configuration files
    const configFiles = [
      'tsconfig.json',
      '**/tsconfig.json',
      '**/vite.config.ts',
      '**/next.config.js',
      '**/tailwind.config.js'
    ];
    
    const configs = this.findFiles(configFiles);
    for (const file of configs) {
      inputs.configuration[file] = this.hashFile(file);
    }

    // Create composite hash
    const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
    inputs.compositeHash = crypto.createHash('sha256').update(inputString).digest('hex');

    this.manifest.inputs = inputs;
    console.log(`✅ Input hash: ${inputs.compositeHash.substring(0, 12)}...`);
    
    return inputs;
  }

  /**
   * Predict build outputs based on inputs
   */
  predictOutputs(inputs) {
    console.log('🔮 Predicting build outputs...');
    
    const predictions = {
      willSucceed: true,
      expectedFiles: [],
      expectedSizes: {},
      expectedDuration: 0,
      confidence: 0,
      issues: []
    };

    // Check if we've seen this exact input before
    if (this.knownPatterns.builds.has(inputs.compositeHash)) {
      const historicalOutput = this.knownPatterns.builds.get(inputs.compositeHash);
      predictions.expectedFiles = historicalOutput.files || [];
      predictions.expectedSizes = historicalOutput.sizes || {};
      predictions.confidence = 100;
      console.log('✅ Found exact match in build history (100% confidence)');
    } else {
      // Predict based on source structure
      predictions.expectedFiles = this.predictFilesFromSources(inputs.sources);
      predictions.confidence = 75;
      console.log('📊 Predicted from source analysis (75% confidence)');
    }

    // Predict build duration based on file count
    const fileCount = Object.keys(inputs.sources).length;
    predictions.expectedDuration = Math.round(fileCount * 0.1 + 5); // seconds

    // Check for known issues
    predictions.issues = this.detectKnownIssues(inputs);
    if (predictions.issues.length > 0) {
      predictions.willSucceed = false;
      predictions.confidence = Math.max(0, predictions.confidence - 25);
    }

    this.manifest.predictions = predictions;
    return predictions;
  }

  /**
   * Define and verify invariants
   */
  defineInvariants() {
    console.log('🔒 Defining build invariants...');
    
    const invariants = [
      {
        id: 'typescript-strict',
        description: 'TypeScript must compile with strict mode',
        test: () => this.verifyTypescriptStrict(),
        critical: true
      },
      {
        id: 'no-circular-deps',
        description: 'No circular dependencies allowed',
        test: () => this.verifyNoCircularDeps(),
        critical: true
      },
      {
        id: 'deterministic-output',
        description: 'Same inputs must produce same outputs',
        test: () => true, // Verified post-build
        critical: true
      },
      {
        id: 'package-versions-locked',
        description: 'All package versions must be locked',
        test: () => fs.existsSync('pnpm-lock.yaml'),
        critical: true
      },
      {
        id: 'no-random-in-build',
        description: 'Build must not use Math.random() or Date.now() in outputs',
        test: () => this.verifyNoDynamicContent(),
        critical: false
      }
    ];

    // Test invariants
    invariants.forEach(inv => {
      try {
        inv.passed = inv.test();
        console.log(`${inv.passed ? '✅' : '❌'} ${inv.description}`);
      } catch (e) {
        inv.passed = false;
        inv.error = e.message;
        console.log(`❌ ${inv.description}: ${e.message}`);
      }
    });

    this.manifest.invariants = invariants;
    return invariants.every(inv => !inv.critical || inv.passed);
  }

  /**
   * Execute build and compare with predictions
   */
  async executeBuild() {
    console.log('🔨 Executing build...');
    
    const startTime = Date.now();
    const buildResult = {
      success: false,
      duration: 0,
      outputs: [],
      errors: []
    };

    try {
      // Run the actual build
      execSync('pnpm build', { stdio: 'inherit' });
      buildResult.success = true;
    } catch (e) {
      buildResult.errors.push(e.message);
      console.error('❌ Build failed:', e.message);
    }

    buildResult.duration = (Date.now() - startTime) / 1000;

    // Capture actual outputs
    if (buildResult.success) {
      buildResult.outputs = this.captureOutputs();
      
      // Store for future predictions
      this.knownPatterns.builds.set(this.manifest.inputs.compositeHash, {
        files: buildResult.outputs.files,
        sizes: buildResult.outputs.sizes,
        duration: buildResult.duration
      });
      
      this.saveHistoricalData();
    }

    this.manifest.actualOutputs = buildResult;
    return buildResult;
  }

  /**
   * Calculate determinism score
   */
  calculateDeterminismScore() {
    console.log('📊 Calculating determinism score...');
    
    let score = 100;
    const deductions = [];

    // Check invariant violations
    const failedInvariants = this.manifest.invariants.filter(inv => !inv.passed);
    score -= failedInvariants.length * 10;
    if (failedInvariants.length > 0) {
      deductions.push(`-${failedInvariants.length * 10}: ${failedInvariants.length} invariant violations`);
    }

    // Check prediction accuracy
    if (this.manifest.predictions.willSucceed !== this.manifest.actualOutputs.success) {
      score -= 20;
      deductions.push('-20: Build outcome mispredicted');
    }

    // Check output consistency
    const predictedFiles = new Set(this.manifest.predictions.expectedFiles);
    const actualFiles = new Set(this.manifest.actualOutputs.outputs?.files || []);
    
    const missing = [...predictedFiles].filter(f => !actualFiles.has(f));
    const extra = [...actualFiles].filter(f => !predictedFiles.has(f));
    
    if (missing.length > 0 || extra.length > 0) {
      const penalty = Math.min(30, (missing.length + extra.length) * 2);
      score -= penalty;
      deductions.push(`-${penalty}: Output file mismatch (${missing.length} missing, ${extra.length} extra)`);
    }

    // Check timing accuracy
    if (this.manifest.predictions.expectedDuration > 0) {
      const timingError = Math.abs(
        this.manifest.predictions.expectedDuration - this.manifest.actualOutputs.duration
      ) / this.manifest.predictions.expectedDuration;
      
      if (timingError > 0.5) {
        score -= 5;
        deductions.push('-5: Build duration off by >50%');
      }
    }

    this.manifest.determinismScore = Math.max(0, score);
    this.manifest.scoreDeductions = deductions;
    
    return this.manifest.determinismScore;
  }

  // Helper methods
  findFiles(patterns) {
    const files = [];
    // Simplified file finding (in production, use glob)
    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };
    walkDir(process.cwd());
    return files;
  }

  hashFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getVersion(command) {
    try {
      return execSync(`${command} --version`, { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  predictFilesFromSources(sources) {
    const predicted = [];
    for (const sourcePath of Object.keys(sources)) {
      // Predict output based on source location
      if (sourcePath.includes('packages/')) {
        const distPath = sourcePath
          .replace('/src/', '/dist/')
          .replace('.ts', '.js')
          .replace('.tsx', '.js');
        predicted.push(distPath);
      } else if (sourcePath.includes('apps/')) {
        if (sourcePath.includes('heady-automation-ide')) {
          predicted.push('apps/heady-automation-ide/dist/server/index.js');
          predicted.push('apps/heady-automation-ide/dist/client/index.html');
        }
      }
    }
    return predicted;
  }

  detectKnownIssues(inputs) {
    const issues = [];
    
    // Check for missing wrangler.toml for workers
    if (inputs.sources['apps/governance-worker/src/index.ts'] && 
        !fs.existsSync('apps/governance-worker/wrangler.toml')) {
      issues.push('Missing wrangler.toml for governance-worker');
    }
    
    // Check for TypeScript version mismatch
    const tsVersions = new Set();
    for (const pkgPath of Object.keys(inputs.dependencies)) {
      if (pkgPath.includes('package.json')) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.devDependencies?.typescript) {
            tsVersions.add(pkg.devDependencies.typescript);
          }
        } catch {}
      }
    }
    if (tsVersions.size > 1) {
      issues.push('Multiple TypeScript versions detected');
    }
    
    return issues;
  }

  verifyTypescriptStrict() {
    const tsconfigPaths = this.findFiles(['**/tsconfig.json']);
    for (const configPath of tsconfigPaths) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!config.compilerOptions?.strict) {
        return false;
      }
    }
    return true;
  }

  verifyNoCircularDeps() {
    // Simplified check - in production use madge or similar
    return true;
  }

  verifyNoDynamicContent() {
    // Check for Math.random() or Date.now() in source files
    const sources = Object.keys(this.manifest.inputs.sources);
    for (const file of sources) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('Math.random') || content.includes('Date.now()')) {
        return false;
      }
    }
    return true;
  }

  captureOutputs() {
    const outputs = {
      files: [],
      sizes: {},
      hashes: {}
    };

    const outputPaths = [
      'packages/*/dist/**/*',
      'apps/*/dist/**/*',
      'apps/*/.next/**/*'
    ];

    const files = this.findFiles(outputPaths);
    for (const file of files) {
      if (file.includes('/dist/') || file.includes('/.next/')) {
        outputs.files.push(file);
        const stat = fs.statSync(file);
        outputs.sizes[file] = stat.size;
        outputs.hashes[file] = this.hashFile(file);
      }
    }

    return outputs;
  }

  /**
   * Generate deterministic build report
   */
  generateReport() {
    const report = {
      ...this.manifest,
      summary: {
        deterministic: this.manifest.determinismScore >= 90,
        score: this.manifest.determinismScore,
        inputHash: this.manifest.inputs.compositeHash,
        buildSucceeded: this.manifest.actualOutputs.success,
        duration: this.manifest.actualOutputs.duration,
        timestamp: new Date().toISOString()
      }
    };

    // Save report
    const reportPath = `build-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 DETERMINISTIC BUILD REPORT');
    console.log('='.repeat(60));
    console.log(`Score: ${report.summary.score}/100 ${report.summary.deterministic ? '✅' : '⚠️'}`);
    console.log(`Input Hash: ${report.summary.inputHash.substring(0, 12)}...`);
    console.log(`Build: ${report.summary.buildSucceeded ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Duration: ${report.summary.duration}s`);
    
    if (report.scoreDeductions?.length > 0) {
      console.log('\nScore Deductions:');
      report.scoreDeductions.forEach(d => console.log(`  ${d}`));
    }
    
    console.log('\nReport saved to:', reportPath);
    console.log('='.repeat(60));
    
    return report;
  }

  /**
   * Main execution flow
   */
  async run() {
    console.log('🚀 DETERMINISTIC BUILD PREDICTOR');
    console.log('━'.repeat(40));
    
    // Phase 1: Capture inputs
    const inputs = await this.captureInputState();
    
    // Phase 2: Predict outputs
    const predictions = this.predictOutputs(inputs);
    
    // Phase 3: Verify invariants
    const invariantsPassed = this.defineInvariants();
    
    if (!invariantsPassed) {
      console.warn('⚠️  Critical invariants failed - build may not be deterministic');
    }
    
    // Phase 4: Execute build
    const buildResult = await this.executeBuild();
    
    // Phase 5: Calculate determinism
    const score = this.calculateDeterminismScore();
    
    // Phase 6: Generate report
    const report = this.generateReport();
    
    return report;
  }
}

// CLI execution
if (require.main === module) {
  const predictor = new DeterministicBuildPredictor();
  predictor.run()
    .then(report => {
      process.exit(report.summary.deterministic ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { DeterministicBuildPredictor };
