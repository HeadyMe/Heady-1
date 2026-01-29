// HEADY SECRET MANAGER MCP TOOL
// Provides secure environment variable management for AI agents

const fs = require('fs');
const path = require('path');

class SecretManager {
    constructor(envPath = '.env') {
        this.envPath = envPath;
    }

    // Load secrets from .env file
    loadSecrets() {
        if (!fs.existsSync(this.envPath)) {
            return { success: false, message: '.env file not found' };
        }

        const content = fs.readFileSync(this.envPath, 'utf8');
        const secrets = {};
        
        content.split('\n').forEach(line => {
            const match = line.match(/^([A-Z_][A-Z0-9_]+)=(.*)$/);
            if (match) {
                secrets[match[1]] = match[2].replace(/^["']|["']$/g, '');
            }
        });

        return { success: true, secrets, count: Object.keys(secrets).length };
    }

    // Validate secret patterns
    validateSecrets() {
        const result = this.loadSecrets();
        if (!result.success) return result;

        const validation = {
            github_token: !!result.secrets.GITHUB_TOKEN,
            api_keys: Object.keys(result.secrets).filter(k => k.includes('API_KEY')).length,
            database_url: !!result.secrets.DATABASE_URL
        };

        return { success: true, validation };
    }

    // Sanitize secrets for logging
    sanitizeForLog(content) {
        const patterns = [
            /ghp_[A-Za-z0-9]{36}/g,
            /sk-[A-Za-z0-9]{48}/g,
            /AKIA[A-Z0-9]{16}/g,
            /postgres:\/\/[^"'\s]+/g
        ];

        let sanitized = content;
        patterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '<REDACTED>');
        });

        return sanitized;
    }
}

// MCP Tool Registration
const secretManagerTool = {
    name: 'secret_manager',
    description: 'Manage environment variables and secrets securely',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['load', 'validate', 'sanitize'],
                description: 'Action to perform'
            },
            content: {
                type: 'string',
                description: 'Content to sanitize (for sanitize action)'
            }
        },
        required: ['action']
    },
    handler: async (args) => {
        const manager = new SecretManager();
        
        switch (args.action) {
            case 'load':
                return manager.loadSecrets();
            case 'validate':
                return manager.validateSecrets();
            case 'sanitize':
                return { 
                    success: true, 
                    sanitized: manager.sanitizeForLog(args.content || '') 
                };
            default:
                return { success: false, message: 'Invalid action' };
        }
    }
};

module.exports = { SecretManager, secretManagerTool };