@echo off
title AegisPay AI — Starting...
color 0B
echo.
echo  ================================================
echo   AEGISPAY AI — Starting Application
echo  ================================================
echo.

:: Start MongoDB (try common install paths)
echo  [1/3] Starting MongoDB...
sc start MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    start /min "" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db" >nul 2>&1
    start /min "" "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db" >nul 2>&1
    start /min "" "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\data\db" >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo  [OK] MongoDB starting...

:: Start NestJS Backend
echo  [2/3] Starting Backend API (port 4000)...
start "AegisPay - Backend" cmd /k "cd /d %~dp0apps\api && pnpm run start:dev"
timeout /t 3 /nobreak >nul

:: Start Python AI Service
echo  [2/3] Starting AI Service (port 8000)...
start "AegisPay - AI Service" cmd /k "cd /d %~dp0apps\ai-service && python main.py"
timeout /t 2 /nobreak >nul

:: Start Next.js Frontend
echo  [3/3] Starting Frontend (port 3000)...
start "AegisPay - Frontend" cmd /k "cd /d %~dp0apps\web && pnpm run dev"
timeout /t 5 /nobreak >nul

echo.
echo  ================================================
echo   AegisPay AI is Running!
echo  ================================================
echo.
echo   Frontend:   http://localhost:3000
echo   Backend:    http://localhost:4000
echo   API Docs:   http://localhost:4000/api/docs
echo   AI Service: http://localhost:8000/docs
echo.
echo   Login:      admin@aegispay.ai / Admin@123456
echo.
echo   Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo.
echo   To stop all services, run: stop.bat
echo.
pause
