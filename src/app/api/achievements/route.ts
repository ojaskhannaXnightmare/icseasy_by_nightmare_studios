import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getAchievementProgress,
  type AchievementStats,
  type AchievementDef,
} from '@/lib/achievements'

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

    // Fetch all data needed in parallel
    const [
      user,
      totalNotes,
      bookmarkedNotes,
      quizAttempts,
      acceptedFriendsSent,
      acceptedFriendsReceived,
      flashcards,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { streak: true },
      }),
      db.note.count({ where: { userId } }),
      db.note.count({ where: { userId, isBookmarked: true } }),
      db.quizAttempt.findMany({
        where: { userId },
        select: { subject: true, score: true, totalMarks: true },
      }),
      db.friendRequest.count({
        where: { senderId: userId, status: 'accepted' },
      }),
      db.friendRequest.count({
        where: { receiverId: userId, status: 'accepted' },
      }),
      db.flashcard.count({ where: { userId } }),
    ])

    const totalQuizzes = quizAttempts.length
    const totalFriends = acceptedFriendsSent + acceptedFriendsReceived

    // Calculate avgScore and bestScore
    let avgScore = 0
    let bestScore = 0
    let perfectQuizzes = 0
    const subjectSet = new Set<string>()

    if (quizAttempts.length > 0) {
      let totalPct = 0
      for (const qa of quizAttempts) {
        const pct = qa.totalMarks > 0 ? (qa.score / qa.totalMarks) * 100 : 0
        totalPct += pct
        if (pct > bestScore) bestScore = pct
        if (qa.score >= qa.totalMarks && qa.totalMarks > 0) perfectQuizzes++
        if (qa.subject) subjectSet.add(qa.subject)
      }
      avgScore = Math.round((totalPct / quizAttempts.length) * 10) / 10
      bestScore = Math.round(bestScore * 10) / 10
    }

    const subjectsExplored = subjectSet.size

    const stats: AchievementStats = {
      totalQuizzes,
      totalNotes,
      totalBookmarks: bookmarkedNotes,
      avgScore,
      bestScore,
      streak: user?.streak ?? 0,
      maxStreak: user?.streak ?? 0,
      totalFriends,
      totalFlashcards: flashcards,
      subjectsExplored,
      perfectQuizzes,
    }

    const unlockedIds = getUnlockedAchievements(stats)
    const progress = getAchievementProgress(stats)

    // Build serializable achievement definitions (strip functions)
    const allAchievements: Omit<AchievementDef, 'check' | 'progress'>[] = ACHIEVEMENTS.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      color: a.color,
      category: a.category,
    }))

    return NextResponse.json({
      stats,
      unlockedIds,
      progress,
      allAchievements,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
