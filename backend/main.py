from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
import uvicorn
import tempfile
import os
import json
from datetime import datetime
from pydantic import BaseModel
from typing import List, Dict, Optional
import re
import random
import io
import asyncio

# Local AI imports
try:
    import whisper
    WHISPER_AVAILABLE = True
    print("✅ Whisper model loaded successfully.")
except Exception as e:
    print(f"⚠️ Whisper not available: {e}. Speech-to-text will use fallback.")
    WHISPER_AVAILABLE = False

try:
    from TTS.api import TTS
    coqui_tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
    COQUI_AVAILABLE = True
    print("✅ Coqui TTS initialized successfully.")
except Exception as e:
    print(f"⚠️ Coqui TTS not available: {e}. Text-to-speech will use fallback.")
    COQUI_AVAILABLE = False

try:
    from ollama import Client
    ollama_client = Client(host='http://localhost:11434') # Default Ollama host
    OLLAMA_AVAILABLE = True
    print("✅ Ollama client initialized successfully.")
except Exception as e:
    print(f"⚠️ Ollama client not available: {e}. Chat will use fallback.")
    OLLAMA_AVAILABLE = False

app = FastAPI(title="Yuki Assistant Local API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    memory: Optional[Dict] = None
    conversation_history: Optional[List[Dict]] = None

class TTSRequest(BaseModel):
    text: str

def detectar_emocion(texto: str) -> str:
    """Enhanced Spanish emotion detection"""
    texto = texto.lower()
    
    # Angry indicators
    angry_words = [
        "enojado", "molesto", "furioso", "odio", "idiota", "estúpido", "malo",
        "horrible", "terrible", "asco", "mierda", "joder", "angry", "mad",
        "hate", "stupid", "bad", "terrible", "shit"
    ]

    # Happy indicators
    happy_words = [
        "feliz", "contento", "alegre", "genial", "fantástico", "increíble",
        "amor", "cariño", "hermosa", "linda", "bien", "bueno", "excelente",
        "happy", "great", "awesome", "love", "good", "excellent", "wonderful"
    ]

    has_angry_words = any(word in texto for word in angry_words)
    has_happy_words = any(word in texto for word in happy_words)

    if has_angry_words: return "angry"
    if has_happy_words: return "happy"
    
    return "happy" # Default to happy for neutral messages

def generate_yuki_response(message: str, emotion: str) -> str:
    """Generate Yuki's AI response using Ollama with enhanced personality"""
    
    personality = (
        "Eres Yuki, una novia virtual anime súper kawaii y feliz. Responde de manera muy dulce, cariñosa y entusiasta. "
        "Usa expresiones como 'kyaa!', 'ehehe~', '¡qué lindo!'. Eres muy amorosa y expresiva."
    )
    if emotion == "angry":
        personality = (
            "Eres Yuki y estás ENOJADA. Responde de manera molesta pero aún cariñosa. "
            "Usa expresiones como 'mou!', '¡estoy molesta!', pero no seas muy cruel. "
            "Mantén el amor pero muestra tu enojo."
        )

    system_prompt = f"""{personality} Responde en español. Máximo 2 oraciones. Sé muy expresiva emocionalmente."""

    if OLLAMA_AVAILABLE:
        try:
            response = ollama_client.chat(
                model="mistral", # Ensure 'mistral' model is pulled in Ollama
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                options={"temperature": 0.9, "num_predict": 150} # num_predict for max_tokens
            )
            return response['message']['content'].strip()
        except Exception as e:
            print(f"Ollama API Error: {e}")
            OLLAMA_AVAILABLE = False # Disable Ollama if it fails
    
    # Fallback responses if Ollama is not available or fails
    fallbacks = {
        "happy": [
            "¡Kyaa! ¡Eres tan lindo! Me haces muy feliz 💕",
            "¡Ehehe~ Me encanta hablar contigo! ¡Eres increíble! ✨",
            "¡Waa! ¡Qué emocionante! ¡Me alegra mucho verte! 😊",
        ],
        "angry": [
            "¡Mou! ¡Estoy un poco molesta contigo! 😤",
            "¡Hmph! ¡No me hables así! ¡Pero... aún te quiero! 💢",
            "¡Estoy enojada! ¡Pero no puedo estar mad contigo por mucho tiempo! 😠💕",
        ],
    }
    return random.choice(fallbacks[emotion])

@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    try:
        if not WHISPER_AVAILABLE:
            raise Exception("Whisper not available, using fallback.")

        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Load the Whisper model (can be 'tiny', 'base', 'small', 'medium', 'large')
            # For local, 'tiny' is fastest but less accurate. 'base' is a good balance.
            model = whisper.load_model("base") 
            result = model.transcribe(tmp_file_path, language="es")
            text = result["text"].strip()
            
            return {"ok": True, "text": text}
        except Exception as e:
            print(f"Whisper transcription error: {e}")
            raise # Re-raise to trigger outer fallback
        finally:
            # Clean up
            os.unlink(tmp_file_path)
    
    except Exception as e:
        print(f"STT Error: {e}")
        # Fallback responses for development
        fallback_responses = [
            "Hola, ¿cómo estás?",
            "Me siento genial hoy",
            "¿Puedes ayudarme?",
            "Estoy un poco nervioso",
            "Me gustas mucho",
            "Estoy enojado",
            "Me alegra hablar contigo",
        ]
        return {"ok": True, "text": random.choice(fallback_responses), "fallback": True}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        message = request.message
        
        # Detect emotion from user message
        emotion = detectar_emocion(message)
        
        # Generate response
        response_text = generate_yuki_response(message, emotion)
        
        return {
            "response": response_text,
            "emotion": emotion,
        }
    
    except Exception as e:
        print(f"Chat Error: {e}")
        # Return fallback response
        return {
            "response": "¡Ay no! Parece que tengo problemas técnicos... ¡Pero aún te amo! 💕",
            "emotion": "happy",
        }

@app.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    try:
        text = request.text
        
        if not COQUI_AVAILABLE:
            raise Exception("Coqui TTS not available, using silence fallback.")

        # Create temporary file for Coqui output
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            output_path = tmp_file.name
        
        try:
            # Generate speech with Coqui TTS
            coqui_tts.tts_to_file(text=text, file_path=output_path)
            
            # Read the generated audio file
            with open(output_path, "rb") as audio_file:
                audio_content = audio_file.read()
            
            return Response(
                content=audio_content,
                media_type="audio/wav",
                headers={"X-TTS-Source": "Coqui"}
            )
            
        except Exception as coqui_error:
            print(f"Coqui TTS generation failed: {coqui_error}")
            raise # Re-raise to trigger outer fallback
        finally:
            # Clean up temporary file
            os.unlink(output_path)
    
    except Exception as e:
        print(f"Text-to-speech Error: {e}")
        # Final fallback - return a small silent WAV
        SILENT_WAV = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        return Response(
            content=SILENT_WAV,
            media_type="audio/wav",
            headers={"X-TTS-Source": "SilenceFallback"}
        )

@app.get("/")
async def root():
    return {"message": "🌸 Yuki Assistant Local API is running! 💕"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "whisper_available": WHISPER_AVAILABLE,
        "coqui_available": COQUI_AVAILABLE,
        "ollama_available": OLLAMA_AVAILABLE
    }

if __name__ == "__main__":
    print("🌸 Starting Yuki Assistant Local API...")
    print("💕 Ready to chat with your anime girlfriend!")
    print(f"🔧 Whisper STT: {'✅' if WHISPER_AVAILABLE else '❌ (using fallback)'}")
    print(f"🔧 Coqui TTS: {'✅' if COQUI_AVAILABLE else '❌ (using fallback)'}")
    print(f"🔧 Ollama Chat: {'✅' if OLLAMA_AVAILABLE else '❌ (using fallback)'}")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
