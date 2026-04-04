import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Validates that a Turso URL is properly formatted (libsql:// or https://)
 * This prevents build-time crashes when env vars are missing or set to "undefined"
 */
function isValidTursoUrl(url: string | undefined): url is string {
  if (!url || url === 'undefined' || url === 'null') return false
  return url.startsWith('libsql://') || url.startsWith('https://')
}

function createPrismaClient() {
  // Use Turso cloud database in production when VALID credentials are set
  // Strict validation prevents build-time crashes from missing/malformed env vars
  if (
    process.env.NODE_ENV === 'production' &&
    isValidTursoUrl(process.env.TURSO_DATABASE_URL) &&
    process.env.TURSO_AUTH_TOKEN &&
    process.env.TURSO_AUTH_TOKEN !== 'undefined'
  ) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite database (development + Vercel build fallback)
  // During build, use in-memory DB to avoid file system issues
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL
  const dbUrl = isBuild
    ? 'file:/tmp/prisma-build.db'
    : (process.env.DATABASE_URL || 'file:./db/custom.db')

  return new PrismaClient({
    datasourceUrl: dbUrl,
  })
}

// Singleton pattern — prevents connection pool exhaustion in production
// In dev, picks up fresh schema/model changes on each server restart
const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma
