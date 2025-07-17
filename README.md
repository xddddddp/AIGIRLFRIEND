# 🌸 Yuki - Your Local AI Anime Girlfriend

Meet Yuki, your personal anime girlfriend AI with realistic emotions, powered by local AI models (Ollama, Whisper, Coqui TTS). She gets excited when you're sweet and angry when you're mean - just like a real girlfriend!

## ✨ Features

### 🧠 **Local AI Models**
- **Ollama (Mistral)**: For intelligent and expressive chat responses.
- **Whisper**: For accurate local speech-to-text transcription.
- **Coqui TTS**: For high-quality local text-to-speech synthesis.

### 🖼️ **Dynamic Emotions**
- **Happy/Angry visuals**: Character image changes based on the detected emotion in the conversation.
- **Expressive responses**: AI personality adapts to the emotional context.

### 🎤 **Voice Interaction**
- **Speech-to-text**: Talk to Yuki using your microphone.
- **Text-to-speech**: Yuki responds with her synthesized voice.
- **Voice toggle**: Easily enable or disable voice responses.

### 💬 **Chat Interface**
- **Chat messages display**: See your conversation history.
- **Text input**: Type messages if you prefer.

### 💖 **VRM Model Ready**
- **Placeholder for 3D model**: The application is set up to integrate a VRM model, allowing you to easily swap out the 2D image for a full 3D character.

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Ollama**: Download and install from [ollama.ai/download](https://ollama.ai/download).

### Installation & Setup

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/yourusername/yuki-assistant.git
    cd yuki-assistant
    \`\`\`

2.  **Run the setup script:**
    This script will install Python dependencies (Whisper, Coqui TTS, Ollama Python client) and pull the `mistral` model for Ollama.
    \`\`\`bash
    chmod +x scripts/setup-local-ai.sh
    ./scripts/setup-local-ai.sh
    \`\`\`

3.  **Start the Ollama server:**
    Open a **new terminal** and run:
    \`\`\`bash
    ollama serve
    \`\`\`
    Keep this terminal open as long as you want to use Yuki.

4.  **Start the application:**
    Open **another new terminal** in the project root and run:
    \`\`\`bash
    chmod +x start.sh
    ./start.sh
    \`\`\`
    This script will start both the Python backend (FastAPI) and the Next.js frontend.

### First Meeting
1.  Open `http://localhost:3000` in your browser.
2.  Yuki will greet you!
3.  Start chatting with her using your voice or text.

## 🛠️ Troubleshooting

### **Common Issues**

1.  **"Connection Error" banner:**
    *   Ensure the Python backend is running. Check the terminal where you ran `./start.sh` for errors.
    *   Verify Ollama server is running in its dedicated terminal (`ollama serve`).
    *   Check your browser's developer console for more specific network errors.

2.  **"No voice output" / "No transcription":**
    *   Check the terminal where `python3 backend/main.py` is running for errors related to Whisper or Coqui TTS. They might not have installed correctly or might be missing underlying system dependencies (e.g., `ffmpeg` for Whisper).
    *   Ensure your microphone is enabled and accessible by your browser.

3.  **Ollama model not found:**
    *   Make sure you ran `ollama pull mistral` successfully.
    *   Ensure the Ollama server is running (`ollama serve`).

## 🤝 Contributing

Feel free to fork the repository, create feature branches, and submit pull requests!

---

**Made with 💖 for everyone who wants a loving AI companion with a a local voice**
\`\`\`

```plaintext file=".gitignore"
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Temporary files
tmp/
temp/
.tmp/
*.tmp

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# AI Model files (too large for git)
*.pt
*.pth
*.bin
*.safetensors
*.onnx
*.gguf # Ollama models

# Audio files (temporary recordings/TTS outputs)
*.wav
*.mp3
*.ogg
*.flac
*.webm

# Python cache
*.pyc
__pycache__/
.pytest_cache/

# Jupyter notebooks
*.ipynb_checkpoints

# Virtual environments
venv/
env/
ENV/

# Database files
*.db
*.sqlite
*.sqlite3
