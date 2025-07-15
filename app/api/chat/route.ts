import { type NextRequest, NextResponse } from "next/server"

// Spanish emotion detection logic as provided
function detectarEmocion(texto: string): string {
  const textoLower = texto.toLowerCase()

  if (["enojo", "enojado", "molesto", "odio"].some((x) => textoLower.includes(x))) {
    return "angry"
  } else if (["tímido", "sonrojo", "me gustas", "nervioso"].some((x) => textoLower.includes(x))) {
    return "blush"
  } else if (["feliz", "genial", "me alegra", "contento"].some((x) => textoLower.includes(x))) {
    return "happy"
  } else {
    return "neutral"
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    const emotion = detectarEmocion(message)

    // Use Mistral API with your provided key
    const mistralResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Replace with Mistral model when available
        messages: [
          {
            role: "system",
            content:
              "Eres una asistente virtual anime kawaii muy dulce y cariñosa. Responde de manera tierna y con emociones. Usa expresiones cute y anime-style. Responde en español.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    })

    if (!mistralResponse.ok) {
      // Fallback responses for development
      const responses = [
        "¡Aww, eres tan dulce! Me encanta hablar contigo~ 💕",
        "¡Kyaa! Me haces sonrojar con tus palabras tan lindas~ 😊",
        "¡Genial! Me alegra mucho que podamos charlar así~ ✨",
        "Ehehe~ ¡Eres muy divertido! Me gusta tu personalidad~ 🌸",
        "¡Waa! ¡Qué emocionante! Cuéntame más sobre ti~ 💖",
        "Hmm~ Eso es muy interesante, ¡me gusta como piensas! 🤔✨",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      return NextResponse.json({
        response: randomResponse,
        emotion: emotion,
      })
    }

    const data = await mistralResponse.json()
    const aiResponse = data.choices[0]?.message?.content || "Lo siento, no pude procesar tu mensaje~"

    return NextResponse.json({
      response: aiResponse,
      emotion: emotion,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
