@echo off
title Launching Meldify AI Workspace
echo.

:: === Step 1: Start Ollama Backend ===
echo [1/5] Starting Ollama backend...
start "" cmd /k "ollama serve"
timeout /t 2 >nul

:: === Step 2: Run Deepseek-Coder Model ===
echo [2/5] Starting Deepseek-Coder model...
start "" cmd /k "ollama run deepseek-coder"
timeout /t 2 >nul

:: === Step 3: Start AnythingLLM Docker container ===
echo [3/5] Starting AnythingLLM container...
docker start anythingllm >nul 2>&1
timeout /t 3 >nul

:: === Step 4: Ingest Meldify files ===
echo [4/5] Syncing Meldify project files...
powershell -ExecutionPolicy Bypass -File "K:\Development-2025\Meldify\ingest-meldify.ps1"
timeout /t 2 >nul

:: === Step 5: Open AnythingLLM Workspace ===
echo [5/5] Opening AnythingLLM workspace in browser...
start http://localhost:3001/workspace/Meldify

echo Done!
exit
