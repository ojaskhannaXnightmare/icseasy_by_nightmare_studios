import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getAI } from '@/lib/ai'

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

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert ICSE (Indian Certificate of Secondary Education) tutor named "ICSEasy AI Tutor" by NIGHTMARE STUDIOS. 
Your role is to help ICSE students with their studies across all subjects.

Guidelines:
- Be patient, encouraging, and clear in explanations
- Use examples relevant to the ICSE curriculum
- Provide step-by-step solutions for math and science problems
- Explain concepts in a way that is easy to understand
- Reference ICSE exam patterns and marking schemes when relevant
- Use markdown formatting for better readability
- If asked about non-academic topics, politely redirect to ICSE-related studies
- Always be supportive and motivate students to learn
- Keep responses concise but thorough`

    const ai = await getAI()
    if ('error' in ai) {
      return NextResponse.json({ error: ai.error }, { status: 503 })
    }
    const zai = ai.zai

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: (m.role === 'user' || m.role === 'assistant' ? m.role : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const response = await zai.chat.completions.create({
      messages: chatMessages,
      stream: false,
    })

    const content = response.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Save user message to chat history
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop()
    if (lastUserMessage) {
      await db.chatHistory.create({
        data: {
          userId: decoded.userId as string,
          role: 'user',
          content: lastUserMessage.content,
        },
      })
    }

    // Save assistant response to chat history
    await db.chatHistory.create({
      data: {
        userId: decoded.userId as string,
        role: 'assistant',
        content,
      },
    })

    return NextResponse.json({ message: content })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
