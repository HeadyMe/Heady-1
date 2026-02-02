#!/usr/bin/env node
/**
 * HEADY SKILLS PERFORMANCE MONITOR
 * 
 * Tracks skill execution metrics and ties them to system component performance.
 * Generates real-time performance reports and alerts on threshold violations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REGISTRY_PATH = path.join(__dirname, '../.heady/skills-registry.json');
const METRICS_DIR = path.join(__dirname, '../.heady/metrics');
const AUDIT_DIR = path.join(__dirname, '../audit_logs');

class SkillsMonitor {
    constructor() {
        this.registry = this.loadRegistry();
        this.metrics = new Map();
        this.ensureDirectories();
    }

    loadRegistry() {
        if (!fs.existsSync(REGISTRY_PATH)) {
            throw new Error(`Skills registry not found at ${REGISTRY_PATH}`);
        }
        return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    }

    ensureDirectories() {
        [METRICS_DIR, AUDIT_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    recordMetric(skillId, metricName, value, timestamp = new Date().toISOString()) {
        const skill = this.registry.skills[skillId];
        if (!skill) {
            console.error(`[SkillsMonitor] Unknown skill: ${skillId}`);
            return;
        }

        const metricDef = skill.metrics[metricName];
        if (!metricDef) {
            console.error(`[SkillsMonitor] Unknown metric: ${metricName} for skill ${skillId}`);
            return;
        }

        const key = `${skillId}:${metricName}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }

        const entry = {
            timestamp,
            value,
            target: metricDef.target,
            type: metricDef.type,
            deviation: this.calculateDeviation(value, metricDef.target, metricDef.type)
        };

        this.metrics.get(key).push(entry);
        this.checkThresholds(skillId, metricName, entry);
        this.persistMetric(skillId, metricName, entry);

        return entry;
    }

    calculateDeviation(actual, target, type) {
        switch (type) {
            case 'percentage':
            case 'score':
                return ((actual - target) / target) * 100;
            case 'duration_ms':
            case 'count':
                return actual - target;
            case 'boolean':
                return actual === target ? 0 : 1;
            case 'fps':
                return ((actual - target) / target) * 100;
            default:
                return 0;
        }
    }

    checkThresholds(skillId, metricName, entry) {
        const { alert_thresholds } = this.registry.performance_tracking;
        const normalizedDeviation = Math.abs(entry.deviation) / 100;

        let level = null;
        if (normalizedDeviation >= alert_thresholds.critical) {
            level = 'CRITICAL';
        } else if (normalizedDeviation >= alert_thresholds.warning) {
            level = 'WARNING';
        }

        if (level) {
            this.emitAlert(level, skillId, metricName, entry);
        }
    }

    emitAlert(level, skillId, metricName, entry) {
        const alert = {
            timestamp: entry.timestamp,
            level,
            skillId,
            metricName,
            actual: entry.value,
            target: entry.target,
            deviation: entry.deviation,
            message: `Skill '${skillId}' metric '${metricName}' is ${level}: ${entry.value} (target: ${entry.target})`
        };

        console.log(`[${level}] ${alert.message}`);
        this.auditAlert(alert);
    }

    persistMetric(skillId, metricName, entry) {
        const date = new Date().toISOString().split('T')[0];
        const metricsFile = path.join(METRICS_DIR, `metrics_${date}.jsonl`);
        
        const record = {
            skillId,
            metricName,
            ...entry
        };

        fs.appendFileSync(metricsFile, JSON.stringify(record) + '\n');
    }

    auditAlert(alert) {
        const date = new Date().toISOString().split('T')[0];
        const auditFile = path.join(AUDIT_DIR, `audit_${date}.jsonl`);
        
        const auditEntry = {
            type: 'SKILL_ALERT',
            ...alert,
            hash: crypto.createHash('sha256').update(JSON.stringify(alert)).digest('hex')
        };

        fs.appendFileSync(auditFile, JSON.stringify(auditEntry) + '\n');
    }

    getSkillPerformance(skillId) {
        const skill = this.registry.skills[skillId];
        if (!skill) return null;

        const performance = {
            skillId,
            name: skill.name,
            status: skill.status,
            metrics: {}
        };

        Object.keys(skill.metrics).forEach(metricName => {
            const key = `${skillId}:${metricName}`;
            const history = this.metrics.get(key) || [];
            
            if (history.length > 0) {
                const latest = history[history.length - 1];
                const avg = history.reduce((sum, e) => sum + e.value, 0) / history.length;
                
                performance.metrics[metricName] = {
                    latest: latest.value,
                    target: latest.target,
                    average: avg,
                    deviation: latest.deviation,
                    samples: history.length
                };
            }
        });

        return performance;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            registry_version: this.registry.version,
            skills: {}
        };

        Object.keys(this.registry.skills).forEach(skillId => {
            const perf = this.getSkillPerformance(skillId);
            if (perf) {
                report.skills[skillId] = perf;
            }
        });

        return report;
    }

    printReport() {
        const report = this.generateReport();
        
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║           HEADY SKILLS PERFORMANCE REPORT                    ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        console.log(`Registry Version: ${report.registry_version}`);
        console.log(`Generated: ${report.timestamp}\n`);

        Object.values(report.skills).forEach(skill => {
            console.log(`\n📊 ${skill.name} (${skill.skillId})`);
            console.log(`   Status: ${skill.status.toUpperCase()}`);
            
            Object.entries(skill.metrics).forEach(([name, data]) => {
                const status = Math.abs(data.deviation) < 10 ? '✅' : 
                               Math.abs(data.deviation) < 50 ? '⚠️' : '❌';
                console.log(`   ${status} ${name}: ${data.latest} (target: ${data.target}, avg: ${data.average.toFixed(2)})`);
            });
        });

        console.log('\n');
    }
}

// CLI Interface
if (require.main === module) {
    const monitor = new SkillsMonitor();
    const command = process.argv[2];

    switch (command) {
        case 'report':
            monitor.printReport();
            break;
        
        case 'record':
            const [skillId, metricName, value] = process.argv.slice(3);
            if (!skillId || !metricName || value === undefined) {
                console.error('Usage: node skills-monitor.js record <skillId> <metricName> <value>');
                process.exit(1);
            }
            const entry = monitor.recordMetric(skillId, metricName, parseFloat(value));
            console.log(`Recorded: ${JSON.stringify(entry, null, 2)}`);
            break;
        
        case 'status':
            const targetSkillId = process.argv[3];
            if (!targetSkillId) {
                console.error('Usage: node skills-monitor.js status <skillId>');
                process.exit(1);
            }
            const perf = monitor.getSkillPerformance(targetSkillId);
            console.log(JSON.stringify(perf, null, 2));
            break;
        
        default:
            console.log('Heady Skills Monitor');
            console.log('Usage:');
            console.log('  node skills-monitor.js report                          - Generate full performance report');
            console.log('  node skills-monitor.js record <skill> <metric> <value> - Record a metric value');
            console.log('  node skills-monitor.js status <skillId>                - Get skill status');
            process.exit(0);
    }
}

module.exports = SkillsMonitor;
