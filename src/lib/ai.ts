/**
 * AI SDK helper — works in both sandbox and Vercel environments.
 *
 * Sandbox: reads config from /etc/.z-ai-config automatically via ZAI.create()
 * Vercel: uses ZAI_BASE_URL + ZAI_API_KEY env vars if set
 * Fallback: returns null with descriptive error
 */

type ZAIInstance = Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>

let cachedZai: ZAIInstance | null = null
let initError: string | null = null

export async function getAI(): Promise<{ zai: ZAIInstance } | { error: string }> {
  // Return cached instance if available
  if (cachedZai) return { zai: cachedZai }
  if (initError) return { error: initError }

  try {
    // Try env var configuration first (for Vercel / external deployments)
    const baseUrl = process.env.ZAI_BASE_URL
    const apiKey = process.env.ZAI_API_KEY

    if (baseUrl && apiKey) {
      // Dynamic import to avoid bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ZAI = require('z-ai-web-dev-sdk').default
      cachedZai = new ZAI({ baseUrl, apiKey })
      return { zai: cachedZai }
    }

    // Fall back to file-based config (sandbox environment)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ZAI = require('z-ai-web-dev-sdk').default
    cachedZai = await ZAI.create()
    return { zai: cachedZai }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    initError = `AI service unavailable: ${message}. Set ZAI_BASE_URL and ZAI_API_KEY environment variables to enable AI features.`
    return { error: initError }
  }
}
