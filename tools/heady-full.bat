@echo off
title ∞ Heady Full System ∞
cd /d "C:\Users\erich\CascadeProjects\HeadySystems"
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
pause