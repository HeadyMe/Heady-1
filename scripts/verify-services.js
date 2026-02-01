#!/usr/bin/env node

/**
 * HeadySystems Service Verification Script
 * Checks all services for deployment readiness
 */

const http = require('http');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}


const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`),
  error: (msg) => console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.cyan}ℹ️  ${msg}${COLORS.reset}`),
  header: (msg) => console.log(`\n${COLORS.bold}${COLORS.cyan}${msg}${COLORS.reset}`)
};

const SERVICES = [
  {
    name: 'Heady Automation IDE',
    url: 'http://localhost:3000/api/health',
    required: true
  },
  {
    name: 'HeadyConnection Web',
    url: 'http://localhost:3000',
    required: false
  },
  {
    name: 'HeadySystems Web', 
    url: 'http://localhost:3001',
    required: false
  },
  {
    name: 'HeadyEcosystem API',
    url: 'http://localhost:8000/health',
    required: false
  }
];

const DOCKER_SERVICES = [
  { name: 'PostgreSQL', container: 'heady-postgres' },
  { name: 'Redis', container: 'heady-redis' }
];

async function checkHttpService(service) {
  return new Promise((resolve) => {
    const req = http.get(service.url, { timeout: 5000 }, (res) => {
      resolve({ 
        healthy: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode
      });
    });
    
    req.on('error', () => resolve({ healthy: false, status: null }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ healthy: false, status: 'timeout' });
    });
  });
}

function checkDockerService(service) {
  try {
    const output = execSync(`docker ps --filter "name=${service.container}" --format "{{.Status}}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.includes('Up');
  } catch {
    return false;
  }
}

function checkEnvVariables() {
  const required = [
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  const optional = [
    'HC_JWT_SECRET',
    'HC_OPENAI_API_KEY',
    'HC_ANTHROPIC_API_KEY',
    'HC_GITHUB_TOKEN'
  ];
  
  const results = { required: [], optional: [] };
  
  required.forEach(key => {
    results.required.push({ key, set: !!process.env[key] });
  });
  
  optional.forEach(key => {
    results.optional.push({ key, set: !!process.env[key] });
  });
  
  return results;
}

async function main() {
  console.log(`
${COLORS.cyan}╔════════════════════════════════════════════════════════════╗
║          HEADY SYSTEMS - SERVICE VERIFICATION              ║
╚════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

  let allPassed = true;
  let requiredPassed = true;

  // Check Docker Services
  log.header('Docker Services');
  for (const service of DOCKER_SERVICES) {
    const healthy = checkDockerService(service);
    if (healthy) {
      log.success(`${service.name} (${service.container}): Running`);
    } else {
      log.error(`${service.name} (${service.container}): Not running`);
      allPassed = false;
      requiredPassed = false;
    }
  }

  // Check HTTP Services
  log.header('HTTP Services');
  for (const service of SERVICES) {
    const result = await checkHttpService(service);
    if (result.healthy) {
      log.success(`${service.name}: Healthy (HTTP ${result.status})`);
    } else {
      if (service.required) {
        log.error(`${service.name}: Unreachable`);
        requiredPassed = false;
      } else {
        log.warn(`${service.name}: Not running (optional)`);
      }
      allPassed = false;
    }
  }

  // Check Environment Variables
  log.header('Environment Variables');
  const envResults = checkEnvVariables();
  
  envResults.required.forEach(({ key, set }) => {
    if (set) {
      log.success(`${key}: Configured`);
    } else {
      log.error(`${key}: Missing (required)`);
      requiredPassed = false;
    }
  });
  
  envResults.optional.forEach(({ key, set }) => {
    if (set) {
      log.success(`${key}: Configured`);
    } else {
      log.warn(`${key}: Not set (optional)`);
    }
  });

  // Summary
  console.log(`
${COLORS.cyan}════════════════════════════════════════════════════════════${COLORS.reset}
`);

  if (allPassed) {
    log.success('All services are running and configured!');
    process.exit(0);
  } else if (requiredPassed) {
    log.warn('Required services are running. Some optional services are not configured.');
    process.exit(0);
  } else {
    log.error('Some required services are not running or configured.');
    console.log(`
${COLORS.yellow}To fix:${COLORS.reset}
  1. Start Docker: docker-compose up -d
  2. Configure environment: copy .env.example to .env.local
  3. Install dependencies: pnpm install
  4. Start development: pnpm dev
`);
    process.exit(1);
  }
}

main().catch(console.error);
