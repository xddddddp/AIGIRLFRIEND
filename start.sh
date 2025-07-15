#!/bin/bash

echo "🌸 Starting Waifu Assistant..."

# Check if Python backend dependencies are installed
if ! python -c "import fastapi, whisper, TTS" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    python backend/setup.py
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🚀 Starting backend server..."
python backend/main.py &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID
