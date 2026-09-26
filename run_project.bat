@echo off
echo ========================================================
echo               Starting ShopSphere Platform
echo ========================================================

echo.
echo [1/2] Initializing Backend...
cd /d "%~dp0Backend"

if not exist ".env" (
    if exist ".env.example" (
        echo Copying .env.example to .env...
        copy .env.example .env >nul
    )
)

if not exist "venv\" (
    echo Creating Python virtual environment...
    python -m venv venv
)

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Failed to find virtual environment activation script. Make sure Python is installed.
)

echo Installing backend requirements...
pip install -r requirements.txt

echo Running database migrations...
python manage.py migrate

echo Starting Django server in a new window...
start "ShopSphere - Backend Server" cmd /k "call venv\Scripts\activate.bat && python manage.py runserver"

echo.
echo [2/2] Initializing Frontend...
cd /d "%~dp0Frontend"

if not exist ".env" (
    if exist ".env.example" (
        echo Copying .env.example to .env...
        copy .env.example .env >nul
    )
)

echo Installing frontend dependencies...
call npm install

echo Starting Vite frontend server in a new window...
start "ShopSphere - Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================================
echo  Both servers are starting up in separate windows!
echo  Frontend : http://localhost:5173/
echo  Backend  : http://127.0.0.1:8000/
echo ========================================================
pause
