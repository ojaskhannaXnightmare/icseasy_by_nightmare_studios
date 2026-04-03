import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

async function authenticate(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET: Return sample challenge (for preview / component loading)
export async function GET() {
  return NextResponse.json({
    subject: 'Mathematics',
    topic: 'Algebra',
    questions: [
      {
        question: 'If x + 5 = 12, what is the value of x?',
        options: ['5', '6', '7', '8'],
        correct: 2,
        explanation: 'Subtracting 5 from both sides: x = 12 - 5 = 7.',
      },
      {
        question: 'What is the value of 2² + 3²?',
        options: ['13', '25', '10', '5'],
        correct: 0,
        explanation: '2² = 4 and 3² = 9, so 4 + 9 = 13.',
      },
      {
        question: 'Simplify: 3(x + 2) - x',
        options: ['2x + 6', '3x + 6', '2x + 2', '4x + 6'],
        correct: 0,
        explanation: '3x + 6 - x = 2x + 6.',
      },
      {
        question: 'Which of the following is a quadratic equation?',
        options: ['y = 2x + 1', 'y = x² + 3x - 5', 'y = 1/x', 'y = √x'],
        correct: 1,
        explanation: 'A quadratic equation has the form y = ax² + bx + c where a ≠ 0.',
      },
      {
        question: 'If a = 3 and b = 4, what is a² + b²?',
        options: ['7', '12', '25', '49'],
        correct: 2,
        explanation: '3² + 4² = 9 + 16 = 25. This is the Pythagorean triple (3, 4, 5).',
      },
    ],
  })
}

// POST: Generate daily challenge questions
export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = decoded.userId as string

    // Fetch all available subjects
    const subjects = await db.subject.findMany({
      include: { topics: true },
    })

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: 'No subjects available. Please contact support.' },
        { status: 400 }
      )
    }

    // Pick a random subject
    const randomIndex = Math.floor(Math.random() * subjects.length)
    const subject = subjects[randomIndex]

    // Pick a random topic from that subject
    const topics = subject.topics.length > 0 ? subject.topics : [{ name: 'General' }]
    const topicIndex = Math.floor(Math.random() * topics.length)
    const topic = topics[topicIndex]

    // Fetch user's past daily challenges to avoid repeating
    const pastChallenges = await db.quizAttempt.findMany({
      where: { userId, subject: subject.name },
      select: { topic: true },
      distinct: ['topic'],
    })
    const usedTopics = new Set(pastChallenges.map((c) => c.topic))

    // If topic was already used, try another
    let selectedTopic = topic.name
    const availableTopics = topics.filter((t) => !usedTopics.has(t.name))
    if (availableTopics.length > 0) {
      const altIndex = Math.floor(Math.random() * availableTopics.length)
      selectedTopic = availableTopics[altIndex].name
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert ICSE exam question generator for the subject "${subject.name}".
Generate exactly 5 multiple choice questions about "${selectedTopic}" following the ICSE syllabus pattern.

These questions are for a daily challenge, so they should:
- Range from easy to medium difficulty
- Cover key concepts of the topic
- Be clear and unambiguous

Return ONLY a valid JSON array. Each item must have exactly this structure:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "A brief explanation of why the correct answer is right"
}

The "correct" field is the zero-based index of the correct option (0-3).
Do not include any markdown formatting, code fences, or extra text outside the JSON array.`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate 5 ICSE MCQ questions for ${subject.name} on the topic "${selectedTopic}". Mix easy and medium difficulty.`,
        },
      ],
      stream: false,
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      )
    }

    // Parse the AI response
    let questions: unknown[]
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      questions = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse generated questions. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      questions,
      subject: subject.name,
      topic: selectedTopic,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
