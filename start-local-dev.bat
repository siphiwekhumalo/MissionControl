@echo off
title MissionControl - Local Development Server
color 0A
echo.
echo ========================================
echo   MISSION CONTROL - LOCAL DEVELOPMENT
echo ========================================
echo.
echo Starting local backend server on port 3001...
echo.
echo Demo users available:
echo   - Username: siphiwe  ^| Password: 1924@Khumalo
echo   - Username: agent007 ^| Password: secret123
echo   - Username: fieldagent ^| Password: field123
echo.
echo CORS configured for:
echo   - http://localhost:5173 (Vite default)
echo   - http://localhost:5000 (Alternative)
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server-local-simple.js