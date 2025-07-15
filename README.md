# 🌸 Waifu Assistant - Local AI Girlfriend

A cute anime-style AI girlfriend that runs completely locally on your PC. Features real-time voice interaction, emotion detection, relationship tracking, and girlfriend-like personality with mood changes.

![Waifu Assistant](https://via.placeholder.com/400x800/9333ea/ffffff?text=Waifu+Assistant+Mobile)

## ✨ Features

- 💕 **Girlfriend Personality**: Acts like a real anime girlfriend with emotions and moods
- 🎤 **Voice Interaction**: Real-time speech-to-text and text-to-speech
- 😊 **Dynamic Emotions**: 6 different emotions (neutral, happy, blush, angry, love, annoyed)
- 🧠 **Relationship Memory**: Tracks your name, relationship level, and annoyance level
- 📱 **Mobile Optimized**: Phone-width design ready for iOS/Android
- 🔧 **Fully Local**: No internet required after setup
- 🎭 **VRM Ready**: Placeholder system ready for VRoid Studio models
- 💢 **Mood System**: Gets mad at bad behavior, loves good treatment

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Microphone access

### One-Command Setup

\`\`\`bash
git clone https://github.com/yourusername/waifu-assistant.git
cd waifu-assistant
chmod +x start.sh
./start.sh
\`\`\`

### Manual Setup

1. **Clone and install**
   \`\`\`bash
   git clone https://github.com/yourusername/waifu-assistant.git
   cd waifu-assistant
   pip install -r backend/requirements.txt
   npm install
   \`\`\`

2. **Download AI models**
   \`\`\`bash
   python backend/setup.py
   \`\`\`

3. **Start servers**
   \`\`\`bash
   # Terminal 1: Backend
   python backend/main.py
   
   # Terminal 2: Frontend  
   npm run dev
   \`\`\`

4. **Open app**
   Navigate to `http://localhost:3000`

## 💕 How to Use

### First Meeting
- She'll greet you and ask for your name
- Be nice and she'll love you more! 💖
- Be mean and she'll get annoyed! 😤

### Relationship System
- **Love Level**: Increases with compliments and kindness
- **Annoyance Level**: Increases with rude behavior
- **Memory**: Remembers your name and conversation topics

### Voice Commands
- Click microphone to talk
- She responds with voice automatically
- Toggle speaker icon to mute/unmute

### Personality Traits
- **Happy** when you're sweet to her
- **Blushing** when you flirt or compliment
- **Angry** when you're rude or annoying  
- **In Love** when relationship level is high
- **Annoyed** when you're being obnoxious

## 🎭 Emotions & Responses

| Emotion | Triggers | Example Response |
|---------|----------|------------------|
| 💖 Love | "te amo", "hermosa", "preciosa" | "¡Kyaa! ¡Te amo tanto, mi amor! 😍💖" |
| 😊 Happy | "feliz", "genial", "increíble" | "¡Ehehe~ Me alegra verte tan contento! ✨" |
| 😊💕 Blush | "me gustas", "beso", "abrazo" | "¡Kyaa! ¡Me haces sonrojar! 😊💕" |
| 😤 Angry | "idiota", "estúpido", "cállate" | "¡Mou! ¡Ya me tienes harta! 😤💢" |
| 😒 Annoyed | Repetitive or boring messages | "Ehh... me estás molestando un poquito... 😒" |

## 🔧 Technical Stack

### Frontend (Mobile-Optimized)
- **Next.js 14** with TypeScript
- **Tailwind CSS** for mobile-first design
- **Web APIs** for microphone and audio
- **Phone-width layout** (max-width: 400px)

### Backend (Local AI)
- **FastAPI** for REST API
- **OpenAI Whisper (Tiny)** for speech-to-text
- **Coqui TTS** with Spanish voice models
- **OpenAI GPT-3.5** for girlfriend personality
- **Custom emotion detection** in Spanish

### AI Models Used
- **Whisper Tiny**: Fast speech recognition
- **Coqui TTS Spanish**: High-quality Spanish voice
- **GPT-3.5 Turbo**: Girlfriend personality responses
- **Custom NLP**: Spanish emotion detection

## 📱 Mobile Features

- **Phone-optimized UI** (400px width)
- **Touch-friendly buttons** 
- **Safe area support** for iOS
- **Responsive design**
- **Optimized for portrait mode**

## 🎮 Personality Examples

### When you're sweet:
**You**: "Hola hermosa, te amo"  
**Her**: "¡Kyaa! ¡Mi corazón late súper rápido! ¡Te amo tanto, mi amor! 😍💖"

### When you're rude:
**You**: "Eres estúpida"  
**Her**: "¡Mou! ¡Ya me tienes harta! ¡Deja de ser tan molesto! 😤💢"

### When you're boring:
**You**: "hola hola hola hola"  
**Her**: "Ehh... me estás molestando un poquito... 😒"

## 🛠️ Customization

### Add More Emotions
Edit `detectar_emocion()` in `backend/main.py`:

```python
def detectar_emocion(texto: str, annoyance_level: int = 0) -> str:
    # Add your custom emotions here
    if "triste" in texto.lower():
        return "sad"
