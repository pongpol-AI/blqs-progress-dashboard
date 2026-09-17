@echo off
title BLQS Progress Monitor
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:9010"
python -m http.server 9010
