@echo off
title AegisPay AI — Setup
color 0A
echo.
echo  ================================================
echo   AEGISPAY AI — First Time Setup
echo   "Programmable Trust for Every Transaction"
echo  ================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo  Please download it from: https://nodejs.org
    echo  Then run this file again.
    pause
    exit /b 1
)
echo  [OK] Node.js found: 
node --version

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python is not installed!
    echo  Please download it from: https://python.org
    echo  Then run this file again.
    pause
    exit /b 1
)
echo  [OK] Python found:
python --version

:: Check MongoDB
echo.
echo  [INFO] Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARNING] MongoDB not found in PATH.
    echo  If MongoDB is installed, it may still work.
    echo  Download MongoDB Community from:
    echo  https://www.mongodb.com/try/download/community
) else (
    echo  [OK] MongoDB found.
)

:: Install pnpm if missing
echo.
echo  [INFO] Installing pnpm package manager...
npm install -g pnpm >nul 2>&1
echo  [OK] pnpm ready.

:: Setup .env if not exists
if not exist .env (
    echo.
    echo  [INFO] Creating .env from template...
    copy .env.example .env >nul
    echo  [OK] .env created. You can edit it later.
)

:: Install backend dependencies
echo.
echo  [INFO] Installing Backend (NestJS) packages...
echo  This may take 2-3 minutes...
cd apps\api
call pnpm install
cd ..\..
echo  [OK] Backend packages installed.

:: Install frontend dependencies
echo.
echo  [INFO] Installing Frontend (Next.js) packages...
echo  This may take 2-3 minutes...
cd apps\web
call pnpm install
cd ..\..
echo  [OK] Frontend packages installed.

:: Install Python AI dependencies
echo.
echo  [INFO] Installing Python AI packages...
cd apps\ai-service
pip install -r requirements.txt -q
cd ..\..
echo  [OK] Python packages installed.

echo.
echo  ================================================
echo   Setup Complete!
echo  ================================================
echo.
echo   Next steps:
echo   1. Make sure MongoDB is running
echo   2. Double-click start.bat to launch the app
echo   3. Open http://localhost:3000 in your browser
echo.
echo   Default login:
echo   Email:    admin@aegispay.ai
echo   Password: Admin@123456
echo.
pause
