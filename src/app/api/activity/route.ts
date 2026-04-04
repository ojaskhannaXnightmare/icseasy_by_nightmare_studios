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

    // Calculate start date (180 days ago)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 180)
    startDate.setHours(0, 0, 0, 0)

    // Fetch all activity data in parallel
    const [quizAttempts, notes, studySessions] = await Promise.all([
      db.quizAttempt.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
      db.note.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
      db.studySession.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
    ])

    // Aggregate by date string
    const activityMap = new Map<string, { quizzes: number; notes: number; sessions: number }>()

    // Initialize all 180 days
    const today = new Date()
    for (let i = 180; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      activityMap.set(dateStr, { quizzes: 0, notes: 0, sessions: 0 })
    }

    // Count quiz attempts per day
    for (const qa of quizAttempts) {
      const dateStr = qa.createdAt.toISOString().split('T')[0]
      const entry = activityMap.get(dateStr)
      if (entry) {
        entry.quizzes++
      }
    }

    // Count notes per day
    for (const note of notes) {
      const dateStr = note.createdAt.toISOString().split('T')[0]
      const entry = activityMap.get(dateStr)
      if (entry) {
        entry.notes++
      }
    }

    // Count study sessions per day
    for (const session of studySessions) {
      const dateStr = session.createdAt.toISOString().split('T')[0]
      const entry = activityMap.get(dateStr)
      if (entry) {
        entry.sessions++
      }
    }

    // Convert to array and add total
    const activity = Array.from(activityMap.entries()).map(([date, counts]) => ({
      date,
      quizzes: counts.quizzes,
      notes: counts.notes,
      sessions: counts.sessions,
      total: counts.quizzes + counts.notes + counts.sessions,
    }))

    // Calculate stats
    const activeDays = activity.filter((d) => d.total > 0)
    const totalDays = activeDays.length

    // Calculate current streak (consecutive days with activity ending at today or yesterday)
    let currentStreak = 0
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Streak must start from today or yesterday
    const todayEntry = activityMap.get(todayStr)
    const yesterdayEntry = activityMap.get(yesterdayStr)
    if (todayEntry && todayEntry.total > 0) {
      currentStreak = 1
      let checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - 1)
      while (true) {
        const ds = checkDate.toISOString().split('T')[0]
        const entry = activityMap.get(ds)
        if (entry && entry.total > 0) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    } else if (yesterdayEntry && yesterdayEntry.total > 0) {
      currentStreak = 1
      let checkDate = new Date(yesterday)
      checkDate.setDate(checkDate.getDate() - 1)
      while (true) {
        const ds = checkDate.toISOString().split('T')[0]
        const entry = activityMap.get(ds)
        if (entry && entry.total > 0) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    for (const day of activity) {
      if (day.total > 0) {
        tempStreak++
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    }

    // Find busiest day
    let busiestDay: { date: string; total: number } | null = null
    for (const day of activity) {
      if (!busiestDay || day.total > busiestDay.total) {
        busiestDay = { date: day.date, total: day.total }
      }
    }

    return NextResponse.json({
      activity,
      stats: {
        totalDays,
        currentStreak,
        longestStreak,
        busiestDay: busiestDay
          ? { date: busiestDay.date, total: busiestDay.total }
          : { date: todayStr, total: 0 },
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
