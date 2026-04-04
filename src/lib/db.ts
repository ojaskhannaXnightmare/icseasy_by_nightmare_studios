import { PrismaClient } from '@prisma/client'

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

function createPrismaClient(): PrismaClient {
  // Use Turso cloud database in production when VALID credentials are set
  // Dynamic imports prevent @libsql/client from being bundled when not needed
  if (
    process.env.NODE_ENV === 'production' &&
    isValidTursoUrl(process.env.TURSO_DATABASE_URL) &&
    process.env.TURSO_AUTH_TOKEN &&
    process.env.TURSO_AUTH_TOKEN !== 'undefined'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require('@prisma/adapter-libsql')

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite database (development + Vercel build fallback)
  // During build, use /tmp to avoid file system issues in serverless
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
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
