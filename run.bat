@echo off
echo ============================================================
echo   Starting Orange Smart Support Agent System
echo ============================================================

cd /d "%~dp0"

echo 1. Seeding Knowledge Base and Database...
set PYTHONPATH=backend
py backend\app\seed.py

echo 2. Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Orange Support Backend" cmd /k "set PYTHONPATH=backend && py -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

echo 3. Launching React Frontend on http://localhost:5173 ...
start "Orange Support Frontend" cmd /k "cd frontend && npm run dev"

echo ============================================================
echo   All services launched!
echo   Frontend: http://localhost:5173
echo   Backend Swagger Docs: http://127.0.0.1:8000/docs
echo ============================================================
pause
