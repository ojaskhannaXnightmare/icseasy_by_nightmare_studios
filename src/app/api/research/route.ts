import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { topic, subject } = await request.json()

    if (!topic || !subject) {
      return NextResponse.json(
        { error: 'Topic and subject are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a comprehensive research assistant for ICSE (Indian Certificate of Secondary Education) students. 
You specialize in "${subject}" and provide in-depth, well-structured research content.

When researching a topic, you must:
1. Provide a clear, thorough explanation of the concept
2. Include relevant ICSE syllabus details and key points
3. Use proper markdown formatting with headings, subheadings, bullet points, and bold text
4. Include practical examples and real-world applications where appropriate
5. Highlight important definitions, formulas, or key terms
6. Structure content in a way that is easy to study and review
7. Add a "Key Points to Remember" section at the end
8. Use markdown formatting extensively for readability`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Provide a comprehensive, detailed research study material on "${topic}" for ICSE ${subject}. Include all important concepts, explanations, examples, and key points that a student needs to know for their ICSE exams. Format the response in clean markdown.`,
        },
      ],
      stream: false,
    })

    const content = response.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate research content' },
        { status: 500 }
      )
    }

    return NextResponse.json({ content })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
