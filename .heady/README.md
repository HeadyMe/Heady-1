# Heady Skills System

This directory contains the skills registry and performance tracking infrastructure for the Heady Systems ecosystem.

## Contents

- **`skills-registry.json`**: Central registry of all system skills with performance metrics
- **`skills-schema.json`**: JSON Schema for validating skill definitions
- **`SKILLS_GUIDE.md`**: Comprehensive guide to using the skills system
- **`metrics/`**: Performance metrics data (auto-generated)

## Quick Start

### View All Skills
```bash
hc skills list
```

### Generate Performance Report
```bash
hc skills report
```

### Check Specific Skill
```bash
hc skills status deterministic_build
```

### Record a Metric
```bash
hc skills record mcp_orchestration response_time 450
```

## Skills Taxonomy

### Core System Skills
Foundational capabilities: determinism, governance, orchestration, security

### AI Intelligence Skills
Cognitive capabilities: code analysis, pattern recognition, prediction, learning

### Execution Skills
Implementation capabilities: code generation, refactoring, testing, deployment

### Monitoring Skills
Observability: metrics, logging, alerting, diagnostics

## Integration

Skills are automatically tracked by system components. Each skill has:
- **Components**: Files/services that implement the skill
- **Workflows**: Associated `.windsurf/workflows/*.md` files
- **Metrics**: Performance indicators with targets
- **Status**: active, inactive, experimental, or deprecated

## Performance Tracking

Metrics are collected at 60-second intervals and stored in:
- `metrics/metrics_YYYY-MM-DD.jsonl`: Daily metric logs
- `../audit_logs/audit_YYYY-MM-DD.jsonl`: Audit trail with alerts

Alert thresholds:
- **Warning**: 80% of target (20% deviation)
- **Critical**: 50% of target (50% deviation)

## Documentation

See `SKILLS_GUIDE.md` for complete documentation including:
- Skill definition structure
- Adding new skills
- Integration patterns
- Best practices
- Troubleshooting

## Schema Validation

The registry follows the JSON Schema defined in `skills-schema.json`. Validate with:
```bash
node -e "const Ajv = require('ajv'); const ajv = new Ajv(); const schema = require('./.heady/skills-schema.json'); const data = require('./.heady/skills-registry.json'); console.log(ajv.validate(schema, data) ? 'Valid' : ajv.errorsText());"
```

## Version

Current registry version: **1.0.0**

Last updated: 2026-02-02
