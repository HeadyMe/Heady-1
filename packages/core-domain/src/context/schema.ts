
import { z } from 'zod';

// --- Context Pipeline Schemas ---

export const ContextSourceSchema = z.enum([
  'USER_INPUT',
  'SYSTEM_EVENT',
  'MEMORY_RECALL',
  'EXTERNAL_API',
  'FILE_CONTENT'
]);

export const ContextItemSchema = z.object({
  id: z.string().uuid(),
  source: ContextSourceSchema,
  content: z.unknown(),
  timestamp: z.date(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).default({})
});

export type ContextItem = z.infer<typeof ContextItemSchema>;

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  sanitizedContext: z.unknown().optional()
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// --- Pipeline Interfaces ---

export interface ContextExtractor {
  extract(input: unknown, source: z.infer<typeof ContextSourceSchema>): Promise<ContextItem[]>;
}

export interface ContextValidator {
  validate(context: ContextItem): Promise<ValidationResult>;
}

export interface DeterministicPipeline {
  process(input: unknown): Promise<{
    context: ContextItem[];
    validation: ValidationResult;
    deterministicHash: string; // Hash of the validated context to ensure reproducibility
  }>;
}

// --- Implementation Helpers ---

export function generateContextHash(context: ContextItem[]): string {
  // Simple deterministic hash generation (placeholder)
  const sorted = [...context].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(sorted.map(c => ({ id: c.id, content: c.content })));
}
