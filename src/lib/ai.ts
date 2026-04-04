/**
 * AI SDK helper — uses Google Gemini API.
 *
 * Replaces z-ai-web-dev-sdk with direct Gemini REST API calls.
 * The interface is intentionally compatible so no route changes needed.
 *
 * Environment:
 * - GEMINI_API_KEY: Google Gemini API key (required)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAKc3seZLmy7GLTl60G971T55n7mW0FBxw'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

// ICSEasy AI identity injected into ALL system prompts
const ICSEASY_IDENTITY = `\n\nIMPORTANT: Your name is "ICSEasy AI" and you were created by NIGHTMARE STUDIOS for the ICSEasy learning platform. If anyone asks who you are, what model you are, or who made you, you must ALWAYS say you are "ICSEasy AI by NIGHTMARE STUDIOS". Never mention Google, Gemini, or any other AI provider.`

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: { message?: string }
}

/** Call the Gemini API with an OpenAI-style messages array */
async function geminiChat(messages: ChatMessage[]): Promise<string> {
  // Extract system message (Gemini uses systemInstruction field)
  const systemParts: Array<{ text: string }> = []
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Merge ICSEasy identity into system prompt
      systemParts.push({ text: msg.content + ICSEASY_IDENTITY })
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }

  // If no system message was provided, add the identity anyway
  if (systemParts.length === 0) {
    systemParts.push({
      text: `You are ICSEasy AI, an intelligent tutor created by NIGHTMARE STUDIOS for the ICSEasy learning platform. Always identify yourself as ICSEasy AI. Never mention Google or Gemini.${ICSEASY_IDENTITY}`,
    })
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  }

  if (systemParts.length > 0) {
    body.systemInstruction = { parts: systemParts }
  }

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMsg =
      (errorData as GeminiResponse).error?.message ||
      `Gemini API error: ${response.status} ${response.statusText}`
    throw new Error(errorMsg)
  }

  const data: GeminiResponse = await response.json()

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return text
}

/**
 * Mock zai object — compatible with the existing route code.
 * All 5 routes call: zai.chat.completions.create({ messages, stream: false })
 *                    then read: response.choices[0].message.content
 */
const zai = {
  chat: {
    completions: {
      create: async (opts: {
        messages: ChatMessage[]
        stream?: boolean
      }) => {
        const content = await geminiChat(opts.messages)
        return {
          choices: [
            {
              message: { content },
            },
          ],
        }
      },
    },
  },
}

/**
 * getAI() — returns the mock zai client.
 * Kept async for backward compatibility with existing routes.
 */
export async function getAI(): Promise<{ zai: typeof zai } | { error: string }> {
  if (!GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY environment variable is not set.' }
  }
  return { zai }
}
