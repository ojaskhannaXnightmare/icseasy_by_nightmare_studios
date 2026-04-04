import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Validates that a Turso URL is properly formatted (libsql:// or https://)
 */
function isValidTursoUrl(url: string | undefined): url is string {
  if (!url || url === 'undefined' || url === 'null') return false
  return url.startsWith('libsql://') || url.startsWith('https://')
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  const hasValidTurso =
    tursoUrl &&
    tursoUrl !== 'undefined' &&
    tursoUrl !== 'null' &&
    isValidTursoUrl(tursoUrl) &&
    tursoToken &&
    tursoToken !== 'undefined'

  if (hasValidTurso) {
    try {
      // new Function() is opaque to all bundlers — @libsql/client will
      // never be included in the build output when env vars are absent.
      const createAdapter = new Function('url', 'token', `
        "use strict";
        const { createClient } = require("@libsql/client");
        const { PrismaLibSql } = require("@prisma/adapter-libsql");
        const libsql = createClient({ url: url, authToken: token });
        return new PrismaLibSql(libsql);
      `)
      const adapter = createAdapter(tursoUrl, tursoToken)
      // IMPORTANT: Must pass a dummy datasourceUrl when using an adapter,
      // because Prisma's SQLite provider requires a file: URL in the schema.
      // The adapter overrides this at the driver level.
      return new PrismaClient({
        adapter,
        datasourceUrl: 'file:/tmp/dummy.db',
      })
    } catch {
      // Fall through to local SQLite
    }
  }

  // Local SQLite (development + build fallback)
  // In Vercel serverless, use /tmp which is writable
  const isVercel = !!process.env.VERCEL || !!process.env.NEXT_PHASE
  const dbUrl = isVercel
    ? 'file:/tmp/icseasy-local.db'
    : (process.env.DATABASE_URL || 'file:./db/custom.db')

  return new PrismaClient({
    datasourceUrl: dbUrl,
  })
}

// Singleton pattern
const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma
