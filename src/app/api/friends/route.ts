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

    const userId = decoded.userId as string

    // Get accepted friends
    const acceptedSent = await db.friendRequest.findMany({
      where: { senderId: userId, status: 'accepted' },
      include: { receiver: { select: { id: true, name: true, email: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
    })

    const acceptedReceived = await db.friendRequest.findMany({
      where: { receiverId: userId, status: 'accepted' },
      include: { sender: { select: { id: true, name: true, email: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
    })

    const friends = [
      ...acceptedSent.map((r) => r.receiver),
      ...acceptedReceived.map((r) => r.sender),
    ]

    // Get pending requests (received)
    const pendingRequests = await db.friendRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: { sender: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ friends, pendingRequests })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverEmail } = await request.json()

    if (!receiverEmail) {
      return NextResponse.json(
        { error: 'Receiver email is required' },
        { status: 400 }
      )
    }

    const userId = decoded.userId as string

    // Find receiver
    const receiver = await db.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (receiver.id === userId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check for existing request or friendship
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: userId },
        ],
      },
    })

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends with this user' },
          { status: 400 }
        )
      }
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already sent' },
          { status: 400 }
        )
      }
    }

    const friendRequest = await db.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: receiver.id,
        status: 'pending',
      },
      include: { receiver: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    })

    return NextResponse.json({ friendRequest }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
