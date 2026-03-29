@echo off
echo Cleaning up any old instances...
FOR /F "tokens=5" %%T IN ('netstat -ano ^| findstr :8000') DO taskkill /F /PID %%T >nul 2>&1

echo Starting PC Remote Server...
cd /d "%~dp0"
python run.py
pause
