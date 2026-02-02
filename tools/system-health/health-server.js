#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3300;
const REGISTRY_PATH = path.join(__dirname, '../../.heady/skills-registry.json');
const AUDIT_DIR = path.join(__dirname, '../../audit_logs');

class HealthServer {
    constructor() {
        this.registry = this.loadRegistry();
        this.server = null;
    }

    loadRegistry() {
        try {
            return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
        } catch (error) {
            console.error('Failed to load registry:', error);
            return { skills: {}, version: '1.0.0' };
        }
    }

    async checkServiceHealth(skill) {
        const health = {
            skillId: skill.id,
            name: skill.name,
            status: skill.status,
            metrics: {}
        };

        if (skill.status === 'inactive') {
            return health;
        }

        Object.entries(skill.metrics || {}).forEach(([metricName, metricDef]) => {
            health.metrics[metricName] = {
                latest: this.getMockMetricValue(metricDef),
                target: metricDef.target,
                type: metricDef.type
            };
        });

        return health;
    }

    getMockMetricValue(metricDef) {
        const { type, target } = metricDef;
        
        switch (type) {
            case 'percentage':
                return Math.min(100, target * (0.8 + Math.random() * 0.3));
            case 'duration_ms':
                return target * (0.7 + Math.random() * 0.5);
            case 'count':
                return Math.floor(target * (0.5 + Math.random() * 0.8));
            case 'boolean':
                return Math.random() > 0.2;
            case 'score':
                return target * (0.8 + Math.random() * 0.2);
            case 'fps':
                return target * (0.9 + Math.random() * 0.1);
            default:
                return target;
        }
    }

    async getSystemHealth() {
        const health = {
            timestamp: new Date().toISOString(),
            registry_version: this.registry.version,
            skills: {}
        };

        for (const [skillId, skill] of Object.entries(this.registry.skills || {})) {
            health.skills[skillId] = await this.checkServiceHealth(skill);
        }

        return health;
    }

    async reportIssue(issue) {
        const date = new Date().toISOString().split('T')[0];
        const auditFile = path.join(AUDIT_DIR, `audit_${date}.jsonl`);
        
        if (!fs.existsSync(AUDIT_DIR)) {
            fs.mkdirSync(AUDIT_DIR, { recursive: true });
        }

        const auditEntry = {
            ...issue,
            hash: require('crypto').createHash('sha256').update(JSON.stringify(issue)).digest('hex')
        };

        fs.appendFileSync(auditFile, JSON.stringify(auditEntry) + '\n');
        
        console.log(`\n🐛 ISSUE REPORTED:`);
        console.log(`   Skill: ${issue.skillId}`);
        console.log(`   Description: ${issue.description}`);
        console.log(`   Logged to: ${auditFile}\n`);

        return { success: true, auditFile };
    }

    handleRequest(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.url === '/api/health' && req.method === 'GET') {
            this.getSystemHealth().then(health => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(health, null, 2));
            }).catch(error => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            });
            return;
        }

        if (req.url === '/api/report-issue' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const issue = JSON.parse(body);
                    this.reportIssue(issue).then(result => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    });
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }

        if (req.url === '/' || req.url === '/dashboard') {
            const dashboardPath = path.join(__dirname, 'dashboard-sacred.html');
            fs.readFile(dashboardPath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Dashboard not found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }

    start() {
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        this.server.listen(PORT, () => {
            console.log('\n╔══════════════════════════════════════════════════════════════╗');
            console.log('║        🌀 HEADY SYSTEM HEALTH DASHBOARD ACTIVE              ║');
            console.log('╚══════════════════════════════════════════════════════════════╝\n');
            console.log(`   📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`   🔌 API:       http://localhost:${PORT}/api/health`);
            console.log(`   🐛 Issues:    http://localhost:${PORT}/api/report-issue\n`);
            console.log('   Press Ctrl+C to stop\n');
        });

        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${PORT} is already in use. Stop the existing service or choose a different port.\n`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
            }
        });
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('\n✅ Health Dashboard stopped\n');
                process.exit(0);
            });
        }
    }
}

if (require.main === module) {
    const server = new HealthServer();
    server.start();

    process.on('SIGINT', () => server.stop());
    process.on('SIGTERM', () => server.stop());
}

module.exports = HealthServer;
