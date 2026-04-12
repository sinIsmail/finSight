@echo off
echo ===================================================
echo   FinSight Automated Setup Script
echo ===================================================
echo.

echo [1/5] Installing Frontend Node Packages...
cd frontend
call npm install
cd ..
echo Frontend installation complete!
echo.

echo [2/5] Setting up Python Virtual Environment (backend\venv)...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
echo Virtual environment created and activated!
echo.

echo [3/5] Installing Backend Python Packages...
pip install -r requirements.txt
echo Backend installation complete!
cd ..
echo.

echo [4/5] Creating .gitignore file...
echo frontend/node_modules/ > .gitignore
echo frontend/dist/ >> .gitignore
echo backend/venv/ >> .gitignore
echo backend/__pycache__/ >> .gitignore
echo .env >> .gitignore
echo .gitignore created successfully!
echo.

echo [5/5] GitHub Repository Setup...
echo Create an empty repository on GitHub and paste the URL below.
set /p GITHUB_URL="Paste your GitHub link (or press Enter to skip): "

if "%GITHUB_URL%"=="" (
    echo Skipping GitHub setup...
) else (
    echo Initializing Git and pushing code to GitHub...
    git init
    git add .
    git commit -m "Initial FinSight commit"
    git branch -M main
    git remote add origin %GITHUB_URL%
    git push -u origin main
    echo.
    echo Code successfully pushed to GitHub!
)

echo.
echo ===================================================
echo   Setup Complete! You are ready to go.
echo ===================================================
echo.
echo To run the application:
echo.
echo 1. Start the Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 2. Start the Backend:
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn main:app --reload
echo ===================================================
pause