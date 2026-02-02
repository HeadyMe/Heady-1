import * as fs from 'fs';
import * as path from 'path';
export class SquashMerger {
    options;
    constructor(options = {}) {
        this.options = {
            preferNewer: true,
            preferShorter: false,
            preserveComments: true,
            preferTypescript: true,
            verbose: false,
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
        const stat = fs.statSync(sourcePath);
        this.ensureParentDir(targetPath);
        if (stat.isDirectory()) {
            fs.cpSync(sourcePath, targetPath, { recursive: true });
        }
        else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
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
            score: 0
        };
        // Calculate quality score
        let score = 0;
        if (metrics.hasTypes)
            score += 20;
        if (metrics.hasComments)
            score += 10;
        if (metrics.hasErrorHandling)
            score += 15;
        if (metrics.hasLogging)
            score += 10;
        if (metrics.hasTests)
            score += 20;
        if (metrics.hasDocumentation)
            score += 15;
        if (metrics.complexity < 10)
            score += 10;
        metrics.score = score;
        return metrics;
    }
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
            if (matches)
                complexity += matches.length;
        });
        return complexity;
    }
    compareVersions(left, right) {
        const leftMetrics = this.analyzeQuality(left);
        const rightMetrics = this.analyzeQuality(right);
        const factors = [];
        // Quality score
        if (leftMetrics.score > rightMetrics.score) {
            factors.push({ winner: 'left', reason: 'Higher quality score', weight: 3 });
        }
        else if (rightMetrics.score > leftMetrics.score) {
            factors.push({ winner: 'right', reason: 'Higher quality score', weight: 3 });
        }
        // TypeScript preference
        if (this.options.preferTypescript) {
            if (leftMetrics.hasTypes && !rightMetrics.hasTypes) {
                factors.push({ winner: 'left', reason: 'Has TypeScript types', weight: 2 });
            }
            else if (rightMetrics.hasTypes && !leftMetrics.hasTypes) {
                factors.push({ winner: 'right', reason: 'Has TypeScript types', weight: 2 });
            }
        }
        // Error handling
        if (leftMetrics.hasErrorHandling && !rightMetrics.hasErrorHandling) {
            factors.push({ winner: 'left', reason: 'Has error handling', weight: 2 });
        }
        else if (rightMetrics.hasErrorHandling && !leftMetrics.hasErrorHandling) {
            factors.push({ winner: 'right', reason: 'Has error handling', weight: 2 });
        }
        // Documentation
        if (leftMetrics.hasDocumentation && !rightMetrics.hasDocumentation) {
            factors.push({ winner: 'left', reason: 'Has documentation', weight: 1 });
        }
        else if (rightMetrics.hasDocumentation && !leftMetrics.hasDocumentation) {
            factors.push({ winner: 'right', reason: 'Has documentation', weight: 1 });
        }
        // Complexity (lower is better)
        if (leftMetrics.complexity < rightMetrics.complexity - 2) {
            factors.push({ winner: 'left', reason: 'Lower complexity', weight: 2 });
        }
        else if (rightMetrics.complexity < leftMetrics.complexity - 2) {
            factors.push({ winner: 'right', reason: 'Lower complexity', weight: 2 });
        }
        // Calculate weighted score
        let leftScore = 0;
        let rightScore = 0;
        factors.forEach((factor) => {
            if (factor.winner === 'left')
                leftScore += factor.weight;
            if (factor.winner === 'right')
                rightScore += factor.weight;
        });
        // Prefer newer if scores are equal (simulated by preference flag)
        if (leftScore === rightScore && this.options.preferNewer) {
            factors.push({ winner: 'right', reason: 'Newer version (tie-breaker)', weight: 1 });
            rightScore += 1;
        }
        return {
            winner: leftScore > rightScore ? 'left' : 'right',
            leftScore,
            rightScore,
            factors,
            confidence: Math.abs(leftScore - rightScore) / Math.max(leftScore, rightScore, 1),
        };
    }
    mergeFiles(leftPath, rightPath, outputPath) {
        const left = fs.readFileSync(leftPath, 'utf-8');
        const right = fs.readFileSync(rightPath, 'utf-8');
        this.ensureParentDir(outputPath);
        // Split into logical blocks
        const leftBlocks = this.splitIntoBlocks(left);
        const rightBlocks = this.splitIntoBlocks(right);
        const mergedBlocks = [];
        const maxBlocks = Math.max(leftBlocks.length, rightBlocks.length);
        for (let i = 0; i < maxBlocks; i++) {
            const leftBlock = leftBlocks[i] || '';
            const rightBlock = rightBlocks[i] || '';
            if (!leftBlock) {
                mergedBlocks.push(rightBlock);
            }
            else if (!rightBlock) {
                mergedBlocks.push(leftBlock);
            }
            else if (leftBlock === rightBlock) {
                mergedBlocks.push(leftBlock);
            }
            else {
                const decision = this.compareVersions(leftBlock, rightBlock);
                mergedBlocks.push(decision.winner === 'left' ? leftBlock : rightBlock);
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
    splitIntoBlocks(code) {
        const blocks = [];
        const lines = code.split('\n');
        let currentBlock = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check for block boundaries
            const isBlockBoundary = /^(export\s+)?(async\s+)?function\s+/.test(line) ||
                /^(export\s+)?class\s+/.test(line) ||
                /^(export\s+)?interface\s+/.test(line) ||
                /^(export\s+)?type\s+/.test(line) ||
                /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/.test(line);
            if (isBlockBoundary && currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [line];
            }
            else {
                currentBlock.push(line);
            }
        }
        if (currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'));
        }
        return blocks;
    }
}
//# sourceMappingURL=squash-merger.js.map