@echo off
title Pumping Lemma Simulator - Windows Build
if not exist package.json (
  echo Please run this file from the Pumping Lemma Simulator folder.
  pause
  exit /b 1
)
echo Installing desktop-app dependencies...
npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Make sure Node.js LTS and internet access are available.
  pause
  exit /b 1
)
echo.
echo Starting the desktop app for testing...
call npm start
