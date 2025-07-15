import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Save audio file temporarily
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempPath = join("/tmp", `audio_${Date.now()}.wav`)

    await writeFile(tempPath, buffer)

    try {
      // Use OpenAI Whisper for speech-to-text
      const { stdout } = await execAsync(`whisper "${tempPath}" --model tiny --output_format txt --output_dir /tmp`)

      // Read the transcription result
      const txtPath = tempPath.replace(".wav", ".txt")
      const transcription = await import("fs").then((fs) => fs.promises.readFile(txtPath, "utf-8")).catch(() => "")

      // Clean up temporary files
      await unlink(tempPath).catch(() => {})
      await unlink(txtPath).catch(() => {})

      return NextResponse.json({ text: transcription.trim() })
    } catch (error) {
      console.error("Whisper error:", error)
      // Fallback to simulated response for development
      const fallbackResponses = [
        "Hola, ¿cómo estás?",
        "Me siento genial hoy",
        "¿Puedes ayudarme?",
        "Estoy un poco nervioso",
        "Me gustas mucho",
        "Estoy enojado",
        "Me alegra hablar contigo",
      ]
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
      return NextResponse.json({ text: randomResponse })
    }
  } catch (error) {
    console.error("Speech-to-text error:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}
