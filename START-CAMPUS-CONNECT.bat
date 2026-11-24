@echo off
title Campus Connect Startup
color 0A
echo ====================================
echo   CAMPUS CONNECT - AUTO STARTUP
echo ====================================
echo.

REM Check if XAMPP is installed
if not exist "C:\xampp\mysql_start.bat" (
    echo WARNING: XAMPP not found at C:\xampp\
    echo Please start XAMPP MySQL manually
    echo.
    pause
) else (
    echo [1/4] Starting XAMPP MySQL...
    start "" "C:\xampp\xampp-control.exe"
    timeout /t 5 /nobreak >nul
    echo     MySQL starting... (Check XAMPP Control Panel)
    echo.
)

echo [2/4] Starting Campus Connect Server...
cd /d "d:\College minor project"
start "Campus Connect Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
echo     Server starting on http://localhost:3000
echo.

echo [3/4] Starting ngrok tunnel...
start "ngrok Tunnel" cmd /k "ngrok http 3000"
timeout /t 3 /nobreak >nul
echo     ngrok tunnel starting...
echo.

echo ====================================
echo   STARTUP COMPLETE!
echo ====================================
echo.
echo WHAT TO DO NOW:
echo 1. Check XAMPP Control Panel - Make sure MySQL is GREEN
echo 2. Check "Campus Connect Server" window - Wait for database connected
echo 3. Check "ngrok Tunnel" window - Copy the Forwarding URL
echo 4. Share the ngrok URL with your friends!
echo.
echo DEFAULT LOGIN CREDENTIALS:
echo   Admin:   admin / admin123
echo   Staff:   staff1 / staff123
echo   Student: student1 / student123
echo.
echo Keep all windows open while testing!
echo ====================================
pause
