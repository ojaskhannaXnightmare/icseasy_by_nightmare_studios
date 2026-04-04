import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAI } from '@/lib/ai'

async function authenticate(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, topic, questionCount = 5 } = await request.json()

    if (!subject || !topic) {
      return NextResponse.json(
        { error: 'Subject and topic are required' },
        { status: 400 }
      )
    }

    const ai = await getAI()
    if ('error' in ai) {
      return NextResponse.json({ error: ai.error }, { status: 503 })
    }
    const zai = ai.zai

    const systemPrompt = `You are an expert ICSE exam question generator for the subject "${subject}".
Generate exactly ${questionCount} multiple choice questions about "${topic}" following the ICSE syllabus pattern.

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
          content: `Generate ${questionCount} ICSE MCQ questions for ${subject} on the topic "${topic}".`,
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

    // Parse the AI response - it may contain markdown code fences
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

    return NextResponse.json({ questions })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
