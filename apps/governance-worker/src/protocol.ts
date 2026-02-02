import { GovernanceStandard, GovernanceRule, ComplianceReport, AuditLogEntry } from './types';
import type { KVNamespace } from '@cloudflare/workers-types';

export class GovernanceProtocolManager {
  constructor(private kv: KVNamespace) {}

  /**
   * Registers or updates a Governance Standard.
   * Maintains a deterministic audit log of the change.
   */
  async registerStandard(standard: GovernanceStandard, actor: string): Promise<string> {
    // 1. Validate Standard Structure
    if (!standard.id || !standard.name || !standard.rules || standard.rules.length === 0) {
      throw new Error("Invalid Standard: Missing required fields or rules.");
    }

    // 2. Check if standard exists to determine action type
    const existing = await this.kv.get(`standard:${standard.id}`);
    const action = existing ? 'update_standard' : 'create_standard';

    // 3. Save Standard
    standard.lastUpdated = Date.now();
    await this.kv.put(`standard:${standard.id}`, JSON.stringify(standard));

    // 4. Create Audit Log Entry (Deterministic State)
    return this.logAction(actor, action, standard);
  }

  /**
   * Retrieves a specific standard by ID.
   */
  async getStandard(id: string): Promise<GovernanceStandard | null> {
    const data = await this.kv.get(`standard:${id}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Retrieves all active standards.
   */
  async listStandards(): Promise<GovernanceStandard[]> {
    const list = await this.kv.list({ prefix: 'standard:' });
    const standards: GovernanceStandard[] = [];
    
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        standards.push(JSON.parse(data));
      }
    }
    
    return standards.filter(s => s.status === 'active');
  }

  /**
   * Records a compliance check result.
   */
  async recordCompliance(report: ComplianceReport, actor: string): Promise<string> {
    // Save report
    const key = `compliance:${report.systemId}:${report.timestamp}`;
    await this.kv.put(key, JSON.stringify(report));

    // Log action
    return this.logAction(actor, 'compliance_check', {
      systemId: report.systemId,
      overallScore: report.overallScore,
      timestamp: report.timestamp
    });
  }

  /**
   * Core function to maintain deterministic state via Audit Logs.
   * Links each new log to the previous one via hash.
   */
  private async logAction(actor: string, action: AuditLogEntry['action'], details: any): Promise<string> {
    // Get the latest log hash
    const headHash = await this.kv.get('audit:head') || 'GENESIS_HASH';

    const timestamp = Date.now();
    const entryId = crypto.randomUUID();

    // Calculate Hash: SHA-256(prevHash + timestamp + actor + action + JSON(details))
    const dataToHash = `${headHash}|${timestamp}|${actor}|${action}|${JSON.stringify(details)}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataToHash));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const entry: AuditLogEntry = {
      id: entryId,
      timestamp,
      actor,
      action,
      details,
      hash,
      previousHash: headHash
    };

    // Store Entry
    await this.kv.put(`audit:${hash}`, JSON.stringify(entry));
    
    // Update Head
    await this.kv.put('audit:head', hash);

    return hash;
  }

  /**
   * Verify the integrity of the audit chain.
   */
  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    let currentHash = await this.kv.get('audit:head');
    
    if (!currentHash || currentHash === 'GENESIS_HASH') {
      return { valid: true };
    }

    while (currentHash && currentHash !== 'GENESIS_HASH') {
      const entryStr = await this.kv.get(`audit:${currentHash}`);
      if (!entryStr) {
        return { valid: false, brokenAt: currentHash };
      }

      const entry: AuditLogEntry = JSON.parse(entryStr);
      
      // Re-calculate hash
      const dataToHash = `${entry.previousHash}|${entry.timestamp}|${entry.actor}|${entry.action}|${JSON.stringify(entry.details)}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataToHash));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (calculatedHash !== entry.hash) {
        return { valid: false, brokenAt: currentHash };
      }

      currentHash = entry.previousHash;
    }

    return { valid: true };
  }
}
