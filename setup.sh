#!/bin/bash

# PrepVision 2.0 Setup Script

echo "🚀 Setting up PrepVision 2.0..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep mongod &> /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB before continuing."
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Setup environment files
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment variables..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
fi

if [ ! -f client/.env ]; then
    cp client/.env.example client/.env
    echo "✅ Created client .env file."
fi

# Create uploads directory
mkdir -p uploads
echo "📁 Created uploads directory."

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your MongoDB URI and Gemini API key"
echo "2. Start MongoDB if not running: mongod"
echo "3. Run development server: npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""