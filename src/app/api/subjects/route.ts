import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const subjects = await db.subject.findMany({
      include: {
        topics: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(subjects)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
