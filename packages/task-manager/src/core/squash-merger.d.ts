export interface MergeOptions {
    preferNewer?: boolean;
    preferShorter?: boolean;
    preserveComments?: boolean;
    preferTypescript?: boolean;
    verbose?: boolean;
}
export interface QualityMetrics {
    hasTypes: boolean;
    hasComments: boolean;
    hasErrorHandling: boolean;
    hasLogging: boolean;
    lineCount: number;
    complexity: number;
    hasTests: boolean;
    hasDocumentation: boolean;
    score: number;
}
export interface ComparisonFactor {
    winner: 'left' | 'right';
    reason: string;
    weight: number;
}
export interface ComparisonDecision {
    winner: 'left' | 'right';
    leftScore: number;
    rightScore: number;
    factors: ComparisonFactor[];
    confidence: number;
}
export interface MergeResult {
    success: boolean;
    outputPath: string;
    blocksProcessed?: number;
    action?: string;
    error?: string;
    file?: string;
}
export declare class SquashMerger {
    private options;
    constructor(options?: MergeOptions);
    private ensureParentDir;
    copyPath(sourcePath: string, targetPath: string): void;
    analyzeQuality(code: string): QualityMetrics;
    calculateComplexity(code: string): number;
    compareVersions(left: string, right: string): ComparisonDecision;
    mergeFiles(leftPath: string, rightPath: string, outputPath: string): MergeResult;
    splitIntoBlocks(code: string): string[];
}
//# sourceMappingURL=squash-merger.d.ts.map