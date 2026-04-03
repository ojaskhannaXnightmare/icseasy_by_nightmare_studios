import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const bookmark = searchParams.get('bookmark')

    const where: Record<string, unknown> = { userId: decoded.userId }
    if (subject) where.subject = subject
    if (bookmark === 'true') where.isBookmarked = true

    const notes = await db.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, subject, topic, content, noteType } = await request.json()

    if (!title || !subject || !topic || !content) {
      return NextResponse.json(
        { error: 'Title, subject, topic, and content are required' },
        { status: 400 }
      )
    }

    const note = await db.note.create({
      data: {
        userId: decoded.userId as string,
        title,
        subject,
        topic,
        content,
        noteType: noteType || 'short',
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
