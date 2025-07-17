#!/bin/bash

echo "🌸 Starting Waifu Assistant..."

# Check if Python backend dependencies are installed
if [ ! -f "backend/requirements.txt" ]; then
    echo "Error: backend/requirements.txt not found. Please ensure you are in the project root."
    exit 1
fi

# Check if Python dependencies are installed
if ! python3 -c "import fastapi, uvicorn, whisper, TTS, ollama" 2>/dev/null; then
    echo "📦 Python dependencies not fully installed. Running backend/setup.py..."
    python3 backend/setup.py
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🚀 Starting backend server..."
# Ensure the backend runs in the background
python3 backend/main.py &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5 # Give FastAPI a moment to start

echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "IMPORTANT: Make sure Ollama server is running in a separate terminal: `ollama serve`"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to clean up background processes on exit
cleanup() {
    echo "Stopping backend (PID: $BACKEND_PID) and frontend (PID: $FRONTEND_PID)..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo "Servers stopped."
}

# Trap Ctrl+C and call cleanup function
trap cleanup SIGINT

# Wait for background processes to finish (or for Ctrl+C)
wait $BACKEND_PID $FRONTEND_PID
