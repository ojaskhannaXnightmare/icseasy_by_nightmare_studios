import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, hashPassword, comparePassword } from '@/lib/auth'

export interface UserSettings {
  studyGoalMinutes: number
  notificationsEnabled: boolean
  dailyReminderTime: string
  theme: string
  focusMode: boolean
  defaultDifficulty: string
  preferredSubjects: string[]
}

const DEFAULT_SETTINGS: UserSettings = {
  studyGoalMinutes: 30,
  notificationsEnabled: true,
  dailyReminderTime: '09:00',
  theme: 'cyberpunk',
  focusMode: false,
  defaultDifficulty: 'Medium',
  preferredSubjects: [],
}

function parseSettings(raw: string | null): UserSettings {
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        studyPrefs: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const settings = parseSettings(user.studyPrefs)

    return NextResponse.json({
      settings,
      email: user.email,
      name: user.name,
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
    const { settings, changePassword, deleteAccount } = body as {
      settings?: Partial<UserSettings>
      changePassword?: { currentPassword: string; newPassword: string }
      deleteAccount?: boolean
    }

    // Handle password change
    if (changePassword) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { password: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isValid = await comparePassword(changePassword.currentPassword, user.password || '')
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashed = await hashPassword(changePassword.newPassword)
      await db.user.update({
        where: { id: userId },
        data: { password: hashed },
      })

      return NextResponse.json({ success: true, message: 'Password updated successfully' })
    }

    // Handle account deletion
    if (deleteAccount) {
      await db.user.delete({ where: { id: userId } })
      return NextResponse.json({ success: true, message: 'Account deleted successfully' })
    }

    // Handle settings update
    if (settings) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { studyPrefs: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const current = parseSettings(user.studyPrefs)
      const updated = { ...current, ...settings }
      await db.user.update({
        where: { id: userId },
        data: { studyPrefs: JSON.stringify(updated) },
      })

      return NextResponse.json({ success: true, settings: updated })
    }

    return NextResponse.json({ error: 'No valid action specified' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
