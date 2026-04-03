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

    const where: Record<string, unknown> = { userId: decoded.userId }
    if (subject) where.subject = subject

    const flashcards = await db.flashcard.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ flashcards })
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

    const { frontText, backText, subject, topic, tags } = await request.json()

    if (!frontText || !backText || !subject) {
      return NextResponse.json(
        { error: 'Front text, back text, and subject are required' },
        { status: 400 }
      )
    }

    const flashcard = await db.flashcard.create({
      data: {
        userId: decoded.userId as string,
        frontText,
        backText,
        subject,
        topic: topic || '',
        tags: tags ? JSON.stringify(tags) : '[]',
      },
    })

    return NextResponse.json({ flashcard }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Flashcard ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.flashcard.findUnique({ where: { id } })
    if (!existing || existing.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
    }

    await db.flashcard.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
