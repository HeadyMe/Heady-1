# HeadyRoid Node - System Rebalancing Guide

## Overview

HeadyRoid is an intensive processing node that activates when the system orchestration falls out of equilibrium. It requires **explicit user permission** before download and activation, ensuring non-intrusive operation while providing powerful rebalancing capabilities.

## Architecture

### Components

1. **HeadyRoidNode** (`packages/task-manager/src/core/headyroid-node.ts`)
   - Manages permission lifecycle
   - Handles download simulation
   - Executes intensive rebalancing operations
   - Auto-shutdown when equilibrium restored

2. **EquilibriumDetector** (`packages/task-manager/src/core/equilibrium-detector.ts`)
   - Monitors system balance metrics
   - Detects critical equilibrium disruptions
   - Triggers HeadyRoid activation recommendations

3. **HeadyRoidPermissionUI** (`packages/task-manager/src/core/headyroid-permission-ui.ts`)
   - Presents permission prompts (CLI/HTML)
   - Manages user consent workflow
   - Tracks permission scope and constraints

## Permission Model

### Permission Scopes

- **Single-use**: One activation, then permission expires
- **Session**: Valid for current session (24 hours)
- **Persistent**: Valid until explicitly revoked

### Permission Flow

```
Equilibrium Disruption Detected
    ↓
System Requests Permission
    ↓
User Sees Prompt (CLI/HTML/UI)
    ↓
User Grants/Denies
    ↓
[If Granted] Download → Activate → Rebalance
    ↓
Auto-shutdown when Balanced
```

## Equilibrium Metrics

The system monitors four key metrics:

1. **Node Load Variance**: Distribution of work across nodes
   - Threshold: 0.3 (30% variance)
   - Critical: 0.6+ (60%+ variance)

2. **Task Queue Depth**: Number of queued tasks
   - Threshold: 500 tasks
   - Critical: 1000+ tasks

3. **Error Rate Spike**: Percentage of failed operations
   - Threshold: 5%
   - Critical: 10%+

4. **Response Time P95**: 95th percentile response time
   - Threshold: 2000ms
   - Critical: 4000ms+

## Usage

### CLI Permission Prompt

```bash
# Interactive permission prompt
node scripts/headyroid-cli.js prompt "Critical task queue overflow"

# Generate HTML prompt
node scripts/headyroid-cli.js html "Node load imbalance detected" > permission.html
```

### Programmatic Activation

```typescript
import { SystemIntegrator } from './packages/task-manager/src/core/system-integrator.js';

const system = new SystemIntegrator({
  databaseUrl: process.env.DATABASE_URL,
  enableHeadyRoid: true,
  headyRoidAutoActivate: false, // Require manual approval
});

await system.initialize();

// Request activation
const metrics = {
  nodeLoadVariance: 0.7,
  taskQueueDepth: 1200,
  errorRateSpike: 0.12,
  responseTimeP95: 5000,
  timestamp: Date.now(),
};

await system.requestHeadyRoidActivation(
  metrics,
  'Critical equilibrium disruption detected'
);
```

### Event Monitoring

```typescript
system.on('headyroid:permission_prompt', (promptData) => {
  console.log('Permission requested:', promptData.reason);
});

system.on('headyroid:activated', (metrics) => {
  console.log('HeadyRoid activated for rebalancing');
});

system.on('headyroid:deactivated', ({ reason }) => {
  console.log('HeadyRoid deactivated:', reason);
});

system.on('system:equilibrium_critical', (state) => {
  console.warn('CRITICAL: System out of equilibrium', state.violations);
});
```

## Configuration

### System Integrator Config

```typescript
{
  enableHeadyRoid: true,              // Enable HeadyRoid system
  headyRoidAutoActivate: false,       // Require user approval (recommended)
}
```

### HeadyRoid Node Config

```typescript
{
  maxCpuUsage: 80,                    // Maximum CPU usage (%)
  maxMemoryMb: 2048,                  // Maximum memory allocation (MB)
  maxDurationMs: 300000,              // Maximum activation duration (5 min)
  autoShutdownOnBalance: true,        // Auto-shutdown when equilibrium restored
}
```

### Equilibrium Detector Thresholds

```typescript
{
  nodeLoadVariance: 0.3,              // Variance threshold
  taskQueueDepth: 500,                // Queue depth threshold
  errorRateSpike: 0.05,               // Error rate threshold (5%)
  responseTimeP95: 2000,              // Response time threshold (ms)
}
```

## Rebalancing Strategies

HeadyRoid determines strategy based on metrics:

### Critical Priority
- Task queue depth > 1000
- Error rate spike > 10%
- Estimated duration: 60 seconds

**Actions:**
- Isolate failing nodes
- Reroute tasks to healthy nodes
- Increase processing parallelism

### High Priority
- Node load variance > 0.5
- Response time P95 > 5000ms
- Estimated duration: 120 seconds

**Actions:**
- Redistribute tasks across nodes
- Optimize task routing algorithm
- Enable aggressive caching

### Medium Priority
- Minor imbalances detected
- Estimated duration: 180 seconds

**Actions:**
- Gradual load rebalancing
- Performance tuning

## Security & Safety

### Permission Requirements
- ✅ Explicit user consent required
- ✅ Scope-limited permissions
- ✅ Expiration enforcement
- ✅ Revocation support

### Resource Constraints
- ✅ CPU usage capped at 80%
- ✅ Memory limited to 2GB
- ✅ Maximum duration enforced
- ✅ Auto-shutdown on balance

### Audit Trail
- ✅ All activations logged
- ✅ Permission grants recorded
- ✅ Metrics snapshots saved
- ✅ SHA-256 hash chain maintained

## Monitoring

### Skills Registry

HeadyRoid is tracked in `.heady/skills-registry.json`:

```json
{
  "id": "headyroid_rebalancing",
  "metrics": {
    "permission_grant_rate": {"type": "percentage", "target": 80},
    "rebalancing_success_rate": {"type": "percentage", "target": 95},
    "equilibrium_restore_time": {"type": "duration_ms", "target": 60000},
    "cpu_usage": {"type": "percentage", "target": 80},
    "activation_count": {"type": "count", "target": 0}
  }
}
```

### CLI Commands

```bash
# Check HeadyRoid status
hc skills status headyroid_rebalancing

# View activation history
hc skills report

# Monitor equilibrium in real-time
node packages/task-manager/dist/core/system-integrator.js --monitor
```

## Troubleshooting

### Permission Denied
- Check if user explicitly denied
- Verify permission hasn't expired
- Ensure scope allows activation

### Activation Failed
- Verify HeadyRoid is enabled in config
- Check download completed successfully
- Ensure metrics justify activation

### Auto-shutdown Not Working
- Verify `autoShutdownOnBalance: true`
- Check equilibrium metrics are being collected
- Ensure monitoring interval is appropriate

## Best Practices

1. **Default to Manual Approval**: Set `headyRoidAutoActivate: false` for production
2. **Monitor Activation Frequency**: Target 0 activations (system should stay balanced)
3. **Review Permission Scope**: Use single-use for one-off issues, session for ongoing problems
4. **Tune Thresholds**: Adjust equilibrium thresholds based on your workload
5. **Audit Regularly**: Review activation logs to identify systemic issues

## Future Enhancements

- [ ] Actual node download from package registry
- [ ] Machine learning-based rebalancing strategies
- [ ] Multi-node HeadyRoid coordination
- [ ] Predictive equilibrium disruption detection
- [ ] Integration with external monitoring systems

---

**Remember**: HeadyRoid is a powerful tool for emergency rebalancing. If it activates frequently, investigate root causes rather than relying on it as a permanent solution.
