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
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // 'weekly' or 'monthly'

    const now = new Date()
    let periodStart: Date
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    if (period === 'monthly') {
      // This month: 1st to now
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      // Previous month
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    } else {
      // This week: Monday to now
      const dayOfWeek = now.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset)
      periodStart.setHours(0, 0, 0, 0)
      // Previous week: Monday to Sunday
      previousPeriodEnd = new Date(periodStart.getTime() - 86400000)
      previousPeriodEnd.setHours(23, 59, 59)
      previousPeriodStart = new Date(previousPeriodEnd.getTime() - 6 * 86400000)
      previousPeriodStart.setHours(0, 0, 0, 0)
    }

    // Fetch all relevant data in parallel
    const [
      currentNotes,
      previousNotes,
      currentQuizzes,
      previousQuizzes,
      currentSessions,
      previousSessions,
      allQuizzes,
      allSessions,
      user,
    ] = await Promise.all([
      // Current period notes
      db.note.count({ where: { userId, createdAt: { gte: periodStart } } }),
      // Previous period notes
      db.note.count({
        where: { userId, createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd } },
      }),
      // Current period quiz attempts
      db.quizAttempt.findMany({
        where: { userId, createdAt: { gte: periodStart } },
        select: { subject: true, score: true, totalMarks: true, createdAt: true },
      }),
      // Previous period quiz attempts
      db.quizAttempt.findMany({
        where: { userId, createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd } },
        select: { subject: true, score: true, totalMarks: true },
      }),
      // Current period study sessions
      db.studySession.findMany({
        where: { userId, type: 'focus', createdAt: { gte: periodStart } },
        select: { duration: true, createdAt: true },
      }),
      // Previous period study sessions
      db.studySession.findMany({
        where: { userId, type: 'focus', createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd } },
        select: { duration: true },
      }),
      // All quiz attempts for subject performance
      db.quizAttempt.findMany({
        where: { userId },
        select: { subject: true, score: true, totalMarks: true },
      }),
      // All study sessions for time trend
      db.studySession.findMany({
        where: { userId, type: 'focus' },
        select: { duration: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // User data for streak
      db.user.findUnique({
        where: { id: userId },
        select: { streak: true },
      }),
    ])

    // Calculate current period metrics
    const currentStudyMinutes = Math.round(
      currentSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    )
    const currentAvgScore =
      currentQuizzes.length > 0
        ? Math.round(
            (currentQuizzes.reduce((sum, q) => {
              const pct = q.totalMarks > 0 ? (q.score / q.totalMarks) * 100 : 0
              return sum + pct
            }, 0) /
              currentQuizzes.length) *
              10
          ) / 10
        : 0

    // Calculate previous period metrics
    const previousStudyMinutes = Math.round(
      previousSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    )
    const previousAvgScore =
      previousQuizzes.length > 0
        ? Math.round(
            (previousQuizzes.reduce((sum, q) => {
              const pct = q.totalMarks > 0 ? (q.score / q.totalMarks) * 100 : 0
              return sum + pct
            }, 0) /
              previousQuizzes.length) *
              10
          ) / 10
        : 0

    // Percentage change helper
    function calcChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // Study time trend chart data — daily for this period
    const trendData: { date: string; studyTime: number }[] = []
    const dayMap = new Map<string, number>()
    for (const session of currentSessions) {
      const dayStr = session.createdAt.toISOString().split('T')[0]
      dayMap.set(dayStr, (dayMap.get(dayStr) || 0) + Math.round(session.duration / 60))
    }
    const startDate = new Date(periodStart)
    while (startDate <= now) {
      const dayStr = startDate.toISOString().split('T')[0]
      trendData.push({
        date: dayStr.slice(5), // "MM-DD"
        studyTime: dayMap.get(dayStr) || 0,
      })
      startDate.setDate(startDate.getDate() + 1)
    }

    // Subject-wise performance bar chart data
    const subjectMap = new Map<string, { total: number; count: number }>()
    for (const q of allQuizzes) {
      const pct = q.totalMarks > 0 ? (q.score / q.totalMarks) * 100 : 0
      const existing = subjectMap.get(q.subject)
      if (existing) {
        existing.total += pct
        existing.count += 1
      } else {
        subjectMap.set(q.subject, { total: pct, count: 1 })
      }
    }
    const subjectPerformance = Array.from(subjectMap.entries()).map(
      ([subject, { total, count }]) => ({
        subject,
        avgScore: Math.round((total / count) * 10) / 10,
        totalQuizzes: count,
      })
    )

    // Achievement progress summary
    const totalNotes = await db.note.count({ where: { userId } })
    const totalQuizzes = allQuizzes.length
    const perfectQuizzes = allQuizzes.filter(
      (q) => q.totalMarks > 0 && q.score === q.totalMarks
    ).length
    const subjectsExplored = subjectMap.size

    const achievementSummary = {
      totalNotes,
      totalQuizzes,
      perfectQuizzes,
      subjectsExplored,
      avgScore:
        allQuizzes.length > 0
          ? Math.round(
              (allQuizzes.reduce((sum, q) => {
                const pct = q.totalMarks > 0 ? (q.score / q.totalMarks) * 100 : 0
                return sum + pct
              }, 0) /
                allQuizzes.length) *
                10
            ) / 10
          : 0,
    }

    return NextResponse.json({
      period,
      metrics: {
        studyTime: { current: currentStudyMinutes, previous: previousStudyMinutes, change: calcChange(currentStudyMinutes, previousStudyMinutes) },
        quizzesTaken: { current: currentQuizzes.length, previous: previousQuizzes.length, change: calcChange(currentQuizzes.length, previousQuizzes.length) },
        avgScore: { current: currentAvgScore, previous: previousAvgScore, change: calcChange(currentAvgScore, previousAvgScore) },
        notesCreated: { current: currentNotes, previous: previousNotes, change: calcChange(currentNotes, previousNotes) },
        streak: { current: user?.streak || 0, previous: 0, change: 0 },
      },
      trendData,
      subjectPerformance,
      achievementSummary,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
