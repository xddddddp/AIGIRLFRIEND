#!/usr/bin/env python3
"""
Setup script for Waifu Assistant
"""
import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("📦 Installing Python requirements...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def download_models():
    """Download required models"""
    print("🎤 Downloading Whisper model...")
    try:
        import whisper
        whisper.load_model("tiny")
        print("✅ Whisper model downloaded!")
    except Exception as e:
        print(f"❌ Error downloading Whisper: {e}")
    
    print("🎵 Downloading TTS model...")
    try:
        from TTS.api import TTS
        # Download Spanish voice model
        TTS(model_name="tts_models/es/css10/vits", progress_bar=True)
        print("✅ Spanish TTS model downloaded!")
    except Exception as e:
        print(f"⚠️ Spanish TTS failed, trying English fallback: {e}")
        try:
            TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=True)
            print("✅ English TTS model downloaded!")
        except Exception as e2:
            print(f"❌ Error downloading TTS: {e2}")

def main():
    print("🌸 Setting up Waifu Assistant...")
    print("💕 This may take a few minutes to download models...")
    
    # Install requirements
    install_requirements()
    
    # Download models
    download_models()
    
    print("\n✅ Setup complete!")
    print("\n🚀 To start the application:")
    print("1. Backend: python backend/main.py")
    print("2. Frontend: npm run dev")
    print("\n💖 Enjoy your waifu assistant!")

if __name__ == "__main__":
    main()
