@echo off
title ∞ Heady Docker Environment ∞
cd /d "C:\Users\erich\CascadeProjects\HeadySystems"
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
pause