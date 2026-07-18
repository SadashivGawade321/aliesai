@echo off
title AegisPay AI — Stopping...
color 0C
echo.
echo  [INFO] Stopping AegisPay AI services...
echo.

taskkill /f /fi "WINDOWTITLE eq AegisPay - Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq AegisPay - Frontend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq AegisPay - AI Service" >nul 2>&1
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "python.exe" >nul 2>&1

echo  [OK] All services stopped.
echo.
pause
