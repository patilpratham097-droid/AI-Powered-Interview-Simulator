@echo off
echo ========================================
echo Starting Judge0 (Self-Hosted)
echo ========================================
echo.

echo Checking if Docker is running...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo.
    echo Please:
    echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo 2. Start Docker Desktop
    echo 3. Run this script again
    pause
    exit /b 1
)

echo Docker is running!
echo.

echo Checking if Judge0 container exists...
docker ps -a --filter "name=judge0" --format "{{.Names}}" | findstr "judge0" >nul 2>&1
if errorlevel 1 (
    echo Creating new Judge0 container...
    docker run -d --name judge0 -p 2358:2358 judge0/judge0:latest
    echo.
    echo Waiting 30 seconds for Judge0 to start...
    timeout /t 30 /nobreak
) else (
    echo Judge0 container exists. Starting it...
    docker start judge0
    echo.
    echo Waiting 10 seconds for Judge0 to start...
    timeout /t 10 /nobreak
)

echo.
echo ========================================
echo Judge0 is running on http://localhost:2358
echo ========================================
echo.
echo To test: node test-judge0.js
echo To stop: docker stop judge0
echo.
pause
