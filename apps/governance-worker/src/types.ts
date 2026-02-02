export interface Concept {
  id: string;
  name: string;
  description: string;
  tags: string[];
  status: 'proposed' | 'implemented' | 'successful' | 'failed' | 'optimizing';
  successMetrics: {
    performance: number; // 0-100
    reliability: number; // 0-100
    adoption: number; // 0-100
    score: number; // Calculated aggregate
  };
  implementationDetails: string;
  source: 'internal' | 'external_scan' | 'evolution';
  originalSourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GovernanceDecision {
  conceptId: string;
  decision: 'approve' | 'reject' | 'optimize' | 'scan_alternatives';
  reasoning: string;
  recommendedActions: string[];
  timestamp: number;
}

export interface ScanResult {
  source: string;
  conceptMatchScore: number;
  implementationQuality: number;
  details: string;
  url: string;
}

// --- Centralized Governance Protocol Types ---

export interface GovernanceStandard {
  id: string;
  category: 'security' | 'performance' | 'architecture' | 'code_quality';
  name: string;
  description: string;
  rules: GovernanceRule[];
  version: string;
  status: 'active' | 'deprecated' | 'draft';
  lastUpdated: number;
}

export interface GovernanceRule {
  id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  validationLogic?: string; // Pseudocode or reference to validator
  automated: boolean;
}

export interface ComplianceReport {
  systemId: string;
  timestamp: number;
  standardsVersion: string;
  results: {
    standardId: string;
    compliant: boolean;
    issues: string[];
    score: number;
  }[];
  overallScore: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: 'create_standard' | 'update_standard' | 'compliance_check' | 'system_change';
  details: any;
  hash: string; // For deterministic chain integrity
  previousHash: string;
}
