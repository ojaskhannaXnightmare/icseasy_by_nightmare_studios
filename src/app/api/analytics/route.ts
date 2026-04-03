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

    // Fetch all notes, quiz attempts, and study sessions for the user
    const [notes, quizAttempts, studySessions, focusAgg, todayFocusAgg] = await Promise.all([
      db.note.findMany({
        where: { userId },
        select: { subject: true, createdAt: true },
      }),
      db.quizAttempt.findMany({
        where: { userId },
        select: { subject: true, score: true, totalMarks: true, createdAt: true },
      }),
      db.studySession.findMany({
        where: { userId },
        select: { type: true, duration: true, createdAt: true },
      }),
      db.studySession.aggregate({
        where: { userId, type: 'focus' },
        _sum: { duration: true },
      }),
      (() => {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        return db.studySession.aggregate({
          where: { userId, type: 'focus', createdAt: { gte: todayStart } },
          _sum: { duration: true },
        })
      })(),
    ])

    // 1. Total study time — use real focus session data if available, else estimate
    const realFocusMinutes = Math.round((focusAgg._sum.duration || 0) / 60)
    const estimatedTime = notes.length * 15 + quizAttempts.length * 25
    const totalStudyTime = realFocusMinutes > 0 ? realFocusMinutes : estimatedTime
    const todayFocusMinutes = Math.round((todayFocusAgg._sum.duration || 0) / 60)

    // 2. Subject-wise quiz performance (average score % per subject)
    const subjectQuizMap = new Map<string, { total: number; count: number }>()
    for (const qa of quizAttempts) {
      const pct = qa.totalMarks > 0 ? (qa.score / qa.totalMarks) * 100 : 0
      const existing = subjectQuizMap.get(qa.subject)
      if (existing) {
        existing.total += pct
        existing.count += 1
      } else {
        subjectQuizMap.set(qa.subject, { total: pct, count: 1 })
      }
    }
    const subjectPerformance = Array.from(subjectQuizMap.entries()).map(
      ([subject, { total, count }]) => ({
        subject,
        avgScore: Math.round((total / count) * 10) / 10,
        totalQuizzes: count,
      })
    )

    // 3. Score distribution
    const scoreDistribution = { '0-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 }
    for (const qa of quizAttempts) {
      const pct = qa.totalMarks > 0 ? (qa.score / qa.totalMarks) * 100 : 0
      if (pct <= 40) scoreDistribution['0-40%']++
      else if (pct <= 60) scoreDistribution['41-60%']++
      else if (pct <= 80) scoreDistribution['61-80%']++
      else scoreDistribution['81-100%']++
    }

    // 4. Notes per subject
    const notesPerSubjectMap = new Map<string, number>()
    for (const note of notes) {
      notesPerSubjectMap.set(note.subject, (notesPerSubjectMap.get(note.subject) || 0) + 1)
    }
    const notesPerSubject = Array.from(notesPerSubjectMap.entries()).map(
      ([subject, count]) => ({ subject, count })
    )

    // 5. Most active day of week (including study sessions)
    const dayCounts = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    const allDates = [
      ...notes.map(n => n.createdAt),
      ...quizAttempts.map(q => q.createdAt),
      ...studySessions.map(s => s.createdAt),
    ]
    for (const d of allDates) {
      dayCounts[d.getDay()]++
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts))
    const mostActiveDay = dayNames[maxDayIndex]

    // 6. Monthly activity trend (last 6 months)
    const now = new Date()
    const months: { month: string; notes: number; quizzes: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthLabel = start.toLocaleString('en-US', { month: 'short' })

      const monthNotes = notes.filter(n => n.createdAt >= start && n.createdAt <= end).length
      const monthQuizzes = quizAttempts.filter(q => q.createdAt >= start && q.createdAt <= end).length

      months.push({ month: monthLabel, notes: monthNotes, quizzes: monthQuizzes })
    }

    // 7. Pomodoro stats
    const focusSessions = studySessions.filter(s => s.type === 'focus')
    const breakSessions = studySessions.filter(s => s.type === 'break')
    const totalFocusSessions = focusSessions.length
    const totalBreakSessions = breakSessions.length
    const totalBreakMinutes = Math.round(
      breakSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    )

    return NextResponse.json({
      stats: {
        totalStudyTime,
        subjectPerformance,
        scoreDistribution,
        notesPerSubject,
        mostActiveDay,
        monthlyTrend: months,
        totalNotes: notes.length,
        totalQuizzes: quizAttempts.length,
        avgScore: quizAttempts.length > 0
          ? Math.round(
              (quizAttempts.reduce((sum, qa) => {
                const pct = qa.totalMarks > 0 ? (qa.score / qa.totalMarks) * 100 : 0
                return sum + pct
              }, 0) / quizAttempts.length) * 10
            ) / 10
          : 0,
        // Pomodoro / study timer data
        todayFocusMinutes,
        totalFocusSessions,
        totalBreakSessions,
        totalFocusMinutes: realFocusMinutes,
        totalBreakMinutes,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
