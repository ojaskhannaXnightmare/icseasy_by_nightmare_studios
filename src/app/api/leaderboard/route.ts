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

    const currentUserId = decoded.userId as string

    // Fetch all users with their related data
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        streak: true,
        quizzes: {
          select: {
            score: true,
            totalMarks: true,
          },
        },
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    // Calculate points for each user
    const scored = users.map((user) => {
      // Quiz points: SUM of (score / totalMarks * 100) per quiz, capped at 100 per quiz
      let quizPoints = 0
      for (const quiz of user.quizzes) {
        if (quiz.totalMarks > 0) {
          const pct = (quiz.score / quiz.totalMarks) * 100
          quizPoints += Math.min(pct, 100)
        }
      }
      quizPoints = Math.round(quizPoints)

      // Notes points: 5 per note
      const notesPoints = user._count.notes * 5

      // Streak points: 10 per day
      const streakPoints = user.streak * 10

      const totalPoints = quizPoints + notesPoints + streakPoints

      return {
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        quizScore: quizPoints,
        notesCount: user._count.notes,
        streak: user.streak,
        points: totalPoints,
      }
    })

    // Sort by points descending
    scored.sort((a, b) => b.points - a.points)

    // Assign ranks (handle ties)
    let rank = 0
    let prevPoints = -1
    const ranked = scored.map((entry) => {
      if (entry.points !== prevPoints) {
        rank++
        prevPoints = entry.points
      }
      return { ...entry, rank }
    })

    const totalUsers = ranked.length

    // Top 20 for the leaderboard
    const leaderboard = ranked.slice(0, 20).map((entry) => ({
      rank: entry.rank,
      userId: entry.userId,
      name: entry.name,
      avatarUrl: entry.avatarUrl,
      points: entry.points,
      quizScore: entry.quizScore,
      notesCount: entry.notesCount,
      streak: entry.streak,
      isCurrentUser: entry.userId === currentUserId,
    }))

    // Find current user's rank
    const currentUserEntry = ranked.find((e) => e.userId === currentUserId)
    const userRank = currentUserEntry
      ? {
          rank: currentUserEntry.rank,
          userId: currentUserEntry.userId,
          name: currentUserEntry.name,
          avatarUrl: currentUserEntry.avatarUrl,
          points: currentUserEntry.points,
          quizScore: currentUserEntry.quizScore,
          notesCount: currentUserEntry.notesCount,
          streak: currentUserEntry.streak,
        }
      : null

    return NextResponse.json({
      leaderboard,
      userRank,
      totalUsers,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
