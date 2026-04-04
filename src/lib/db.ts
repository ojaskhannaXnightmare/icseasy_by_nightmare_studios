import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Use Turso cloud database in production when credentials are set
  // In development, always use local SQLite for fast iteration
  if (process.env.NODE_ENV === 'production' && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite database (development)
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || 'file:./db/custom.db',
  })
}

// Singleton pattern — prevents connection pool exhaustion in production
// In dev, picks up fresh schema/model changes on each server restart
const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const db = prisma
