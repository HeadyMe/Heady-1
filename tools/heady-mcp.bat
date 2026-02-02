@echo off
title ∞ Heady MCP Server ∞
cd /d "C:\Users\erich\CascadeProjects\HeadySystems"
echo.
echo ════════════════════════════════════════════════════════════
echo                ∞ HEADY MCP SERVER ∞
echo ════════════════════════════════════════════════════════════
echo.
echo 🎼 Starting MCP Orchestration...
echo.
cd packages/core-domain
pnpm start:mcp
pause