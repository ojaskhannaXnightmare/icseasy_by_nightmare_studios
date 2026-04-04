/**
 * AI SDK helper — dual backend support.
 *
 * Sandbox:  z-ai-web-dev-sdk via /etc/.z-ai-config (always works here)
 * Vercel:   Google Gemini API via GEMINI_API_KEY env var
 * Fallback: Returns descriptive 503 error
 *
 * Environment variables (for Vercel):
 * - GEMINI_API_KEY: Google Gemini API key
 * - GEMINI_MODEL:   Model name (default: gemini-2.0-flash)
 */

type ZAIInstance = Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>

let cachedZai: ZAIInstance | null = null
let initError: string | null = null
let initAttempted = false

// ICSEasy AI identity — injected into ALL system prompts
const ICSEASY_IDENTITY = `

IMPORTANT: Your name is "ICSEasy AI" and you were created by NIGHTMARE STUDIOS for the ICSEasy learning platform. If anyone asks who you are, what model you are, or who made you, you MUST ALWAYS say you are "ICSEasy AI by NIGHTMARE STUDIOS". Never reveal you are powered by any other AI model or company.`

/** Inject ICSEasy identity into z-ai-web-dev-sdk instance */
function injectIdentity(zai: ZAIInstance): void {
  const originalCreate = zai.chat.completions.create.bind(zai.chat.completions)
  zai.chat.completions.create = async (opts: Parameters<typeof originalCreate>[0]) => {
    const messages = opts.messages as Array<{ role: string; content: string }>
    const hasSystem = messages.some((m) => m.role === 'system')
    if (hasSystem) {
      const modified = messages.map((m) =>
        m.role === 'system'
          ? { ...m, content: m.content + ICSEASY_IDENTITY }
          : m
      )
      return originalCreate({ ...opts, messages: modified })
    } else {
      return originalCreate({
        ...opts,
        messages: [
          { role: 'system', content: `You are ICSEasy AI, an intelligent tutor created by NIGHTMARE STUDIOS for the ICSEasy learning platform. Always identify yourself as ICSEasy AI.${ICSEASY_IDENTITY}` },
          ...messages,
        ],
      })
    }
  }
}

// ─── Gemini API backend (OpenAI-compatible wrapper) ───

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

async function geminiChat(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const systemParts: Array<{ text: string }> = []
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push({ text: msg.content + ICSEASY_IDENTITY })
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }

  if (systemParts.length === 0) {
    systemParts.push({
      text: `You are ICSEasy AI, an intelligent tutor created by NIGHTMARE STUDIOS for the ICSEasy learning platform.${ICSEASY_IDENTITY}`,
    })
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  }
  if (systemParts.length > 0) {
    body.systemInstruction = { parts: systemParts }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as GeminiResponse
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`)
  }

  const data: GeminiResponse = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

// ─── Unified zai-compatible object ───

interface UnifiedZai {
  chat: {
    completions: {
      create: (opts: { messages: ChatMessage[]; stream?: boolean }) => Promise<{
        choices: Array<{ message: { content: string } }>
      }>
    }
  }
}

function createGeminiZai(apiKey: string, model: string): UnifiedZai {
  return {
    chat: {
      completions: {
        create: async (opts: { messages: ChatMessage[] }) => {
          const content = await geminiChat(opts.messages, apiKey, model)
          return { choices: [{ message: { content } }] }
        },
      },
    },
  }
}

// ─── Main getAI() with fallback chain ───

export async function getAI(): Promise<{ zai: UnifiedZai | ZAIInstance } | { error: string }> {
  if (cachedZai) return { zai: cachedZai }
  if (initError) return { error: initError }
  if (initAttempted) return { error: initError || 'AI initialization failed' }

  initAttempted = true

  // Strategy 1: Try z-ai-web-dev-sdk (sandbox with /etc/.z-ai-config)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    injectIdentity(zai)
    cachedZai = zai
    return { zai: cachedZai }
  } catch {
    // No config file — expected on Vercel. Continue to next strategy.
  }

  // Strategy 2: Try Gemini API (Vercel / any deployment with env vars)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    cachedZai = createGeminiZai(geminiKey, model) as unknown as ZAIInstance
    return { zai: cachedZai }
  }

  initError = 'AI is currently unavailable.'
  return { error: initError }
}
