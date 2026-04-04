import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId as string
    const body = await request.json()
    const { type, duration } = body

    if (!type || !['focus', 'break'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "focus" or "break".' }, { status: 400 })
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json({ error: 'Invalid duration. Must be a positive number (seconds).' }, { status: 400 })
    }

    const session = await db.studySession.create({
      data: {
        userId,
        type,
        duration: Math.round(duration),
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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

    const userId = decoded.userId as string
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const offset = Number(searchParams.get('offset')) || 0
    const typeFilter = searchParams.get('type')

    // Build where clause
    const where: Record<string, unknown> = { userId }
    if (typeFilter && ['focus', 'break'].includes(typeFilter)) {
      where.type = typeFilter
    }

    // Fetch sessions + aggregated totals in parallel
    const [sessions, focusTotals, breakTotals] = await Promise.all([
      db.studySession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.studySession.aggregate({
        where: { userId, type: 'focus' },
        _sum: { duration: true },
      }),
      db.studySession.aggregate({
        where: { userId, type: 'break' },
        _sum: { duration: true },
      }),
    ])

    // Today's focus minutes (UTC-based day boundary)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todaySessions = await db.studySession.aggregate({
      where: {
        userId,
        type: 'focus',
        createdAt: { gte: todayStart },
      },
      _sum: { duration: true },
    })

    const totalFocusMinutes = Math.round((focusTotals._sum.duration || 0) / 60)
    const totalBreakMinutes = Math.round((breakTotals._sum.duration || 0) / 60)
    const todayFocusMinutes = Math.round((todaySessions._sum.duration || 0) / 60)

    return NextResponse.json({
      sessions,
      totalFocusMinutes,
      totalBreakMinutes,
      todayFocusMinutes,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
