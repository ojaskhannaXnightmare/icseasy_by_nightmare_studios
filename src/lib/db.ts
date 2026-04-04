import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

/**
 * ICSEasy Database Configuration
 *
 * On Vercel (production): Connects to Turso cloud DB via @prisma/adapter-libsql
 * Locally (development): Uses local SQLite via Prisma's default SQLite driver
 *
 * Both @libsql/client and @prisma/adapter-libsql are listed in
 * serverExternalPackages (next.config.ts) so webpack won't bundle them —
 * they're resolved at runtime from node_modules.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isValidTursoUrl(url: string | undefined): url is string {
  if (!url || url === 'undefined' || url === 'null') return false
  return url.startsWith('libsql://') || url.startsWith('https://')
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // Only attempt Turso connection if BOTH env vars are valid
  const canUseTurso =
    isValidTursoUrl(tursoUrl) &&
    !!tursoToken &&
    tursoToken !== 'undefined' &&
    tursoToken !== 'null'

  if (canUseTurso) {
    try {
      // PrismaLibSQL is a FACTORY — pass {url, authToken} config, NOT a client instance
      const adapter = new PrismaLibSQL({
        url: tursoUrl,
        authToken: tursoToken,
      })

      return new PrismaClient({ adapter })
    } catch (err) {
      console.error('[db] Failed to create Turso adapter, falling back to SQLite:', err)
    }
  }

  // Local SQLite fallback (development + build-time + Vercel without Turso creds)
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  return new PrismaClient({ datasourceUrl: dbUrl })
}

// Singleton pattern — prevents connection leaks during dev hot-reload
const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma
