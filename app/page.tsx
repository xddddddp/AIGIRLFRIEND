"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Volume2, Mic, Square, Send, VolumeX, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"

type Emotion = "neutral" | "happy" | "blush" | "angry" | "love" | "annoyed"

interface Message {
  text: string
  isUser: boolean
  timestamp: Date
}

interface ConversationMemory {
  userName?: string
  topics: string[]
  preferences: string[]
  lastEmotion: Emotion
  relationshipLevel: number // 0-100
  annoyanceLevel: number // 0-100
}

export default function WaifuAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>("neutral")
  const [currentMessage, setCurrentMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [memory, setMemory] = useState<ConversationMemory>({
    topics: [],
    preferences: [],
    lastEmotion: "neutral",
    relationshipLevel: 0,
    annoyanceLevel: 0,
  })
  const [hasGreeted, setHasGreeted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [connectionError, setConnectionError] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    // Initial greeting
    if (!hasGreeted) {
      setTimeout(() => {
        const greeting = "¡Hola mi amor! 💕 Soy tu novia virtual~ ¿Cómo te llamas, cariño? ¡Quiero conocerte mejor! ✨"
        setCurrentMessage(greeting)
        setMessages([{ text: greeting, isUser: false, timestamp: new Date() }])
        setEmotion("love")
        setHasGreeted(true)

        if (voiceEnabled) {
          speakText(greeting)
        }
      }, 1000)
    }
  }, [hasGreeted, voiceEnabled])

  const speakText = async (text: string) => {
    if (!voiceEnabled) return

    try {
      setIsSpeaking(true)
      const response = await fetch("http://localhost:8000/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        const audioBlob = new Blob([audioBuffer], { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)

        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
          }
          audioRef.current.onerror = () => {
            console.error("Audio playback error")
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
          }
          await audioRef.current.play()
        }
      } else {
        throw new Error("TTS response not ok")
      }
    } catch (error) {
      console.error("Error playing speech:", error)
      setIsSpeaking(false)
      setConnectionError(true)
    }
  }

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(1000) // Record in 1-second chunks
      setIsListening(true)
      setConnectionError(false)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("No se pudo acceder al micrófono. Por favor, permite el acceso.")
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "audio.webm")

      const sttResponse = await fetch("http://localhost:8000/api/speech-to-text", {
        method: "POST",
        body: formData,
      })

      if (!sttResponse.ok) {
        throw new Error(`STT Error: ${sttResponse.status}`)
      }

      const { text: userText } = await sttResponse.json()

      if (userText && userText.trim()) {
        await processMessage(userText.trim())
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      setConnectionError(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const processMessage = async (message: string) => {
    setIsProcessing(true)

    try {
      // Add user message
      const userMessage: Message = { text: message, isUser: true, timestamp: new Date() }
      setMessages((prev) => [...prev, userMessage])

      // Send to AI with memory context
      const chatResponse = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          memory,
          conversation_history: messages.slice(-10), // Last 10 messages for context
        }),
      })

      if (!chatResponse.ok) {
        throw new Error(`Chat Error: ${chatResponse.status}`)
      }

      const { response: aiText, emotion: detectedEmotion, updated_memory } = await chatResponse.json()

      // Update memory
      if (updated_memory) {
        setMemory(updated_memory)
      }

      // Add AI message
      const aiMessage: Message = { text: aiText, isUser: false, timestamp: new Date() }
      setMessages((prev) => [...prev, aiMessage])
      setCurrentMessage(aiText)
      setEmotion(detectedEmotion || "neutral")

      // Auto-speak AI response if voice is enabled
      if (voiceEnabled) {
        await speakText(aiText)
      }

      setConnectionError(false)
    } catch (error) {
      console.error("Error processing message:", error)
      setConnectionError(true)

      // Fallback response
      const fallbackMsg = "¡Ay no! Parece que tengo problemas técnicos... ¡Pero aún te amo! 💕"
      setCurrentMessage(fallbackMsg)
      setMessages((prev) => [...prev, { text: fallbackMsg, isUser: false, timestamp: new Date() }])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || isProcessing) return

    const message = textInput.trim()
    setTextInput("")
    await processMessage(message)
  }

  const toggleVoice = () => {
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause()
      setIsSpeaking(false)
    }
    setVoiceEnabled(!voiceEnabled)
  }

  const getEmotionPlaceholder = (emotion: Emotion) => {
    const emotionStyles = {
      neutral: "opacity-80 scale-100",
      happy: "opacity-100 brightness-110 scale-105",
      blush: "opacity-100 brightness-110 hue-rotate-15 scale-105",
      angry: "opacity-100 brightness-90 hue-rotate-345 scale-95 animate-pulse",
      love: "opacity-100 brightness-125 scale-110",
      annoyed: "opacity-90 brightness-85 scale-95",
    }

    const emotionColors = {
      neutral: "from-purple-900/20 to-purple-800/40",
      happy: "from-pink-500/30 to-purple-500/40",
      blush: "from-rose-500/30 to-pink-500/40",
      angry: "from-red-500/40 to-orange-500/50",
      love: "from-pink-400/40 to-rose-400/50",
      annoyed: "from-gray-500/30 to-purple-500/30",
    }

    const emotionEmojis = {
      neutral: "😌",
      happy: "😊",
      blush: "😊💕",
      angry: "😤💢",
      love: "😍💖",
      annoyed: "😒",
    }

    return (
      <div className={`w-full h-full transition-all duration-700 ${emotionStyles[emotion]}`}>
        <div
          className={`w-full h-full bg-gradient-to-b ${emotionColors[emotion]} rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border-2 ${
            emotion === "love"
              ? "border-pink-400/50"
              : emotion === "angry"
                ? "border-red-400/50"
                : "border-purple-400/30"
          }`}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white rounded-full blur-xl animate-pulse"></div>
            <div
              className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-white rounded-full blur-lg animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          {/* Character placeholder */}
          <div className="relative z-10 text-center text-white">
            <div className="text-6xl mb-3 filter drop-shadow-lg">{emotionEmojis[emotion]}</div>
            <div className="text-lg font-semibold mb-2 opacity-90">
              {memory.userName ? `${memory.userName}-kun 💕` : "Mi Amor"}
            </div>
            <div className="text-xs opacity-60 mb-1">VRM Model Ready</div>
            <div className="text-xs opacity-40">
              Nivel: {memory.relationshipLevel || 0} | {emotion}
            </div>
          </div>

          {/* Speaking animation */}
          {isSpeaking && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 15 + 8}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.4s",
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Love hearts animation */}
          {emotion === "love" && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className="absolute text-pink-300 animate-bounce"
                  size={16}
                  style={{
                    top: `${20 + i * 20}%`,
                    left: `${10 + i * 30}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex flex-col max-w-sm mx-auto">
      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-600/20 border-b border-red-500/30 p-2 text-center">
          <p className="text-red-300 text-sm">⚠️ Error de conexión - Verifica que el servidor esté ejecutándose</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Memory Display */}
        {memory.userName && (
          <div className="absolute top-4 left-4 right-4 bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300">
            <div className="font-semibold text-purple-300 mb-1">💕 Mi {memory.userName}</div>
            <div className="flex justify-between">
              <span>Amor: {memory.relationshipLevel || 0}%</span>
              <span>Molestia: {memory.annoyanceLevel || 0}%</span>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="absolute top-20 left-4 right-4 max-h-32 overflow-y-auto">
            <div className="space-y-2">
              {messages.slice(-3).map((msg, idx) => (
                <Card
                  key={idx}
                  className={`p-3 max-w-xs transition-all duration-300 ${
                    msg.isUser
                      ? "ml-auto bg-purple-600/20 border-purple-500/30 text-purple-100"
                      : "mr-auto bg-gray-800/40 border-gray-600/30 text-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Avatar Container */}
        <div className="relative z-10 w-64 h-80 mb-6">
          <div className={`w-full h-full transition-all duration-500 ${isProcessing ? "animate-pulse" : ""}`}>
            {getEmotionPlaceholder(emotion)}
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Bar - Mobile Optimized */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-t border-gray-700/50 p-4 safe-area-pb">
        <div className="w-full max-w-sm mx-auto">
          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full transition-all duration-300 ${
                voiceEnabled && isSpeaking
                  ? "bg-green-600/50 text-green-300 shadow-lg shadow-green-500/25 animate-pulse"
                  : voiceEnabled
                    ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                    : "bg-gray-800/30 text-gray-500"
              }`}
              onClick={toggleVoice}
            >
              {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>

            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 animate-pulse"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isListening ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>
          </div>

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="relative">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escríbeme algo lindo... 💕"
              className="w-full bg-gray-800/50 border-gray-600/50 text-gray-200 placeholder-gray-400 pr-12 rounded-full py-3 text-base"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-200"
              disabled={!textInput.trim() || isProcessing}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Status */}
          {(isListening || isProcessing || isSpeaking) && (
            <div className="text-center mt-3">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
                {isListening && (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span>Te escucho, amor...</span>
                  </>
                )}
                {isProcessing && (
                  <>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>Pensando en ti...</span>
                  </>
                )}
                {isSpeaking && (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Hablándote con amor...</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
