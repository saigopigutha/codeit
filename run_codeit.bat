@echo off
rem Install dependencies
cd /d "c:\saigopi\New folder\codeit"
if not exist node_modules (
  echo Installing npm packages...
  npm install
) else (
  echo Packages already installed.
)

rem Run both frontend and backend concurrently
echo Starting development servers...
npm run dev
