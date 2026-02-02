#!/usr/bin/env node
/**
 * HEADY DESKTOP SHORTCUTS CREATOR
 * Creates beautiful, visually stunning desktop shortcuts with sacred geometry icons
 * Uses Golden Ratio design principles and custom icon generation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();
const homeDir = os.homedir();
const projectRoot = path.resolve(__dirname, '..');
const iconsDir = path.join(projectRoot, 'assets', 'icons');
let desktopDir = path.join(homeDir, 'Desktop');

// Check for OneDrive Desktop if standard Desktop doesn't exist
if (!fs.existsSync(desktopDir)) {
    const oneDriveDesktop = path.join(homeDir, 'OneDrive', 'Desktop');
    if (fs.existsSync(oneDriveDesktop)) {
        desktopDir = oneDriveDesktop;
    } else {
        // Fallback to project root or user home if Desktop unavailable
        console.warn('⚠️ Could not locate Desktop folder. Creating launchers in project root.');
        desktopDir = projectRoot;
    }
}

console.log('✨ Creating Beautiful Heady Desktop Shortcuts ✨');
console.log(`🎨 Platform: ${platform}`);
console.log(`📁 Desktop: ${desktopDir}\n`);

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

function createWindowsShortcutWithIcon(name, target, args, iconPath, description) {
    const vbsScript = `
Set oWS = WScript.CreateObject("WScript.Shell")
Set oLink = oWS.CreateShortcut("${path.join(desktopDir, name + '.lnk')}")
oLink.TargetPath = "${target}"
oLink.Arguments = "${args}"
oLink.WorkingDirectory = "${projectRoot}"
oLink.Description = "${description}"
oLink.IconLocation = "${iconPath}"
oLink.WindowStyle = 1
oLink.Save
`;
    const vbsPath = path.join(projectRoot, 'temp_shortcut.vbs');
    fs.writeFileSync(vbsPath, vbsScript);
    
    try {
        execSync(`cscript //nologo "${vbsPath}"`, { stdio: 'inherit' });
        fs.unlinkSync(vbsPath);
        console.log(`✅ Created: ${name}`);
    } catch (error) {
        console.error(`❌ Failed to create ${name}:`, error.message);
        fs.unlinkSync(vbsPath);
    }
}

function createWindowsShortcut() {
    console.log('🎨 Creating Windows Shortcuts with Sacred Geometry Icons...\n');
    // Create launcher scripts
    const scripts = [
        {
            name: '∞ Heady System Health',
            file: 'heady-health.bat',
            icon: 'health-256.png',
            description: '🌀 Sacred Geometry Health Dashboard - Monitor system vitality',
            content: `@echo off
title ∞ Heady System Health Dashboard ∞
cd /d "${projectRoot}"
echo.
echo ════════════════════════════════════════════════════════════
echo            ∞ HEADY SYSTEM HEALTH DASHBOARD ∞
echo ════════════════════════════════════════════════════════════
echo.
echo 🌀 Starting Sacred Geometry Health Monitor...
echo.
node tools/system-health/health-server.js
pause`
        },
        {
            name: '∞ Heady MCP Server',
            file: 'heady-mcp.bat',
            icon: 'mcp-256.png',
            description: '🎼 Model Context Protocol Server - AI Orchestration',
            content: `@echo off
title ∞ Heady MCP Server ∞
cd /d "${projectRoot}"
echo.
echo ════════════════════════════════════════════════════════════
echo                ∞ HEADY MCP SERVER ∞
echo ════════════════════════════════════════════════════════════
echo.
echo 🎼 Starting MCP Orchestration...
echo.
cd packages/core-domain
pnpm start:mcp
pause`
        },
        {
            name: '∞ Heady Full System',
            file: 'heady-full.bat',
            icon: 'heady-256.png',
            description: '✨ Complete Heady Ecosystem - Full Stack Launch',
            content: `@echo off
title ∞ Heady Full System ∞
cd /d "${projectRoot}"
echo.
echo ════════════════════════════════════════════════════════════
echo              ∞ HEADY FULL SYSTEM LAUNCH ∞
echo ════════════════════════════════════════════════════════════
echo.
echo ✨ Initializing Sacred Geometry Ecosystem...
echo.
pnpm install
pnpm build
echo.
echo 🚀 Starting all services...
start "Heady Health" cmd /k "node tools/system-health/health-server.js"
timeout /t 2 /nobreak >nul
start "Heady MCP" cmd /k "cd packages/core-domain && pnpm start:mcp"
echo.
echo ✅ All systems operational!
echo 📊 Health Dashboard: http://localhost:3300/dashboard
echo.
pause`
        },
        {
            name: '∞ Heady Docker',
            file: 'heady-docker.bat',
            icon: 'docker-256.png',
            description: '🐳 Docker Environment - Containerized Deployment',
            content: `@echo off
title ∞ Heady Docker Environment ∞
cd /d "${projectRoot}"
echo.
echo ════════════════════════════════════════════════════════════
echo            ∞ HEADY DOCKER ENVIRONMENT ∞
echo ════════════════════════════════════════════════════════════
echo.
echo 🐳 Starting containerized services...
echo.
docker-compose up -d --build
echo.
echo ✅ Docker services started!
echo.
docker-compose ps
echo.
pause`
        }
    ];
    
    // Create batch files
    scripts.forEach(script => {
        const batPath = path.join(projectRoot, 'tools', script.file);
        fs.mkdirSync(path.dirname(batPath), { recursive: true });
        fs.writeFileSync(batPath, script.content);
    });
    
    // Create shortcuts with icons
    const pwsh = 'powershell.exe';
    scripts.forEach(script => {
        const batPath = path.join(projectRoot, 'tools', script.file);
        const iconPath = path.join(iconsDir, script.icon);
        
        // Create placeholder icon if it doesn't exist
        if (!fs.existsSync(iconPath)) {
            console.log(`⚠️  Icon not found: ${script.icon} (will use default)`);
        }
        
        createWindowsShortcutWithIcon(
            script.name,
            batPath,
            '',
            iconPath,
            script.description
        );
    });
    
    console.log('\n✨ All shortcuts created with sacred geometry design!');
    console.log('📁 Check your desktop for beautiful Heady shortcuts\n');
}

function createUnixShortcut() {
    // Linux/Mac implementation (creating a .desktop file or executable shell script on desktop)
    const shContent = `#!/bin/bash
cd "${projectRoot}"
echo "Starting Heady Automation IDE..."
pnpm run dev
`;
    const shortcutPath = path.join(desktopDir, 'Launch Heady IDE.command'); // .command for Mac, often works
    fs.writeFileSync(shortcutPath, shContent);
    try {
        execSync(`chmod +x "${shortcutPath}"`);
        console.log(`✅ Created executable shortcut at: ${shortcutPath}`);
    } catch (e) {
        console.error('Failed to chmod shortcut', e);
    }
}

// Generate icons first (if canvas is available)
try {
    console.log('🎨 Attempting to generate custom icons...\n');
    const iconGenerator = require(path.join(projectRoot, 'assets', 'icons', 'generate-icons.js'));
    iconGenerator.generateAllIcons();
    console.log('');
} catch (error) {
    console.log('ℹ️  Custom icon generation skipped (canvas not installed)');
    console.log('   Shortcuts will use default icons\n');
}

if (platform === 'win32') {
    createWindowsShortcut();
} else {
    createUnixShortcut();
}

console.log('\n════════════════════════════════════════════════════════════');
console.log('           ✨ HEADY SHORTCUTS READY ✨');
console.log('════════════════════════════════════════════════════════════');
console.log('\n🌀 Your desktop now has beautiful sacred geometry shortcuts!');
console.log('💖 Click any shortcut to launch the Heady experience\n');
