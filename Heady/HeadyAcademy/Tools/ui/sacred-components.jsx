// HEADY SACRED COMPONENTS LIBRARY
// Reusable UI components for the Sacred Interface

import React from 'react';

// Sacred Geometry Logo Component
export const SacredLogo = ({ size = '3rem', color = '#00ffff' }) => (
    <div 
        className="sacred-logo pulse"
        style={{
            fontSize: size,
            textShadow: `0 0 20px ${color}`,
            animation: 'pulse 2s infinite'
        }}
    >
        ∞ HEADY SYSTEMS ACTIVE ∞
    </div>
);

// Status Display Component
export const StatusDisplay = ({ children, opacity = 0.8 }) => (
    <div 
        className="status-display"
        style={{
            fontSize: '1.2rem',
            margin: '1rem 0',
            opacity
        }}
    >
        {children}
    </div>
);

// Sacred Container Component
export const SacredContainer = ({ children, gradient = true }) => (
    <div 
        className="sacred-container"
        style={{
            background: gradient 
                ? 'linear-gradient(135deg, #020208, #0a0a2e)' 
                : '#020208',
            color: '#fff',
            fontFamily: "'Courier New', monospace",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            margin: 0,
            textAlign: 'center'
        }}
    >
        {children}
    </div>
);

// Orbit Card Component for Node Status
export const OrbitCard = ({ name, status, active = true }) => (
    <div 
        className={`orbit-card ${active ? 'active' : 'inactive'}`}
        style={{
            border: `1px solid ${active ? '#00ffff' : '#333'}`,
            borderRadius: '8px',
            padding: '1rem',
            margin: '0.5rem',
            background: 'rgba(0, 255, 255, 0.1)',
            transition: 'all 0.3s ease'
        }}
    >
        <div className="node-name">{name}</div>
        <div className="node-status" style={{ opacity: 0.7 }}>{status}</div>
    </div>
);

// Sacred Pulse Animation CSS
export const SacredStyles = `
    @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }
    
    .pulse {
        animation: pulse 2s infinite;
    }
    
    .orbit-card:hover {
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    }
`;

// Complete Sacred Interface Layout
export const SacredInterface = ({ nodes = [], status = "Harmonic" }) => (
    <SacredContainer>
        <SacredLogo />
        <StatusDisplay>Multi-Agent Orchestration Platform</StatusDisplay>
        <StatusDisplay>Sacred Interface Initialized</StatusDisplay>
        
        {nodes.length > 0 && (
            <div className="node-grid" style={{ marginTop: '2rem' }}>
                {nodes.map((node, index) => (
                    <OrbitCard 
                        key={index}
                        name={node.name}
                        status={node.status}
                        active={node.status === 'Active'}
                    />
                ))}
            </div>
        )}
        
        <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.6 }}>
            Made with <span style={{ color: '#ff0000', animation: 'pulse 1s infinite', display: 'inline-block' }}>❤️</span> by HeadySystems
        </div>
    </SacredContainer>
);

export default {
    SacredLogo,
    StatusDisplay,
    SacredContainer,
    OrbitCard,
    SacredInterface,
    SacredStyles
};