@echo off
setlocal
cd /d "%~dp0"
set "LAB_NODE=node"
where node >nul 2>&1
if errorlevel 1 set "LAB_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%LAB_NODE%" -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)" >nul 2>&1
if errorlevel 1 (
  echo Node.js 24 vagy ujabb szukseges. Telepitsd a hivatalos nodejs.org oldalrol.
  pause
  exit /b 1
)
echo IMPAVIDUS LAB - nyisd meg: http://127.0.0.1:8082
echo A szerver leallitasa: Ctrl+C. Az ablakot hagyd nyitva hasznalat kozben.
"%LAB_NODE%" server.js
if errorlevel 1 pause
endlocal
