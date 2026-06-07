@echo off
cd /d "%~dp0"
set NEXT_TURBOPACK_BENCHMARK_FILE_WARN_THRESHOLD_MS=10000
start "YasmineStack Dashboard" cmd /c "npm run dev & pause"
timeout /t 5 /nobreak >nul
start http://localhost:3000
