@echo off
:: Change to the directory of this script
cd /d "%~dp0"

:: Start desktop.py in a new window with venv activated
start "Desktop App" cmd /k "call venv\Scripts\activate.bat && python desktop.py"

:: Start cloudflared tunnel in a new window
start "Cloudflare Tunnel" cmd /k "call cloudflared tunnel run <Your Tunnel Name>"
