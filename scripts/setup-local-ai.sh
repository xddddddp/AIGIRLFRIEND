#!/bin/bash

# Setup script for local AI stack
echo "Setting up local AI stack for Waifu Assistant..."

# Install Python dependencies
echo "Installing Python dependencies..."
python3 -m pip install -r backend/requirements.txt

# Install Ollama (if not already installed)
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "Ollama is already installed."
fi

# Pull Mistral model for Ollama
echo "Pulling Mistral model (this may take a while)..."
ollama pull mistral

# Test Whisper installation
echo "Testing Whisper installation..."
python3 -c "import whisper; print('Whisper installed successfully.')" || echo "Whisper test failed."

# Test Coqui TTS installation
echo "Testing Coqui TTS installation..."
python3 -c "from TTS.api import TTS; tts = TTS(model_name='tts_models/en/ljspeech/tacotron2-DDC', progress_bar=False); print('Coqui TTS installed successfully.')" || echo "Coqui TTS test failed."

echo "Setup complete! You can now run the Waifu Assistant."
echo ""
echo "To start the application:"
echo "1. Start Ollama server: `ollama serve` (in a separate terminal)"
echo "2. Run the combined start script: `./start.sh`"
