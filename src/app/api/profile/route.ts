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

    const userId = decoded.userId as string

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        studyPrefs: true,
        streak: true,
        isOnline: true,
        lastSeen: true,
        lastActive: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get stats
    const totalNotes = await db.note.count({ where: { userId } })
    const bookmarkedNotes = await db.note.count({ where: { userId, isBookmarked: true } })
    const totalQuizzes = await db.quizAttempt.count({ where: { userId } })
    const averageScore = await db.quizAttempt.aggregate({
      where: { userId },
      _avg: { score: true },
    })

    const friendsCount = await db.friendRequest.count({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
    })

    return NextResponse.json({
      user,
      stats: {
        totalNotes,
        bookmarkedNotes,
        totalQuizzes,
        averageScore: averageScore._avg.score ? Math.round(averageScore._avg.score * 100) / 100 : 0,
        friendsCount,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { name, bio, avatarUrl, studyPrefs } = body

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(studyPrefs !== undefined && { studyPrefs: typeof studyPrefs === 'string' ? studyPrefs : JSON.stringify(studyPrefs) }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        studyPrefs: true,
        streak: true,
        isOnline: true,
        lastSeen: true,
        lastActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
