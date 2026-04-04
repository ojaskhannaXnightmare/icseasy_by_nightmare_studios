import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creates a Prisma client.
 * In production with valid Turso credentials: uses Turso cloud DB.
 * Otherwise (build, dev, missing creds): uses local SQLite.
 *
 * Turso adapter is loaded via `new Function()` to prevent
 * any bundler (webpack/turbopack) from tracing or including
 * @libsql/client when credentials are not set.
 */
function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // Only attempt Turso if URL is a real libsql:// or https:// URL
  const hasValidTurso =
    tursoUrl &&
    tursoUrl !== 'undefined' &&
    tursoUrl !== 'null' &&
    (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://')) &&
    tursoToken &&
    tursoToken !== 'undefined' &&
    process.env.NODE_ENV === 'production'

  if (hasValidTurso) {
    try {
      // new Function() is NOT statically analyzable by bundlers.
      // This guarantees @libsql/client is never touched during build.
      const createAdapter = new Function('url', 'token', `
        "use strict";
        const { createClient } = require("@libsql/client");
        const { PrismaLibSql } = require("@prisma/adapter-libsql");
        const libsql = createClient({ url, authToken: token });
        return new PrismaLibSql(libsql);
      `)
      const adapter = createAdapter(tursoUrl, tursoToken)
      return new PrismaClient({ adapter })
    } catch {
      // Adapter creation failed — fall through to SQLite
    }
  }

  // Local SQLite (dev + build fallback)
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  const dbUrl = isBuild
    ? 'file:/tmp/prisma-build.db'
    : (process.env.DATABASE_URL || 'file:./db/custom.db')

  return new PrismaClient({
    datasourceUrl: dbUrl,
  })
}

// Singleton — prevents connection pool exhaustion
const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma
