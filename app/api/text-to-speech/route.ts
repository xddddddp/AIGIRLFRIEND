import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { readFile, unlink } from "fs/promises"
import { join } from "path"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Use Coqui TTS with pretrained voice
    const outputPath = join("/tmp", `tts_${Date.now()}.wav`)

    try {
      // Using Coqui TTS with a pretrained female voice model
      // You can change the model to any from: https://github.com/coqui-ai/TTS#pretrained-models
      await execAsync(
        `tts --text "${text}" --model_name "tts_models/en/ljspeech/tacotron2-DDC" --out_path "${outputPath}"`,
      )

      // Read the generated audio file
      const audioBuffer = await readFile(outputPath)

      // Clean up temporary file
      await unlink(outputPath).catch(() => {})

      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": audioBuffer.length.toString(),
        },
      })
    } catch (error) {
      console.error("Coqui TTS error:", error)

      // Fallback: return empty audio buffer for development
      const emptyBuffer = Buffer.alloc(44) // Empty WAV header
      return new NextResponse(emptyBuffer, {
        headers: {
          "Content-Type": "audio/wav",
        },
      })
    }
  } catch (error) {
    console.error("Text-to-speech error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
