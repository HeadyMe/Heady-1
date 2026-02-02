
import { z } from 'zod';

// --- System Component Protocol (SCP) Schema ---

export const ComponentTypeSchema = z.enum([
  'WIDGET',
  'PANEL',
  'NOTIFICATION',
  'ACTION',
  'LAYOUT'
]);

export const ComponentStateSchema = z.enum([
  'LOADING',
  'READY',
  'ERROR',
  'STALE'
]);

export const ComponentMetadataSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: ComponentTypeSchema,
  author: z.string().default('system'),
  permissions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

export const ComponentDataSchema = z.record(z.unknown());

export const SystemComponentSchema = z.object({
  metadata: ComponentMetadataSchema,
  state: ComponentStateSchema,
  data: ComponentDataSchema,
  template: z.string().optional(), // Handlebars/Mustache or serialized React/Vue template
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    handler: z.string() // Function reference or API endpoint
  })).default([]),
  refreshPolicy: z.object({
    strategy: z.enum(['PUSH', 'POLL', 'MANUAL']),
    intervalMs: z.number().optional()
  }).default({ strategy: 'PUSH' })
});

export type SystemComponent = z.infer<typeof SystemComponentSchema>;
export type ComponentMetadata = z.infer<typeof ComponentMetadataSchema>;

// --- Component Registry Interface ---

export interface ComponentRegistry {
  register(component: SystemComponent): Promise<void>;
  get(id: string): Promise<SystemComponent | null>;
  list(filter?: Partial<ComponentMetadata>): Promise<SystemComponent[]>;
  updateState(id: string, state: z.infer<typeof ComponentStateSchema>): Promise<void>;
  updateData(id: string, data: Record<string, unknown>): Promise<void>;
}

// --- Deterministic Validation ---

export function validateComponent(component: unknown): { valid: boolean; errors?: z.ZodError } {
  const result = SystemComponentSchema.safeParse(component);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, errors: result.error };
}
