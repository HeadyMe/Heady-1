
import { z } from 'zod';

// --- Auth Schemas ---

export const UserRoleSchema = z.enum(['ADMIN', 'USER', 'GUEST', 'SYSTEM']);

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer')
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  role: UserRoleSchema,
  createdAt: z.date(),
  expiresAt: z.date(),
  lastActiveAt: z.date(),
  metadata: z.record(z.unknown()).default({})
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type Session = z.infer<typeof SessionSchema>;

// --- Session Manager Interface ---

export interface SessionManager {
  createSession(userId: string, role: z.infer<typeof UserRoleSchema>): Promise<Session>;
  validateSession(sessionId: string): Promise<Session | null>;
  refreshSession(sessionId: string): Promise<Session | null>;
  revokeSession(sessionId: string): Promise<void>;
  pruneExpiredSessions(): Promise<number>;
}
