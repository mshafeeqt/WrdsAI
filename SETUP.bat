@echo off
REM CARBON-CHATBOT Setup Script for Windows

echo.
echo ============================================
echo  CARBON-CHATBOT - Startup Script
echo ============================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js installed
echo.

REM Check current directory
echo [*] Current Directory: %cd%
echo.

REM Install Backend Dependencies
echo ============================================
echo Installing Backend Dependencies...
echo ============================================
cd chatbot-backend
if not exist node_modules (
    echo [*] Running: npm install
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo [✓] Backend dependencies installed
) else (
    echo [✓] Backend dependencies already installed
)
cd ..
echo.

REM Install Frontend Dependencies
echo ============================================
echo Installing Frontend Dependencies...
echo ============================================
cd chatbot-frontend
if not exist node_modules (
    echo [*] Running: npm install
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo [✓] Frontend dependencies installed
) else (
    echo [✓] Frontend dependencies already installed
)
cd ..
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next steps:
echo.
echo 1. IMPORTANT: Create .env file in chatbot-backend/
echo    Copy the template below into chatbot-backend\.env:
echo.
echo    ---START .env TEMPLATE---
echo    MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/carbon-chatbot
echo    OPENAI_API_KEY=sk-proj-your-key-here
echo    OPENAI_FREE_API_KEY=sk-proj-your-key-here
echo    SERPER_API_KEY=your-new-serper-key-here
echo    RAZORPAY_KEY_ID=rzp_test_xxxxx
echo    RAZORPAY_KEY_SECRET=xxxxx
echo    CLOUDINARY_NAME=your-cloudinary-name
echo    CLOUDINARY_API_KEY=xxxxx
echo    CLOUDINARY_API_SECRET=xxxxx
echo    BREVO_API_KEY=xxxxx
echo    FRONTEND_URL=http://localhost:5173
echo    GROK_API_KEY=sk-proj-your-key-here
echo    ---END .env TEMPLATE---
echo.
echo 2. To start Backend:
echo    cd chatbot-backend
echo    npm run dev
echo.
echo 3. To start Frontend (in NEW terminal):
echo    cd chatbot-frontend
echo    npm run dev
echo.
echo 4. Frontend will run on: http://localhost:5173
echo    Backend API: http://localhost:8080
echo.
echo ============================================
pause
