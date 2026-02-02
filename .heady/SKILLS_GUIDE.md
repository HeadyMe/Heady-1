# HEADY SKILLS SYSTEM GUIDE

## Overview
The Heady Skills System provides a structured taxonomy for organizing system capabilities and tracking their performance metrics. Each skill represents a specific capability with measurable outcomes tied to system components.

## Architecture

### Taxonomy Hierarchy
```
Taxonomy (Core, Intelligence, Execution, Monitoring)
  └─ Category (determinism, code_analysis, deployment, etc.)
      └─ Skill (deterministic_build, semantic_code_search, etc.)
          └─ Components (files, services, workflows)
              └─ Metrics (performance indicators)
```

### Skill Definition Structure
```json
{
  "id": "unique_skill_identifier",
  "name": "Human-Readable Skill Name",
  "taxonomy": "core|intelligence|execution|monitoring",
  "category": "specific_category",
  "description": "What this skill does",
  "components": ["file/paths", "or/service/names"],
  "workflows": ["associated-workflow-names"],
  "metrics": {
    "metric_name": {
      "type": "percentage|duration_ms|count|score|boolean|fps",
      "target": 95.0
    }
  },
  "dependencies": ["external-packages"],
  "status": "active|inactive|deprecated|experimental",
  "blockers": ["Optional: issues preventing activation"]
}
```

## Core Skills Taxonomy

### 1. Core System Skills
**Purpose**: Foundational capabilities for system operation

#### Categories:
- **Determinism**: Reproducible builds, predictable outcomes
- **Governance**: Audit trails, compliance, transparency
- **Orchestration**: Service coordination, workflow management
- **Security**: Vulnerability scanning, secret management

#### Example Skills:
- `deterministic_build`: Ensure identical outputs from identical inputs
- `glass_box_governance`: SHA-256 audit trail with full transparency
- `mcp_orchestration`: Coordinate multiple MCP services

### 2. AI Intelligence Skills
**Purpose**: Cognitive and analytical capabilities

#### Categories:
- **Code Analysis**: Understanding code structure and intent
- **Pattern Recognition**: Identifying patterns across domains
- **Prediction**: Forecasting outcomes and behaviors
- **Learning**: Adapting based on feedback

#### Example Skills:
- `semantic_code_search`: Search by intent, not just text
- `pattern_recognition`: Detect universal patterns (nature, society, code)
- `refactoring_impact_predictor`: Predict side effects before changes

### 3. Execution Skills
**Purpose**: Action-oriented implementation capabilities

#### Categories:
- **Code Generation**: Creating production-ready code
- **Refactoring**: Improving code structure
- **Testing**: Generating and running tests
- **Deployment**: Shipping code to production
- **Data Processing**: Ingesting and transforming data
- **UI Generation**: Creating user interfaces

#### Example Skills:
- `code_generation`: Generate TypeScript/React code from specs
- `auto_merge`: Intelligently merge conflicting implementations
- `email_ingestion`: Process project resources via email
- `sacred_geometry_ui`: Generate beautiful, meaningful UI

### 4. Monitoring & Observability Skills
**Purpose**: System health and performance tracking

#### Categories:
- **Metrics**: Collecting performance data
- **Logging**: Recording events and state changes
- **Alerting**: Notifying on threshold violations
- **Diagnostics**: Troubleshooting and root cause analysis

#### Example Skills:
- `task_monitoring`: Track task queue health and performance
- `system_diagnostics`: Identify bottlenecks and issues

## Performance Metrics

### Metric Types
1. **percentage**: 0-100 scale (e.g., success rate, coverage)
2. **duration_ms**: Time in milliseconds (e.g., response time)
3. **count**: Integer values (e.g., errors, tasks)
4. **score**: 0-10 scale (e.g., code quality)
5. **boolean**: true/false (e.g., chain integrity)
6. **fps**: Frames per second (e.g., UI performance)

### Setting Targets
- **Percentage**: Aim for 95%+ for critical operations
- **Duration**: Set based on user experience requirements
- **Count**: Lower is better for errors, higher for throughput
- **Score**: 8.0+ for quality metrics
- **Boolean**: true for integrity checks
- **FPS**: 60 for smooth UI

### Alert Thresholds
- **Warning**: 80% of target (20% deviation)
- **Critical**: 50% of target (50% deviation)

## Usage

### Recording Metrics
```bash
# Record a metric value
node scripts/skills-monitor.js record deterministic_build build_time 28500

# Record multiple metrics
node scripts/skills-monitor.js record mcp_orchestration response_time 450
node scripts/skills-monitor.js record mcp_orchestration error_rate 0.05
```

### Generating Reports
```bash
# Full performance report
node scripts/skills-monitor.js report

# Single skill status
node scripts/skills-monitor.js status deterministic_build
```

### Integration with Components

#### In Node.js Services
```javascript
const SkillsMonitor = require('./scripts/skills-monitor');
const monitor = new SkillsMonitor();

// Record metric after operation
const startTime = Date.now();
await performBuild();
const duration = Date.now() - startTime;
monitor.recordMetric('deterministic_build', 'build_time', duration);
```

#### In PowerShell Scripts
```powershell
# Record metric from script
$startTime = Get-Date
& pnpm build
$duration = ((Get-Date) - $startTime).TotalMilliseconds
node scripts/skills-monitor.js record deterministic_build build_time $duration
```

#### In Python Workers
```python
import subprocess
import time

start = time.time()
result = process_data()
duration_ms = (time.time() - start) * 1000

subprocess.run([
    'node', 'scripts/skills-monitor.js', 'record',
    'pattern_recognition', 'processing_time', str(duration_ms)
])
```

## Adding New Skills

### 1. Define the Skill
Edit `.heady/skills-registry.json`:
```json
{
  "skills": {
    "your_new_skill": {
      "id": "your_new_skill",
      "name": "Your New Skill",
      "taxonomy": "execution",
      "category": "your_category",
      "description": "What it does",
      "components": ["path/to/component.js"],
      "workflows": ["related-workflow"],
      "metrics": {
        "success_rate": {"type": "percentage", "target": 95},
        "execution_time": {"type": "duration_ms", "target": 1000}
      },
      "dependencies": ["required-package"],
      "status": "active"
    }
  }
}
```

### 2. Instrument the Component
Add metric recording to your component:
```javascript
const monitor = new SkillsMonitor();

async function yourFunction() {
    const start = Date.now();
    try {
        const result = await doWork();
        monitor.recordMetric('your_new_skill', 'success_rate', 100);
        return result;
    } catch (error) {
        monitor.recordMetric('your_new_skill', 'success_rate', 0);
        throw error;
    } finally {
        const duration = Date.now() - start;
        monitor.recordMetric('your_new_skill', 'execution_time', duration);
    }
}
```

### 3. Create Workflow Integration
Add to `.windsurf/workflows/your-workflow.md`:
```markdown
---
name: your-workflow
description: Description of workflow
auto_execution_mode: 2
---

# Your Workflow

## Steps
1. Execute skill component
2. Record metrics
3. Verify performance

## Metrics
- Skill: `your_new_skill`
- Target: 95% success, <1000ms execution
```

## Best Practices

### 1. Skill Granularity
- **Too Broad**: "AI Capabilities" (not measurable)
- **Too Narrow**: "Parse JSON File" (too specific)
- **Just Right**: "Semantic Code Search" (clear, measurable)

### 2. Metric Selection
- Choose metrics that reflect user value
- Avoid vanity metrics (e.g., lines of code)
- Balance leading (predictive) and lagging (outcome) indicators

### 3. Target Setting
- Start conservative, adjust based on data
- Consider 95th percentile, not just average
- Account for system load and variability

### 4. Status Management
- **active**: Fully operational, metrics tracked
- **inactive**: Implemented but disabled (e.g., missing deps)
- **experimental**: Testing phase, metrics informational
- **deprecated**: Being phased out

### 5. Dependency Tracking
- List all external dependencies
- Document blockers for inactive skills
- Automate dependency checks in CI/CD

## Monitoring Dashboard

### Real-Time View
The `heady-lens` app provides a real-time dashboard:
- Skill status overview
- Live metric charts
- Alert notifications
- Historical trends

### Command-Line Interface
```bash
# Quick status check
hc skills status

# Full report
hc skills report

# Watch mode (updates every 60s)
hc skills watch
```

## Troubleshooting

### Skill Not Recording Metrics
1. Check skill status: `node scripts/skills-monitor.js status <skillId>`
2. Verify component is instrumented
3. Check for errors in audit logs
4. Ensure dependencies are installed

### Alert Fatigue
1. Review and adjust targets
2. Increase alert thresholds
3. Implement alert aggregation
4. Add cooldown periods

### Missing Skills
1. Run reconnaissance: `node tools/recon/recon_v2.js`
2. Review discovered concepts
3. Map concepts to skills
4. Update registry

## Integration with Existing Systems

### MCP Services
Skills can be exposed as MCP tools:
```typescript
{
  name: "record_skill_metric",
  description: "Record a performance metric for a skill",
  inputSchema: {
    type: "object",
    properties: {
      skillId: { type: "string" },
      metricName: { type: "string" },
      value: { type: "number" }
    }
  }
}
```

### Task Queue
Integrate with `@heady/task-manager`:
```typescript
taskQueue.on('task:completed', (task) => {
  monitor.recordMetric(
    task.skillId,
    'task_completion_time',
    task.duration
  );
});
```

### Audit Trail
All metrics are automatically logged to audit trail with SHA-256 hash chaining for immutability.

## Future Enhancements

### Phase 1 (Current)
- ✅ Skills registry with JSON schema
- ✅ Performance monitoring CLI
- ✅ Metric recording and alerting
- ✅ Integration guide

### Phase 2 (Q1 2026)
- 🚧 Real-time dashboard in heady-lens
- 🚧 Automated skill discovery
- 🚧 ML-based anomaly detection
- 🚧 Skill recommendation engine

### Phase 3 (Q2 2026)
- 📋 Skill marketplace
- 📋 Community skill contributions
- 📋 Cross-system skill sharing
- 📋 Skill certification program

---

**Remember**: Skills are not just features—they're measurable capabilities that tie directly to system performance and user value.
