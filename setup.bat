@echo off
echo 🚀 Setting up PrepVision 2.0...

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is required but not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Install server dependencies
echo 📦 Installing server dependencies...
call npm install

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
call npm install
cd ..

REM Setup environment files
if not exist .env (
    echo ⚙️  Setting up environment variables...
    copy .env.example .env
    echo ✅ Created .env file. Please edit it with your configuration.
)

if not exist client\.env (
    copy client\.env.example client\.env
    echo ✅ Created client .env file.
)

REM Create uploads directory
if not exist uploads mkdir uploads
echo 📁 Created uploads directory.

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file and add your MongoDB URI and Gemini API key
echo 2. Start MongoDB if not running
echo 3. Run development server: npm run dev
echo.
echo 🌐 Application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
pause