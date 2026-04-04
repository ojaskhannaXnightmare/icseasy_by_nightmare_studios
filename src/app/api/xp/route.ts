import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// XP action values
const XP_ACTIONS: Record<string, number> = {
  quiz_complete: 10,
  perfect_quiz: 25,
  note_created: 5,
  ai_note_generated: 8,
  flashcard_created: 3,
  study_session: 15,
  streak_bonus: 5,
  daily_login: 2,
  achievement_unlocked: 20,
  challenge_complete: 15,
}

const XP_PER_LEVEL = 100

interface XPHistoryEntry {
  action: string
  amount: number
  date: string
}

interface StudyPrefs {
  xpHistory?: XPHistoryEntry[]
  longestStreak?: number
  [key: string]: unknown
}

function parseStudyPrefs(raw: string | null): StudyPrefs {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as StudyPrefs
  } catch {
    return {}
  }
}

function getLevel(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        studyPrefs: true,
        streak: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const prefs = parseStudyPrefs(user.studyPrefs)
    const xpHistory: XPHistoryEntry[] = prefs.xpHistory || []
    const totalXP = xpHistory.reduce((sum, entry) => sum + entry.amount, 0)
    const level = getLevel(totalXP)
    const xpInCurrentLevel = totalXP % XP_PER_LEVEL
    const xpToNextLevel = XP_PER_LEVEL
    const xpProgress = xpInCurrentLevel

    // Get recent 10 entries
    const recentHistory = xpHistory.slice(-10).reverse()

    return NextResponse.json({
      xp: totalXP,
      level,
      xpToNextLevel,
      xpProgress,
      xpInCurrentLevel,
      totalEarned: totalXP,
      recentHistory,
    })
  } catch (error) {
    console.error('XP GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { action, amount } = body

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Validate action
    if (!(action in XP_ACTIONS)) {
      return NextResponse.json(
        { error: `Invalid action. Valid actions: ${Object.keys(XP_ACTIONS).join(', ')}` },
        { status: 400 }
      )
    }

    // Determine XP amount
    let xpAmount: number
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
      }
      // For streak_bonus, enforce daily limit of 50
      if (action === 'streak_bonus') {
        xpAmount = Math.min(amount, 50)
      } else {
        // Cap at 2x the default value to prevent abuse
        xpAmount = Math.min(amount, XP_ACTIONS[action] * 2)
      }
    } else {
      xpAmount = XP_ACTIONS[action]
    }

    // Fetch user
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        studyPrefs: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const prefs = parseStudyPrefs(user.studyPrefs)
    const xpHistory: XPHistoryEntry[] = prefs.xpHistory || []

    // Add new entry
    const newEntry: XPHistoryEntry = {
      action,
      amount: xpAmount,
      date: new Date().toISOString(),
    }
    xpHistory.push(newEntry)

    // Keep history to last 200 entries to prevent unbounded growth
    if (xpHistory.length > 200) {
      prefs.xpHistory = xpHistory.slice(-200)
    } else {
      prefs.xpHistory = xpHistory
    }

    // Update user
    await db.user.update({
      where: { id: payload.userId as string },
      data: {
        studyPrefs: JSON.stringify(prefs),
      },
    })

    // Compute response
    const totalXP = xpHistory.reduce((sum, entry) => sum + entry.amount, 0)
    const level = getLevel(totalXP)
    const xpInCurrentLevel = totalXP % XP_PER_LEVEL
    const recentHistory = xpHistory.slice(-10).reverse()

    return NextResponse.json({
      xp: totalXP,
      level,
      xpToNextLevel: XP_PER_LEVEL,
      xpProgress: xpInCurrentLevel,
      totalEarned: totalXP,
      recentHistory,
      awarded: xpAmount,
      action,
    })
  } catch (error) {
    console.error('XP POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
