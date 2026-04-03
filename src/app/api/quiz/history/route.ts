import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = { userId: decoded.userId as string }
    if (subject) {
      where.subject = subject
    }

    const [attempts, total] = await Promise.all([
      db.quizAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.quizAttempt.count({ where }),
    ])

    // Calculate stats across all user attempts (not just filtered)
    const allAttempts = await db.quizAttempt.findMany({
      where: { userId: decoded.userId as string },
      select: { score: true, totalMarks: true },
    })

    const totalAttempts = allAttempts.length
    const scores = allAttempts.map((a) =>
      a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0
    )
    const averageScore =
      totalAttempts > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / totalAttempts)
        : 0
    const bestScore = totalAttempts > 0 ? Math.round(Math.max(...scores)) : 0

    // Get unique subjects for filter
    const subjectFilters = await db.quizAttempt.findMany({
      where: { userId: decoded.userId as string },
      distinct: ['subject'],
      select: { subject: true },
      orderBy: { subject: 'asc' },
    })

    return NextResponse.json({
      attempts,
      stats: {
        totalAttempts,
        averageScore,
        bestScore,
      },
      filters: {
        subjects: subjectFilters.map((s) => s.subject),
      },
      pagination: {
        total,
        limit,
        offset,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
