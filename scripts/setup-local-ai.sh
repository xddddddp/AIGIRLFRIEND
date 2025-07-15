#!/bin/bash

# Setup script for local AI stack
echo "Setting up local AI stack for Waifu Assistant..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install openai-whisper
pip install TTS

# Install Ollama (if not already installed)
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Pull Mistral model for Ollama
echo "Pulling Mistral model..."
ollama pull mistral

# Test Whisper installation
echo "Testing Whisper installation..."
whisper --help

# Test Coqui TTS installation
echo "Testing Coqui TTS installation..."
tts --help

echo "Setup complete! You can now run the Waifu Assistant."
echo ""
echo "To start the application:"
echo "1. npm install"
echo "2. npm run dev"
echo ""
echo "Make sure Ollama is running: ollama serve"
