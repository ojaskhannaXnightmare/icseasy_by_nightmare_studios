import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100]

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00Z')
  const d2 = new Date(dateStr2 + 'T00:00:00Z')
  const diffMs = d1.getTime() - d2.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
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
    const today = toDateString(new Date())

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        streak: true,
        lastActive: true,
        studyPrefs: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const lastActiveDate = user.lastActive ? toDateString(new Date(user.lastActive)) : null
    const previousStreak = user.streak
    let newStreak: number
    let shouldNotify = false

    if (!lastActiveDate) {
      // First time ever — start streak at 1
      newStreak = 1
    } else if (lastActiveDate === today) {
      // Already active today — no change
      newStreak = user.streak
    } else {
      const dayDiff = daysBetween(today, lastActiveDate)

      if (dayDiff === 1) {
        // Yesterday — increment streak
        newStreak = user.streak + 1
      } else if (dayDiff < 0) {
        // Future date (edge case from timezone) — treat as same day
        newStreak = user.streak
      } else {
        // Streak broken — reset to 1
        newStreak = 1
      }
    }

    // Check if streak crossed a milestone
    for (const milestone of STREAK_MILESTONES) {
      if (previousStreak < milestone && newStreak >= milestone) {
        shouldNotify = true
        break
      }
    }

    // Parse studyPrefs for longestStreak
    let prefs: { longestStreak?: number } = {}
    try {
      prefs = user.studyPrefs ? JSON.parse(user.studyPrefs) : {}
    } catch {
      prefs = {}
    }

    const currentLongest = prefs.longestStreak ?? 0
    const newLongest = Math.max(currentLongest, newStreak)
    prefs.longestStreak = newLongest

    // Update user in database
    await db.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        lastActive: new Date(today + 'T00:00:00Z'),
        isOnline: true,
        studyPrefs: JSON.stringify(prefs),
      },
    })

    return NextResponse.json({
      streak: newStreak,
      lastActive: today,
      longestStreak: newLongest,
      shouldNotify,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
