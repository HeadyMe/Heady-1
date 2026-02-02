import { GovernanceStandard } from '../src/types';

const WORKER_URL = 'http://localhost:8787';

const STANDARDS: GovernanceStandard[] = [
  {
    id: 'std_build_deploy',
    category: 'architecture',
    name: 'Grand Build Protocol',
    description: 'Standardized build, verification, and deployment process for Heady Systems.',
    version: '1.0.0',
    status: 'active',
    lastUpdated: Date.now(),
    rules: [
      {
        id: 'rule_sec_inject',
        description: 'Environment variables must be loaded from secure sources (Vault/.env) before build.',
        severity: 'critical',
        automated: true
      },
      {
        id: 'rule_infra_verify',
        description: 'Critical infrastructure files (render.yaml, public/index.html) must exist.',
        severity: 'high',
        automated: true
      },
      {
        id: 'rule_git_opt',
        description: 'Git repositories must be optimized (gc --aggressive) before deployment.',
        severity: 'medium',
        automated: true
      }
    ]
  },
  {
    id: 'std_security_auth',
    category: 'security',
    name: 'Heady Auth Protocol',
    description: 'Security standards for authentication, token management, and MCP communication.',
    version: '1.0.0',
    status: 'active',
    lastUpdated: Date.now(),
    rules: [
      {
        id: 'rule_jwt_sign',
        description: 'JWT tokens must be signed with a secure Master Key.',
        severity: 'critical',
        automated: true
      },
      {
        id: 'rule_token_expiry',
        description: 'Access tokens must expire within 1 hour; Refresh tokens within 24 hours.',
        severity: 'high',
        automated: true
      },
      {
        id: 'rule_mcp_auth',
        description: 'MCP servers must authenticate via Bearer Token or Signed API Key.',
        severity: 'critical',
        automated: true
      }
    ]
  },
  {
    id: 'std_node_comm',
    category: 'performance',
    name: 'Node Communication Protocol',
    description: 'Standards for reliable, high-performance inter-node messaging.',
    version: '1.0.0',
    status: 'active',
    lastUpdated: Date.now(),
    rules: [
      {
        id: 'rule_msg_checksum',
        description: 'All protocol messages must include a SHA/Checksum for integrity verification.',
        severity: 'high',
        automated: true
      },
      {
        id: 'rule_heartbeat',
        description: 'Active nodes must broadcast heartbeats every 10 seconds.',
        severity: 'medium',
        automated: true
      },
      {
        id: 'rule_ver_compat',
        description: 'Messages must specify protocol version and reject mismatches.',
        severity: 'high',
        automated: true
      }
    ]
  },
  {
    id: 'std_arena_eval',
    category: 'code_quality',
    name: 'Arena Optimization Protocol',
    description: 'Standards for competitive code evaluation and evolution.',
    version: '1.0.0',
    status: 'active',
    lastUpdated: Date.now(),
    rules: [
      {
        id: 'rule_comp_score',
        description: 'Solutions must be scored on Execution Time, Memory Usage, and Code Quality.',
        severity: 'high',
        automated: true
      },
      {
        id: 'rule_deterministic_limit',
        description: 'Evaluations must adhere to strict time limits to ensure system responsiveness.',
        severity: 'medium',
        automated: true
      }
    ]
  }
];

async function seed() {
  console.log(`🌱 Seeding Governance Standards to ${WORKER_URL}...`);
  
  for (const std of STANDARDS) {
    try {
      const response = await fetch(`${WORKER_URL}/protocol/standard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-ID': 'seed_script'
        },
        body: JSON.stringify(std)
      });
      
      const result = await response.json();
      if (response.ok) {
        console.log(`✅ Registered: ${std.name} (Hash: ${(result as any).hash})`);
      } else {
        console.error(`❌ Failed to register ${std.name}:`, result);
      }
    } catch (error) {
      console.error(`❌ Network error for ${std.name}:`, error);
    }
  }
  
  console.log('✨ Seeding complete.');
}

seed();
