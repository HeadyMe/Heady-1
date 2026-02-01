// HeadySystems Core Domain Types and Logic

// Re-export context module
export * from './context/index.js';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  organizationId: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  status: ProjectStatus;
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: Priority;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AutomationTask extends Task {
  automationType: AutomationType;
  config: Record<string, unknown>;
}

export enum AutomationType {
  BROWSER_HEADLESS = 'BROWSER_HEADLESS',
  BROWSER_INTERACTIVE = 'BROWSER_INTERACTIVE',
  API_CALL = 'API_CALL',
  SCHEDULED = 'SCHEDULED'
}

// Utility functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
