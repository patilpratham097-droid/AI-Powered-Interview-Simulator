@echo off
echo ========================================
echo Starting Whisper Speech Recognition Server
echo ========================================
echo.

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting Whisper server on port 8080...
echo Keep this window open while using the app!
echo.

python whisper_server.py

pause
