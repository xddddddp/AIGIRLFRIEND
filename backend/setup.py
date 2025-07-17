#!/usr/bin/env python3
"""
Setup script for Yuki Assistant local AI stack
"""
import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("📦 Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])
        print("✅ Python dependencies installed!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Python dependencies: {e}")
        print("Please ensure you have Python 3.8+ and pip installed.")
        sys.exit(1)

def setup_ollama_model():
    """Pull Mistral model for Ollama"""
    print("🤖 Checking Ollama installation and pulling Mistral model...")
    try:
        # Check if Ollama is installed
        subprocess.check_output(["ollama", "--version"])
        print("✅ Ollama is installed.")
    except FileNotFoundError:
        print("⚠️ Ollama not found. Please install Ollama from https://ollama.ai/download")
        print("You can also run the `scripts/setup-local-ai.sh` script.")
        return

    try:
        print("Pulling Mistral model (this may take a while)...")
        subprocess.check_call(["ollama", "pull", "mistral"])
        print("✅ Mistral model pulled successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to pull Mistral model: {e}")
        print("Please ensure Ollama server is running (`ollama serve`) and you have an internet connection.")

def main():
    print("🌸 Setting up Yuki Assistant local AI stack...")
    print("💕 Your anime girlfriend is getting ready!")
    
    # Install requirements
    install_requirements()
    
    # Setup Ollama model
    setup_ollama_model()
    
    print("\n✅ Setup complete!")
    print("\n🚀 To start your anime girlfriend:")
    print("1. Start Ollama server: `ollama serve` (in a separate terminal)")
    print("2. Run the combined start script: `./start.sh`")
    print("\n💖 Features:")
    print("🧠 Local Mistral LLM via Ollama for intelligent responses")
    print("🎙️ Local Whisper for speech recognition")
    print("🎤 Local Coqui TTS for voice synthesis")
    print("\n💕 Enjoy chatting with Yuki!")

if __name__ == "__main__":
    main()
