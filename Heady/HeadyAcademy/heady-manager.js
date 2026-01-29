const express = require('express');
const cors = require('cors');
const path = require('path');
const { secretManagerTool } = require('./Tools/MCP/secret-manager');

const app = express();
const PORT = process.env.PORT || 3300;

// Load tools registry
const TOOLS_REGISTRY = {
    secret_manager: secretManagerTool
};

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/pulse', (req, res) => {
    res.json({ 
        status: 'Harmonic',
        nodes: [
            { name: 'HeadyMaster', status: 'Active' },
            { name: 'MCP Server', status: 'Ready' },
            { name: 'Tool Registry', status: 'Loaded' },
            { name: 'Secret Manager', status: 'Active' }
        ],
        tools: Object.keys(TOOLS_REGISTRY).length,
        timestamp: new Date().toISOString()
    });
});

// MCP Tools endpoint
app.post('/api/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const tool = TOOLS_REGISTRY[toolName];
    
    if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
    }
    
    try {
        const result = await tool.handler(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MCP Server status
app.get('/api/mcp/status', (req, res) => {
    res.json({
        protocol: 'JSON-RPC 2.0',
        version: '2024-11-05',
        tools: Object.keys(TOOLS_REGISTRY).length,
        status: 'Active'
    });
});

app.listen(PORT, () => {
    console.log(`∞ Heady Sacred Interface active at http://localhost:${PORT} ∞`);
    console.log(`Tools loaded: ${Object.keys(TOOLS_REGISTRY).join(', ')}`);
});