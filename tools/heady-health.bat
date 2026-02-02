@echo off
title ∞ Heady System Health Dashboard ∞
cd /d "C:\Users\erich\CascadeProjects\HeadySystems"
echo.
echo ════════════════════════════════════════════════════════════
echo            ∞ HEADY SYSTEM HEALTH DASHBOARD ∞
echo ════════════════════════════════════════════════════════════
echo.
echo 🌀 Starting Sacred Geometry Health Monitor...
echo.
node tools/system-health/health-server.js
pause