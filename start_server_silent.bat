@echo off
:: Launches the PC Remote server silently in the background (no visible window)
:: Place a shortcut to this file in shell:startup to auto-start on Windows login

:: Kill any existing server running on port 8000 to prevent collisions
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr :8000') DO taskkill /F /PID %%A >nul 2>&1

set SERVER_DIR=%~dp0

:: Use PowerShell to launch with a hidden window, so no terminal appears
powershell -WindowStyle Hidden -Command "Start-Process python -ArgumentList 'run.py' -WorkingDirectory '%SERVER_DIR%' -WindowStyle Hidden"
