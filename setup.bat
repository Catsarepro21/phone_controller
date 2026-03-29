@echo off
setlocal

echo ============================================
echo  PC Remote - One-Time Setup
echo  Run this ONCE on each new PC you set up.
echo  (Requires Administrator privileges)
echo ============================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: Please right-click this file and choose
    echo "Run as administrator", then try again.
    pause
    exit /b 1
)

:: ── Step 1: Install Python ───────────────────────────────────
echo [1/3] Checking for Python...
python --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Python not found. Installing via winget...
    winget install -e --id Python.Python.3 --silent --accept-source-agreements --accept-package-agreements
    if %errorLevel% NEQ 0 (
        echo ERROR: Python installation failed. Please install manually from python.org
        pause
        exit /b 1
    )
    echo Python installed successfully.
) else (
    echo Python already installed. Skipping.
)
echo.

:: ── Step 2: Install Tailscale ─────────────────────────────────
echo [2/3] Checking for Tailscale...
winget list --id Tailscale.Tailscale >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Tailscale not found. Installing...
    winget install -e --id Tailscale.Tailscale --silent --accept-source-agreements --accept-package-agreements
    if %errorLevel% NEQ 0 (
        echo ERROR: Tailscale installation failed. Please install manually from tailscale.com
        pause
        exit /b 1
    )
    echo Tailscale installed! Please sign in via the Tailscale tray icon after setup.
) else (
    echo Tailscale already installed. Skipping.
)
echo.


:: ── Install Python packages ────────────────────────────────────
echo Installing required Python packages...
python -m pip install -r "%~dp0requirements.txt" --quiet
echo.

:: ── Step 4: Auto-Launch on Startup ─────────────────────────────
echo [4/4] Adding PC Remote to Windows Startup...
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_BAT=%~dp0start_server_silent.bat"
set "SHORTCUT_NAME=PC Remote Server.lnk"

powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut('%STARTUP_FOLDER%\%SHORTCUT_NAME%'); $shortcut.TargetPath = '%TARGET_BAT%'; $shortcut.WorkingDirectory = '%~dp0'; $shortcut.WindowStyle = 7; $shortcut.Save()" >nul 2>&1

if %errorLevel% EQU 0 (
    echo Auto-startup enabled! Server will launch invisibly when you log in.
) else (
    echo WARNING: Failed to create startup shortcut.
)
echo.
echo ============================================
echo  Setup Complete!
echo.
echo  Next steps:
echo  1. Open Tailscale from the system tray
echo     and sign in with your account.
echo  2. Ask your admin to enable HTTPS certs
echo     at: https://login.tailscale.com/admin/dns
echo  3. Double-click start_server.bat to launch!
echo ============================================
echo.
pause
