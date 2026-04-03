import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await request.json()

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "accepted" or "rejected"' },
        { status: 400 }
      )
    }

    const userId = decoded.userId as string

    const friendRequest = await db.friendRequest.findUnique({ where: { id } })
    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: 'You can only respond to requests sent to you' },
        { status: 403 }
      )
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been responded to' },
        { status: 400 }
      )
    }

    const updatedRequest = await db.friendRequest.update({
      where: { id },
      data: { status },
      include: {
        sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ friendRequest: updatedRequest })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
