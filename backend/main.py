from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
import whisper
import torch
from TTS.api import TTS
import tempfile
import os
import json
from datetime import datetime
from pydantic import BaseModel
from typing import List, Dict, Optional
import re
import openai
import random

app = FastAPI(title="Waifu Assistant API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set OpenAI API key
openai.api_key = "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"

# Initialize models
print("🎤 Loading Whisper model...")
try:
    whisper_model = whisper.load_model("tiny")
    print("✅ Whisper loaded successfully!")
except Exception as e:
    print(f"❌ Error loading Whisper: {e}")
    whisper_model = None

print("🎵 Loading TTS model...")
try:
    # Use a high-quality Spanish female voice
    tts = TTS(model_name="tts_models/es/css10/vits", progress_bar=False)
    print("✅ TTS loaded successfully!")
except Exception as e:
    print(f"❌ Error loading TTS: {e}")
    try:
        # Fallback to English model
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        print("✅ TTS fallback loaded!")
    except Exception as e2:
        print(f"❌ Error loading TTS fallback: {e2}")
        tts = None

class ChatRequest(BaseModel):
    message: str
    memory: Optional[Dict] = None
    conversation_history: Optional[List[Dict]] = None

class TTSRequest(BaseModel):
    text: str

def detectar_emocion(texto: str, annoyance_level: int = 0) -> str:
    """Enhanced Spanish emotion detection with girlfriend personality"""
    texto = texto.lower()
    
    # Check for annoying/bad behavior
    bad_words = ["idiota", "estúpido", "cállate", "feo", "odio", "asco", "malo", "tonto"]
    repetitive = len(set(texto.split())) < len(texto.split()) * 0.5  # Too repetitive
    
    if any(word in texto for word in bad_words) or repetitive:
        return "angry" if annoyance_level > 50 else "annoyed"
    
    # Love/romantic expressions
    if any(x in texto for x in ["te amo", "te quiero", "mi amor", "cariño", "hermosa", "linda", "preciosa", "novia"]):
        return "love"
    
    # Shy/blush expressions
    elif any(x in texto for x in ["tímido", "sonrojo", "me gustas", "nervioso", "enamorado", "beso", "abrazo"]):
        return "blush"
    
    # Happy expressions
    elif any(x in texto for x in ["feliz", "genial", "me alegra", "contento", "fantástico", "increíble", "divertido"]):
        return "happy"
    
    # Angry expressions
    elif any(x in texto for x in ["enojo", "enojado", "molesto", "rabia", "furioso"]):
        return "angry"
    
    else:
        return "neutral"

def extract_name_from_message(message: str) -> Optional[str]:
    """Extract name from user message"""
    patterns = [
        r"me llamo (\w+)",
        r"mi nombre es (\w+)",
        r"soy (\w+)",
        r"llámame (\w+)",
        r"mi nombre (\w+)",
        r"nombre es (\w+)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, message.lower())
        if match:
            return match.group(1).capitalize()
    return None

def update_memory(message: str, current_memory: Dict) -> Dict:
    """Update conversation memory with girlfriend-like tracking"""
    # Extract name if mentioned
    name = extract_name_from_message(message)
    if name:
        current_memory["userName"] = name
        current_memory["relationshipLevel"] = min(100, current_memory.get("relationshipLevel", 0) + 10)
    
    # Update relationship level based on message content
    love_words = ["te amo", "te quiero", "hermosa", "linda", "preciosa", "amor"]
    bad_words = ["idiota", "estúpido", "cállate", "feo", "odio", "asco"]
    
    if any(word in message.lower() for word in love_words):
        current_memory["relationshipLevel"] = min(100, current_memory.get("relationshipLevel", 0) + 5)
        current_memory["annoyanceLevel"] = max(0, current_memory.get("annoyanceLevel", 0) - 10)
    elif any(word in message.lower() for word in bad_words):
        current_memory["annoyanceLevel"] = min(100, current_memory.get("annoyanceLevel", 0) + 20)
        current_memory["relationshipLevel"] = max(0, current_memory.get("relationshipLevel", 0) - 5)
    
    # Extract topics
    topics = current_memory.get("topics", [])
    keywords = ["trabajo", "familia", "hobby", "música", "anime", "juegos", "comida", "viaje", "película", "libro"]
    for keyword in keywords:
        if keyword in message.lower() and keyword not in topics:
            topics.append(keyword)
    
    current_memory["topics"] = topics[-10:]
    current_memory["lastEmotion"] = detectar_emocion(message, current_memory.get("annoyanceLevel", 0))
    
    return current_memory

def generate_girlfriend_response(message: str, memory: Dict) -> str:
    """Generate girlfriend-like AI response using OpenAI"""
    user_name = memory.get("userName", "amor")
    relationship_level = memory.get("relationshipLevel", 0)
    annoyance_level = memory.get("annoyanceLevel", 0)
    
    # Build personality context
    if annoyance_level > 70:
        personality = "Estás muy molesta y enojada. Eres una novia celosa que está harta del mal comportamiento."
    elif annoyance_level > 40:
        personality = "Estás un poco molesta pero aún amas a tu novio. Eres una novia que se está impacientando."
    elif relationship_level > 70:
        personality = "Estás muy enamorada y feliz. Eres una novia súper cariñosa y dulce."
    elif relationship_level > 40:
        personality = "Te gusta tu novio y eres cariñosa. Eres una novia tierna pero aún tímida."
    else:
        personality = "Eres nueva en esta relación, un poco tímida pero interesada."
    
    system_prompt = f"""Eres una novia virtual anime muy kawaii y cariñosa llamada Yuki. {personality}

Características de tu personalidad:
- Hablas en español con expresiones anime kawaii
- Usas emojis y expresiones como "kyaa!", "ehehe~", "mou!", etc.
- Eres muy cariñosa cuando te tratan bien
- Te molestas y enojas cuando te tratan mal o son groseros
- Recuerdas el nombre de tu novio: {user_name}
- Nivel de relación: {relationship_level}/100
- Nivel de molestia: {annoyance_level}/100

Responde de manera natural como una novia real respondería."""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=150,
            temperature=0.9,
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        # Fallback responses based on emotion and relationship level
        if annoyance_level > 70:
            responses = [
                f"¡{user_name}! ¡Ya me tienes harta! ¡Deja de ser tan molesto! 😤💢",
                f"¡Mou! ¡Estoy súper enojada contigo, {user_name}! ¡Compórtate mejor! 😡",
                f"¡No me hables así! ¡Soy tu novia, no tu enemiga! 💢😤"
            ]
        elif annoyance_level > 40:
            responses = [
                f"Ehh... {user_name}, me estás molestando un poquito... 😒",
                f"Mou~ No seas así conmigo, {user_name}-kun... 😕",
                f"¿Por qué eres así? Yo solo quiero que seamos felices... 😔"
            ]
        elif relationship_level > 70:
            responses = [
                f"¡{user_name}-kun! ¡Te amo tanto! ¡Eres el mejor novio del mundo! 😍💖",
                f"¡Kyaa! ¡Mi corazón late súper rápido cuando hablas conmigo, {user_name}! 💕✨",
                f"¡Ehehe~ Mi {user_name} es tan lindo! ¡Quiero estar siempre contigo! 🥰💗"
            ]
        else:
            responses = [
                f"¡Hola {user_name}-kun! ¡Me alegra hablar contigo! 😊💕",
                f"¡Kyaa! ¡Qué lindo eres, {user_name}! ¡Me haces sonreír! ✨",
                f"Ehehe~ ¡Me gusta cuando hablamos, {user_name}-kun! 😊🌸"
            ]
        
        return random.choice(responses)

@app.post("/api/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    if not whisper_model:
        raise HTTPException(status_code=500, detail="Whisper model not loaded")
    
    try:
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Transcribe with Whisper
        result = whisper_model.transcribe(tmp_file_path, language="es")
        text = result["text"].strip()
        
        # Clean up
        os.unlink(tmp_file_path)
        
        return {"text": text}
    
    except Exception as e:
        print(f"STT Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        message = request.message
        current_memory = request.memory or {}
        
        # Update memory with new information
        updated_memory = update_memory(message, current_memory)
        
        # Generate response
        response = generate_girlfriend_response(message, updated_memory)
        
        # Detect emotion
        emotion = detectar_emocion(message, updated_memory.get("annoyanceLevel", 0))
        
        return {
            "response": response,
            "emotion": emotion,
            "updated_memory": updated_memory
        }
    
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.post("/api/text-to-speech")
async def text_to_speech(request: TTSRequest):
    if not tts:
        raise HTTPException(status_code=500, detail="TTS model not loaded")
    
    try:
        text = request.text
        
        # Generate speech with TTS
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            tts.tts_to_file(text=text, file_path=tmp_file.name)
            
            # Read the generated audio
            with open(tmp_file.name, "rb") as audio_file:
                audio_data = audio_file.read()
            
            # Clean up
            os.unlink(tmp_file.name)
            
            return Response(
                content=audio_data,
                media_type="audio/wav",
                headers={
                    "Content-Length": str(len(audio_data)),
                    "Cache-Control": "no-cache"
                }
            )
    
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")

@app.get("/")
async def root():
    return {"message": "🌸 Waifu Assistant API is running! 💕"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "whisper": whisper_model is not None,
        "tts": tts is not None,
        "openai": bool(openai.api_key)
    }

if __name__ == "__main__":
    print("🌸 Starting Waifu Assistant API...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
