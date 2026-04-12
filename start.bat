@echo off
echo ===================================================
echo   Starting FinSight...
echo ===================================================
echo.

echo Launching Backend Server...
start "FinSight Backend" cmd /c "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

echo Launching Frontend Server...
start "FinSight Frontend" cmd /c "cd frontend && npm cache clean --force && npm run dev"

echo.
echo Both servers are spinning up in separate windows!
echo You can close this window now.
pause
