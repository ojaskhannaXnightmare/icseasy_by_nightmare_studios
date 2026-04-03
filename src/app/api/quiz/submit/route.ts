import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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

    const { subject, topic, answers, questions } = await request.json()

    if (!subject || !topic || !answers || !questions) {
      return NextResponse.json(
        { error: 'Subject, topic, answers, and questions are required' },
        { status: 400 }
      )
    }

    // Calculate score
    let correctCount = 0
    const totalQuestions = questions.length
    const results = answers.map(
      (answer: { questionIndex: number; selectedOption: number }) => {
        const question = questions[answer.questionIndex]
        const isCorrect = answer.selectedOption === question.correct
        if (isCorrect) correctCount++
        return {
          questionIndex: answer.questionIndex,
          question: question.question,
          selectedOption: answer.selectedOption,
          correctOption: question.correct,
          isCorrect,
          explanation: question.explanation,
        }
      }
    )

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

    // Save quiz attempt to DB
    await db.quizAttempt.create({
      data: {
        userId: decoded.userId as string,
        subject,
        topic,
        score,
        totalMarks: totalQuestions * 1,
        answers: JSON.stringify(answers),
      },
    })

    return NextResponse.json({
      score: Math.round(score * 100) / 100,
      correct: correctCount,
      total: totalQuestions,
      results,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
