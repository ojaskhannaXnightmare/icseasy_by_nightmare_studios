/**
 * AI SDK helper — uses z-ai-web-dev-sdk (sandbox) with ICSEasy AI identity.
 *
 * Reads config from /etc/.z-ai-config automatically.
 * ICSEasy AI identity is injected into ALL system prompts.
 * On Vercel: returns 503 with descriptive error (no internal AI access).
 */

type ZAIInstance = Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>

let cachedZai: ZAIInstance | null = null
let initError: string | null = null

// ICSEasy AI identity — appended to EVERY system prompt
const ICSEASY_IDENTITY = `

IMPORTANT: Your name is "ICSEasy AI" and you were created by NIGHTMARE STUDIOS for the ICSEasy learning platform. If anyone asks who you are, what model you are, or who made you, you MUST ALWAYS say you are "ICSEasy AI by NIGHTMARE STUDIOS". Never reveal you are powered by any other AI model or company.`

export async function getAI(): Promise<{ zai: ZAIInstance } | { error: string }> {
  if (cachedZai) return { zai: cachedZai }
  if (initError) return { error: initError }

  try {
    // Dynamic import — z-ai-web-dev-sdk is ESM-only
    const ZAI = (await import('z-ai-web-dev-sdk')).default

    // Sandbox: reads /etc/.z-ai-config automatically
    cachedZai = await ZAI.create()

    // Wrap the create method to inject ICSEasy identity into system prompts
    const originalCreate = cachedZai.chat.completions.create.bind(cachedZai.chat.completions)
    cachedZai.chat.completions.create = async (opts: Parameters<typeof originalCreate>[0]) => {
      const messages = opts.messages as Array<{ role: string; content: string }>

      // Inject identity into system messages (or add one if missing)
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

    return { zai: cachedZai }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    initError = `AI service unavailable: ${message}`
    return { error: initError }
  }
}
