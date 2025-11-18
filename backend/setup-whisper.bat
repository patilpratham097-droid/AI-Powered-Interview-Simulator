@echo off
echo ========================================
echo Whisper.cpp Quick Setup for Windows
echo ========================================
echo.

echo Step 1: Creating models directory...
if not exist "whisper-models" mkdir whisper-models
cd whisper-models

echo.
echo Step 2: Downloading Whisper base.en model (142 MB)...
echo This may take a few minutes...
curl -L -o ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Download failed. Please check your internet connection.
    echo.
    echo Manual download:
    echo 1. Visit: https://huggingface.co/ggerganov/whisper.cpp/tree/main
    echo 2. Download: ggml-base.en.bin
    echo 3. Place in: whisper-models folder
    pause
    exit /b 1
)

cd ..

echo.
echo Step 3: Downloading Whisper.cpp server...
echo.

echo Checking for existing whisper.cpp installation...
if exist "whisper.cpp" (
    echo Found existing whisper.cpp directory
) else (
    echo Please download whisper.cpp from:
    echo https://github.com/ggerganov/whisper.cpp/releases
    echo.
    echo Extract to: %CD%\whisper.cpp
    echo.
    echo Or build from source:
    echo git clone https://github.com/ggerganov/whisper.cpp
    echo cd whisper.cpp
    echo mkdir build
    echo cd build
    echo cmake ..
    echo cmake --build . --config Release
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start Whisper server:
echo   cd whisper.cpp
echo   server.exe -m ../whisper-models/ggml-base.en.bin -p 8080
echo.
echo Or use Docker:
echo   docker run -d -p 8080:8080 -v %CD%/whisper-models:/models ggerganov/whisper.cpp:latest -m /models/ggml-base.en.bin
echo.
echo Then start your backend server:
echo   npm start
echo.
pause
