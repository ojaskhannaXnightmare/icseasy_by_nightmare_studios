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

export async function GET(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'markdown'

    // Fetch all user's notes
    const notes = await db.note.findMany({
      where: { userId: decoded.userId as string },
      orderBy: [{ subject: 'asc' }, { updatedAt: 'desc' }],
    })

    if (notes.length === 0) {
      return new Response('You have no notes to export.', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="icseasy-notes.${format === 'markdown' ? 'md' : 'txt'}"`,
        },
      })
    }

    // Group notes by subject
    const grouped = new Map<string, typeof notes>()
    for (const note of notes) {
      if (!grouped.has(note.subject)) {
        grouped.set(note.subject, [])
      }
      grouped.get(note.subject)!.push(note)
    }

    let content = ''
    const now = new Date().toISOString().split('T')[0]

    if (format === 'markdown') {
      content += `# ICSEasy Notes Export\n\n`
      content += `> Exported on ${now}\n`
      content += `> Total notes: ${notes.length}\n\n`
      content += `---\n\n`

      for (const [subject, subjectNotes] of grouped) {
        content += `## ${subject}\n\n`
        for (const note of subjectNotes) {
          content += `### ${note.title}\n\n`
          content += `**Topic:** ${note.topic}  \n`
          content += `**Type:** ${note.noteType}  \n`
          content += `**Created:** ${note.createdAt.toISOString().split('T')[0]}  \n`
          content += `${note.isBookmarked ? '**⭐ Bookmarked**  \n' : ''}\n`
          content += `${note.content}\n\n`
          content += `---\n\n`
        }
      }

      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="icseasy-notes.md"',
        },
      })
    } else {
      // Plain text format
      content += `ICSEasy Notes Export\n`
      content += `Exported on ${now}\n`
      content += `Total notes: ${notes.length}\n`
      content += `${'='.repeat(50)}\n\n`

      for (const [subject, subjectNotes] of grouped) {
        content += `${'─'.repeat(50)}\n`
        content += `  ${subject.toUpperCase()}\n`
        content += `${'─'.repeat(50)}\n\n`

        for (const note of subjectNotes) {
          content += `  Title: ${note.title}\n`
          content += `  Topic: ${note.topic}\n`
          content += `  Type: ${note.noteType}\n`
          content += `  Created: ${note.createdAt.toISOString().split('T')[0]}\n`
          if (note.isBookmarked) {
            content += `  [Bookmarked]\n`
          }
          content += `\n  ${note.content.split('\n').join('\n  ')}\n\n`
          content += `${'·'.repeat(40)}\n\n`
        }
      }
    }

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="icseasy-notes.txt"',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
