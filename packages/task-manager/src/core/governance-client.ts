import { EventEmitter } from 'events';

export interface Concept {
  id: string;
  name: string;
  description: string;
  tags: string[];
  status: 'proposed' | 'implemented' | 'successful' | 'failed' | 'optimizing';
  successMetrics: {
    performance: number;
    reliability: number;
    adoption: number;
    score: number;
  };
  implementationDetails: string;
  source: 'internal' | 'external_scan' | 'evolution';
}

export interface GovernanceStandard {
  id: string;
  category: string;
  name: string;
  description: string;
  rules: any[];
  version: string;
  status: string;
}

export interface ComplianceReport {
  systemId: string;
  timestamp: number;
  standardsVersion: string;
  results: any[];
  overallScore: number;
}

export class GovernanceClient extends EventEmitter {
  private workerUrl: string;
  private actorId: string;

  constructor(workerUrl: string = 'http://localhost:8787', actorId: string = 'heady-system-v1') {
    super();
    this.workerUrl = workerUrl;
    this.actorId = actorId;
  }

  async submitConcept(concept: Concept): Promise<any> {
    try {
      const response = await fetch(`${this.workerUrl}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-ID': this.actorId
        },
        body: JSON.stringify(concept)
      });
      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async submitComplianceReport(report: ComplianceReport): Promise<any> {
    try {
      const response = await fetch(`${this.workerUrl}/protocol/compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-ID': this.actorId
        },
        body: JSON.stringify(report)
      });
      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getStandards(): Promise<GovernanceStandard[]> {
    try {
      const response = await fetch(`${this.workerUrl}/protocol/standards`);
      if (!response.ok) throw new Error(`Failed to fetch standards: ${response.statusText}`);
      return await response.json() as GovernanceStandard[];
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }

  async triggerDeepScan(conceptId: string): Promise<any> {
    try {
      const response = await fetch(`${this.workerUrl}/trigger-scan/${conceptId}`, {
        method: 'POST',
        headers: {
          'X-Actor-ID': this.actorId
        }
      });
      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}
