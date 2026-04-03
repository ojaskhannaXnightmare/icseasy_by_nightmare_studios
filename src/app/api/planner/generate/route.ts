import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

async function authenticate(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// POST: Generate AI study plan
export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = decoded.userId as string

    // Fetch user's subjects from DB
    const subjects = await db.subject.findMany({
      include: { topics: true },
    })

    // Fetch user's quiz attempts and notes count for context
    const [quizAttempts, notesCount, studySessions] = await Promise.all([
      db.quizAttempt.findMany({
        where: { userId },
        select: { subject: true, score: true, totalMarks: true },
      }),
      db.note.count({ where: { userId } }),
      db.studySession.findMany({
        where: { userId, type: 'focus' },
        select: { duration: true },
      }),
    ])

    // Calculate per-subject quiz performance
    const subjectScores: Record<string, { avg: number; count: number }> = {}
    for (const qa of quizAttempts) {
      const pct = qa.totalMarks > 0 ? (qa.score / qa.totalMarks) * 100 : 0
      if (!subjectScores[qa.subject]) {
        subjectScores[qa.subject] = { avg: 0, count: 0 }
      }
      subjectScores[qa.subject].avg += pct
      subjectScores[qa.subject].count += 1
    }
    for (const key of Object.keys(subjectScores)) {
      subjectScores[key].avg = Math.round(subjectScores[key].avg / subjectScores[key].count)
    }

    const totalFocusMinutes = Math.round(
      studySessions.reduce((sum, s) => sum + s.duration, 0) / 60
    )

    // Build subject context for AI
    const subjectList = subjects.map((s) => {
      const score = subjectScores[s.name]
      return `${s.name} (Topics: ${s.topics.map((t) => t.name).join(', ')}${score ? `, Avg Quiz Score: ${score.avg}%, Quizzes Taken: ${score.count}` : ', No quizzes taken'})`
    }).join('\n')

    const userStats = `Total notes created: ${notesCount}, Total quizzes taken: ${quizAttempts.length}, Total study time: ${totalFocusMinutes} minutes`

    const zai = await ZAI.create()

    const systemPrompt = `You are an ICSE study planner for Indian Certificate of Secondary Education students. Create a personalized weekly study plan based on the student's performance data.

The student has access to these subjects and their performance:
${subjectList}

User stats: ${userStats}

IMPORTANT RULES:
- Focus more time on subjects with lower average scores
- Distribute study time across the week realistically (not more than 3-4 hours per day)
- Include revision sessions
- Balance between strong and weak subjects
- Include 1 rest day or light study day

Return ONLY a valid JSON object with this exact structure:
{
  "plan": {
    "monday": [{ "subject": "Subject Name", "topic": "Specific Topic", "duration": "45 min", "priority": "high" | "medium" | "low" }],
    "tuesday": [{ "subject": "Subject Name", "topic": "Specific Topic", "duration": "45 min", "priority": "high" | "medium" | "low" }],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...],
    "saturday": [...],
    "sunday": [...]
  },
  "tips": ["Study tip 1", "Study tip 2", "Study tip 3"]
}

Each day should have 2-4 study blocks. Topics should be specific ICSE syllabus topics.
Do not include any markdown formatting, code fences, or extra text outside the JSON.`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Generate a personalized weekly study plan for me based on my performance data. Focus on improving my weak areas while maintaining my strengths.',
        },
      ],
      stream: false,
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate study plan' },
        { status: 500 }
      )
    }

    // Parse the AI response
    let plan: unknown
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      plan = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse generated plan. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET: Return a sample study plan
export async function GET() {
  try {
    const samplePlan = {
      plan: {
        monday: [
          { subject: 'Mathematics', topic: 'Quadratic Equations', duration: '45 min', priority: 'high' },
          { subject: 'Physics', topic: 'Laws of Motion', duration: '30 min', priority: 'medium' },
          { subject: 'English', topic: 'Shakespeare - Merchant of Venice', duration: '30 min', priority: 'low' },
        ],
        tuesday: [
          { subject: 'Chemistry', topic: 'Periodic Table & Trends', duration: '45 min', priority: 'high' },
          { subject: 'Biology', topic: 'Cell Division - Mitosis', duration: '30 min', priority: 'medium' },
          { subject: 'History', topic: 'Indian National Movement', duration: '30 min', priority: 'low' },
        ],
        wednesday: [
          { subject: 'Mathematics', topic: 'Trigonometry', duration: '45 min', priority: 'high' },
          { subject: 'Geography', topic: 'Climate of India', duration: '30 min', priority: 'medium' },
        ],
        thursday: [
          { subject: 'Physics', topic: 'Electricity & Circuits', duration: '45 min', priority: 'high' },
          { subject: 'Chemistry', topic: 'Chemical Bonding', duration: '30 min', priority: 'medium' },
          { subject: 'English', topic: 'Grammar - Tenses', duration: '30 min', priority: 'low' },
        ],
        friday: [
          { subject: 'Biology', topic: 'Human Digestive System', duration: '45 min', priority: 'high' },
          { subject: 'Mathematics', topic: 'Statistics & Probability', duration: '30 min', priority: 'medium' },
          { subject: 'Hindi', topic: 'Comprehension Practice', duration: '30 min', priority: 'low' },
        ],
        saturday: [
          { subject: 'Physics', topic: 'Light - Reflection & Refraction', duration: '45 min', priority: 'medium' },
          { subject: 'Chemistry', topic: 'Acids, Bases & Salts', duration: '30 min', priority: 'medium' },
          { subject: 'Revision', topic: 'Weekly Review of All Subjects', duration: '60 min', priority: 'high' },
        ],
        sunday: [
          { subject: 'Revision', topic: 'Weak Areas Review', duration: '45 min', priority: 'high' },
          { subject: 'Practice', topic: 'Mock Test Practice', duration: '30 min', priority: 'medium' },
        ],
      },
      tips: [
        'Start with difficult subjects when your mind is fresh in the morning',
        'Take 5-10 minute breaks between study sessions',
        'Practice previous year ICSE papers for exam preparation',
        'Review your notes at the end of each study session',
        'Stay hydrated and maintain a regular sleep schedule',
      ],
    }

    return NextResponse.json(samplePlan)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
