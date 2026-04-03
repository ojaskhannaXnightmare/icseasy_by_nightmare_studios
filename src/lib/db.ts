import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    const libsql = createClient({
      url: 'libsql://icseasy-ojaskhannaxnightmare.aws-ap-northeast-1.turso.io',
      authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUxOTgwMzUsImlkIjoiMDE5ZDRmMTItZDMwMS03MmE4LWEzNjItNjY3N2U2NGZmNGMyIiwicmlkIjoiOTllYWE1ZjMtODU2YS00MzgwLWI1MzQtZWYxZDZlNzgwY2ZiIn0.ir-Mmne1cph9B4IC4Z_ys_FESdLadRRHgfnBn6Npq1ayOl9TSzJJ-UfhQ5PLdJsKTznuntFwfFWvlZZIoh3JDQ',
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db',
  })
}

// Always create a fresh client in dev to pick up schema/model changes
// In production, the singleton pattern prevents connection pool exhaustion
export const db = createPrismaClient()
