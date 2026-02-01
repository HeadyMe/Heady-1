const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Simple implementation to create a desktop shortcut (Windows .url / .lnk simulation or .desktop for linux)
// For Windows, we'll create a .bat file on the desktop that launches the environment.

const platform = os.platform();
const homeDir = os.homedir();
const projectRoot = path.resolve(__dirname, '..');
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

console.log(`🚀 Setting up Desktop Shortcuts for Heady Automation IDE on ${platform}`);

function createWindowsShortcut() {
    const batContent = `@echo off
cd /d "${projectRoot}"
if exist ".env.local" (
  for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do set %%a=%%b
)
set HEADY_ENV=development
set NODE_ENV=development
echo Starting Heady Automation IDE (dev)...
call pnpm dev --filter heady-automation-ide
pause
`;
    const shortcutPath = path.join(desktopDir, 'Launch Heady IDE.bat');
    fs.writeFileSync(shortcutPath, batContent);
    console.log(`✅ Created shortcut at: ${shortcutPath}`);

    const dockerBatContent = `@echo off
cd /d "${projectRoot}"
if exist ".env.local" (
  for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do set %%a=%%b
)
set HEADY_ENV=development
echo Starting Heady Docker Environment...
docker-compose up -d --build
echo Services started.
pause
`;
    const dockerShortcutPath = path.join(desktopDir, 'Start Heady Docker.bat');
    fs.writeFileSync(dockerShortcutPath, dockerBatContent);
    console.log(`✅ Created docker shortcut at: ${dockerShortcutPath}`);
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

if (platform === 'win32') {
    createWindowsShortcut();
} else {
    createUnixShortcut();
}
