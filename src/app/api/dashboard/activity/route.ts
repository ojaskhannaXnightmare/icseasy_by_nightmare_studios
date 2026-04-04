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

    // Fetch all user activity data in parallel
    const [quizAttempts, notes, chatHistories, subjects] = await Promise.all([
      db.quizAttempt.findMany({
        where: { userId },
        select: { subject: true, topic: true, score: true, totalMarks: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.note.findMany({
        where: { userId },
        select: { title: true, subject: true, topic: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.chatHistory.findMany({
        where: { userId, role: 'assistant' },
        select: { content: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.subject.findMany({
        include: { _count: { select: { topics: true } } },
        orderBy: { name: 'asc' },
      }),
    ])

    // === 1. Weekly Activity (last 7 days, Mon-Sun) ===
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const weeklyActivity = dayLabels.map((day, i) => {
      const dayStart = new Date(monday)
      dayStart.setDate(monday.getDate() + i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      // Count quiz attempts on this day
      const quizCount = quizAttempts.filter(
        (q) => q.createdAt >= dayStart && q.createdAt <= dayEnd
      ).length

      // Count notes created on this day
      const noteCount = notes.filter(
        (n) => n.createdAt >= dayStart && n.createdAt <= dayEnd
      ).length

      return { day, activity: quizCount + noteCount }
    })

    // === 2. Recent Activities (last 10 items) ===
    type ActivityItem = {
      id: string
      type: 'quiz' | 'note' | 'chat'
      text: string
      detail: string
      time: string
      color: string
    }

    const recentActivities: ActivityItem[] = []

    // Add quiz attempts
    for (const qa of quizAttempts) {
      const scorePct = qa.totalMarks > 0 ? Math.round((qa.score / qa.totalMarks) * 100) : 0
      recentActivities.push({
        id: qa.id,
        type: 'quiz',
        text: `Completed ${qa.subject} Quiz`,
        detail: `Score: ${scorePct}%${qa.topic ? ` · ${qa.topic}` : ''}`,
        time: qa.createdAt.toISOString(),
        color: '#00f0ff',
      })
    }

    // Add notes
    for (const note of notes) {
      recentActivities.push({
        id: note.id,
        type: 'note',
        text: note.title || 'Created a Note',
        detail: `${note.subject}${note.topic ? ` · ${note.topic}` : ''}`,
        time: note.createdAt.toISOString(),
        color: '#a855f7',
      })
    }

    // Add chat sessions (deduplicated by grouping within 5 min windows)
    const chatAdded = new Set<string>()
    for (const chat of chatHistories) {
      const key = chat.createdAt.toISOString().slice(0, 16) // group by minute
      if (chatAdded.has(key)) continue
      chatAdded.add(key)
      recentActivities.push({
        id: `chat-${chat.createdAt.getTime()}`,
        type: 'chat',
        text: 'AI Tutor Session',
        detail: chat.content.length > 50 ? chat.content.slice(0, 50) + '...' : chat.content,
        time: chat.createdAt.toISOString(),
        color: '#ec4899',
      })
    }

    // Sort by time descending and take top 10
    recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    const topActivities = recentActivities.slice(0, 10)

    // === 3. Subjects with topic counts ===
    // For each subject, compute how many topics the user has interacted with
    const subjectTopicsDone = new Map<string, Set<string>>()

    for (const qa of quizAttempts) {
      if (qa.topic) {
        const key = qa.subject
        if (!subjectTopicsDone.has(key)) subjectTopicsDone.set(key, new Set())
        subjectTopicsDone.get(key)!.add(qa.topic)
      }
    }

    for (const note of notes) {
      if (note.topic) {
        const key = note.subject
        if (!subjectTopicsDone.has(key)) subjectTopicsDone.set(key, new Set())
        subjectTopicsDone.get(key)!.add(note.topic)
      }
    }

    const subjectsList = subjects.map((subject) => {
      const doneTopics = subjectTopicsDone.get(subject.name)
      const completedCount = doneTopics ? doneTopics.size : 0
      const totalTopics = subject._count.topics
      return {
        name: subject.name,
        topicsCount: totalTopics,
        completedCount,
        progress: totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0,
        color: subject.color,
      }
    })

    return NextResponse.json({
      weeklyActivity,
      recentActivities: topActivities,
      subjects: subjectsList,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
