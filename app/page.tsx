"use client"

import type React from "react"
import { Suspense } from "react" // Import Suspense for VRMViewer
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Volume2, Mic, Square, Send, VolumeX } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import dynamic from "next/dynamic" // Import dynamic for VRMViewer

// Dynamically import VRM component to avoid SSR issues
const VRMViewer = dynamic(() => import("@/components/vrm-viewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-purple-900/20 rounded-2xl animate-pulse" />,
})

type Emotion = "happy" | "angry"

interface Message {
  text: string
  isUser: boolean
  timestamp: Date
  emotion?: Emotion
}

export default function YukiAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>("happy")
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [connectionError, setConnectionError] = useState(false) // State for connection errors
  const [useVRM, setUseVRM] = useState(false) // State to toggle VRM

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Backend URL for local FastAPI server
  const BACKEND_BASE_URL = "http://localhost:8000"

  useEffect(() => {
    audioRef.current = new Audio()

    // Initial greeting
    if (!hasGreeted) {
      setTimeout(() => {
        const greeting = "¡Hola mi amor! Soy Yuki, tu novia virtual. ¿Cómo estás hoy?"
        addMessage(greeting, false, "happy")
        if (voiceEnabled) {
          speakText(greeting)
        }
        setHasGreeted(true)
      }, 1000)
    }
  }, [hasGreeted, voiceEnabled])

  const addMessage = (text: string, isUser: boolean, messageEmotion?: Emotion) => {
    const message: Message = {
      text,
      isUser,
      timestamp: new Date(),
      emotion: messageEmotion,
    }
    setMessages((prev) => [...prev, message])
    if (messageEmotion) {
      setEmotion(messageEmotion)
    }
  }

  const recordAndSend = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    const chunks: Blob[] = []

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("audio", blob, "recording.webm")

      const res = await fetch(`${BACKEND_BASE_URL}/speech-to-text`, { method: "POST", body: formData })
      const data = await res.json() // Parse JSON response

      if (!res.ok || !data.ok) {
        console.error("STT API Error:", data.reason || res.statusText)
        setConnectionError(true)
        addMessage("Lo siento, no pude entenderte bien. ¿Podrías repetirlo?", false, "happy")
        return // Stop processing if STT failed
      }

      console.log("Texto transcrito:", data.text)
      setConnectionError(false) // Clear error if successful

      if (data.text?.trim()) {
        await processMessage(data.text.trim())
      }
    }

    mediaRecorder.start()
    setTimeout(() => mediaRecorder.stop(), 5000) // 5 segundos
  }

  const playResponse = async (text: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error("TTS HTTP Error:", res.status, errorBody)
        throw new Error(`TTS API failed: ${res.status}`)
      }

      const blob = await res.blob()

      // Relaxed sanity check: allow very small blobs, but still check for empty
      if (blob.size < 1000 && (blob.type === "audio/mpeg" || blob.type === "audio/wav")) {
        console.warn("TTS returned a very small audio blob, might be empty or invalid:", blob.size, "bytes")
      }

      const url = URL.createObjectURL(blob)

      if (!audioRef.current) audioRef.current = new Audio()
      const player = audioRef.current
      player.src = url
      player.onended = () => {
        URL.revokeObjectURL(url)
        setIsSpeaking(false)
      }
      player.onerror = (e) => {
        console.error("Audio playback error:", e)
        URL.revokeObjectURL(url)
        setIsSpeaking(false)
        setConnectionError(true) // Indicate a playback error
      }

      await player.play()
      setConnectionError(false) // Clear error if successful
    } catch (err) {
      console.error("playResponse error:", err)
      setIsSpeaking(false)
      setConnectionError(true) // Indicate a TTS or network error
      addMessage("¡Ay no! Parece que tengo problemas con mi voz... ¡Pero aún te amo! 💕", false, "happy")
    }
  }

  const speakText = async (text: string) => {
    if (!voiceEnabled || !text.trim()) return
    setIsSpeaking(true)
    await playResponse(text) // playResponse handles setting isSpeaking to false on end/error
  }

  const startListening = async () => {
    try {
      setIsListening(true)
      await recordAndSend()
    } catch (error) {
      console.error("Microphone access error:", error)
      alert("No se pudo acceder al micrófono. Por favor, permite el acceso.")
    } finally {
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const processMessage = async (message: string) => {
    setIsProcessing(true)

    try {
      addMessage(message, true)

      const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Chat HTTP Error:", response.status, errorBody)
        throw new Error(`Chat API failed: ${response.status}`)
      }

      const { response: aiText, emotion: detectedEmotion } = await response.json()

      addMessage(aiText, false, detectedEmotion)
      if (voiceEnabled) {
        await speakText(aiText)
      }
      setConnectionError(false) // Clear error if successful
    } catch (error) {
      console.error("Message processing error:", error)
      setConnectionError(true) // Indicate a chat API or network error
      const fallback = "Lo siento, tengo problemas técnicos... ¡Pero aún te amo! 💕"
      addMessage(fallback, false, "happy")
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

  const getCharacterDisplay = () => {
    const isAngry = emotion === "angry"

    if (useVRM) {
      return (
        <Suspense fallback={<div className="w-full h-full bg-purple-900/20 rounded-2xl animate-pulse" />}>
          <VRMViewer emotion={emotion} isSpeaking={isSpeaking} />
        </Suspense>
      )
    }

    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden">
        <Image
          src={isAngry ? "/images/angry.jpeg" : "/images/happy.jpeg"}
          alt={isAngry ? "Angry Yuki" : "Happy Yuki"}
          fill
          className={`object-cover transition-all duration-700 ${
            isAngry ? "brightness-90 hue-rotate-15" : "brightness-110"
          }`}
          priority
        />

        {/* Character info overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <div className="text-white font-semibold text-lg">Yuki-chan</div>
            <div className="text-white/80 text-sm capitalize">{emotion}</div>
          </div>
        </div>

        {/* Speaking animation overlay */}
        {isSpeaking && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1 bg-black/50 rounded-full px-3 py-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 15 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.4s",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Angry effects */}
        {isAngry && (
          <div className="absolute top-4 right-4">
            <div className="text-red-400 text-2xl animate-pulse">💢</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex flex-col max-w-sm mx-auto">
      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-600/20 border-b border-red-500/30 p-2 text-center">
          <p className="text-red-300 text-sm">
            ⚠️ Error de conexión. Asegúrate que el backend esté corriendo en http://localhost:8000
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Character Display */}
        <div className="relative z-10 w-64 h-80 mx-auto mb-4">
          <div className={`w-full h-full transition-all duration-500 ${isProcessing ? "animate-pulse" : ""}`}>
            {getCharacterDisplay()}
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl z-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400 border-t-transparent" />
            </div>
          )}
        </div>

        {/* VRM Toggle Button */}
        <Button
          onClick={() => setUseVRM(!useVRM)}
          variant="ghost"
          size="sm"
          className="mb-4 text-purple-300 hover:text-purple-100 mx-auto"
        >
          {useVRM ? "Usar Imagen 2D" : "Usar Modelo 3D"}
        </Button>

        {/* Chat Messages - Now positioned below the image */}
        <div className="flex-1 overflow-y-auto mb-4 z-10 max-h-48">
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <Card
                key={idx}
                className={`p-3 max-w-xs transition-all duration-300 ${
                  msg.isUser
                    ? "ml-auto bg-purple-600/20 border-purple-500/30 text-purple-100"
                    : "mr-auto bg-gray-800/40 border-gray-600/30 text-gray-200"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className="text-xs opacity-50 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </Card>
            ))}
          </div>
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
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span>Te escucho, amor...</span>
                  </>
                )}
                {isProcessing && (
                  <>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <span>Pensando en ti...</span>
                  </>
                )}
                {isSpeaking && (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
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
