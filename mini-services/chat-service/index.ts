/**
 * ICSEasy Chat Service — Socket.io Mini-Service
 * NIGHTMARE STUDIOS
 *
 * Runs independently on port 3003.
 * Uses in-memory storage (Maps) for messages, user tracking, and group membership.
 * JWT verification for socket authentication.
 */

import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT = 3003;
const JWT_SECRET = 'n1ghtm4r3_stud10s_1cs3asy_s3cr3t_k3y_2025_x9f2k7';

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

/** userId → Set<socketId>  (a user may have multiple tabs) */
const userSockets = new Map<string, Set<string>>();

/** socketId → userId */
const socketUser = new Map<string, string>();

/** userId → { id, email, role, iat, exp }  (decoded JWT payload fragment) */
const userInfo = new Map<string, JwtUserPayload>();

/** Recent private message history (last 200 per room) – keyed by sorted userId pair */
const privateMessages = new Map<string, PrivateMessage[]>();

/** Recent group message history (last 200 per group) */
const groupMessages = new Map<string, GroupMessage[]>();

/** groupId → Set<userId> */
const groupMembers = new Map<string, Set<string>>();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JwtUserPayload {
  id: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

interface GroupMessage {
  id: string;
  senderId: string;
  groupId: string;
  content: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

/**
 * Build a deterministic room key for a private conversation between two users.
 * Always sorts the pair so A↔B and B↔A resolve to the same key.
 */
const privateRoomKey = (a: string, b: string): string =>
  [a, b].sort().join('::');

/** Trim a message buffer to the most recent N entries */
const trimBuffer = <T>(buf: T[], max = 200): T[] =>
  buf.length > max ? buf.slice(buf.length - max) : buf;

/** Get all online user IDs */
const getOnlineUsers = (): string[] => Array.from(userSockets.keys());

// ---------------------------------------------------------------------------
// Socket.io server
// ---------------------------------------------------------------------------

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---------------------------------------------------------------------------
// Middleware — JWT auth
// ---------------------------------------------------------------------------

io.use((socket, next) => {
  const token =
    (socket.handshake.auth as Record<string, string>).token ??
    (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

  if (!token) {
    return next(new Error('Authentication token is required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    if (!decoded.id) {
      return next(new Error('Invalid token payload: missing user id'));
    }
    // Attach decoded user to socket for downstream handlers
    (socket.data as Record<string, unknown>).user = decoded;
    next();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Token verification failed';
    return next(new Error(`Authentication failed: ${message}`));
  }
});

// ---------------------------------------------------------------------------
// Connection handler
// ---------------------------------------------------------------------------

io.on('connection', (socket: Socket) => {
  const user = socket.data.user as JwtUserPayload;
  const userId: string = user.id;

  console.log(`[chat] ${user.email} connected (socket=${socket.id})`);

  // Track the socket ↔ user mapping
  socketUser.set(socket.id, userId);
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket.id);
  userInfo.set(userId, user);

  // ---------------------------------------------------
  // Event: join
  // ---------------------------------------------------
  socket.on('join', () => {
    // Broadcast updated online status to all connected clients
    const online = getOnlineUsers();
    io.emit('online-status', { online });
    console.log(`[chat] ${user.email} joined. Online: [${online.join(', ')}]`);
  });

  // ---------------------------------------------------
  // Event: private-message
  // ---------------------------------------------------
  socket.on(
    'private-message',
    (data: { receiverId: string; content: string }, ack?: (status: { ok: boolean; message?: PrivateMessage }) => void) => {
      const { receiverId, content } = data;

      if (!receiverId || !content) {
        ack?.({ ok: false });
        return;
      }

      const msg: PrivateMessage = {
        id: generateId(),
        senderId: userId,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
      };

      // Persist to in-memory buffer
      const roomKey = privateRoomKey(userId, receiverId);
      const buf = privateMessages.get(roomKey) ?? [];
      buf.push(msg);
      privateMessages.set(roomKey, trimBuffer(buf));

      // Deliver to receiver (all their sockets)
      const receiverSocketIds = userSockets.get(receiverId);
      if (receiverSocketIds) {
        for (const sid of receiverSocketIds) {
          io.to(sid).emit('private-message', msg);
        }
      }

      // Also echo back to sender (all their sockets, including this one)
      const senderSocketIds = userSockets.get(userId);
      if (senderSocketIds) {
        for (const sid of senderSocketIds) {
          if (sid !== socket.id) {
            io.to(sid).emit('private-message', msg);
          }
        }
      }

      // Acknowledge to the originating socket
      ack?.({ ok: true, message: msg });
    },
  );

  // ---------------------------------------------------
  // Event: group-message
  // ---------------------------------------------------
  socket.on(
    'group-message',
    (data: { groupId: string; content: string }, ack?: (status: { ok: boolean; message?: GroupMessage }) => void) => {
      const { groupId, content } = data;

      if (!groupId || !content) {
        ack?.({ ok: false });
        return;
      }

      const msg: GroupMessage = {
        id: generateId(),
        senderId: userId,
        groupId,
        content,
        timestamp: new Date().toISOString(),
      };

      // Persist
      const buf = groupMessages.get(groupId) ?? [];
      buf.push(msg);
      groupMessages.set(groupId, trimBuffer(buf));

      // Deliver to all members of the group (all their sockets)
      const members = groupMembers.get(groupId);
      if (members) {
        for (const memberId of members) {
          const memberSockets = userSockets.get(memberId);
          if (memberSockets) {
            for (const sid of memberSockets) {
              io.to(sid).emit('group-message', msg);
            }
          }
        }
      }

      // If no members registered yet, just broadcast to everyone as fallback
      if (!members || members.size === 0) {
        socket.emit('group-message', msg);
      }

      ack?.({ ok: true, message: msg });
    },
  );

  // ---------------------------------------------------
  // Event: typing
  // ---------------------------------------------------
  socket.on('typing', (data: { receiverId: string }) => {
    const { receiverId } = data;
    if (!receiverId) return;

    const payload = { senderId: userId, timestamp: new Date().toISOString() };

    // Emit to all of receiver's sockets
    const receiverSocketIds = userSockets.get(receiverId);
    if (receiverSocketIds) {
      for (const sid of receiverSocketIds) {
        io.to(sid).emit('typing', payload);
      }
    }
  });

  // ---------------------------------------------------
  // Event: get-online-status
  // ---------------------------------------------------
  socket.on('get-online-status', (ack?: (online: string[]) => void) => {
    const online = getOnlineUsers();
    ack?.(online);
  });

  // ---------------------------------------------------
  // Event: join-group
  // ---------------------------------------------------
  socket.on('join-group', (data: { groupId: string }) => {
    const { groupId } = data;
    if (!groupId) return;

    if (!groupMembers.has(groupId)) {
      groupMembers.set(groupId, new Set());
    }
    groupMembers.get(groupId)!.add(userId);
    console.log(`[chat] ${user.email} joined group ${groupId}`);
  });

  // ---------------------------------------------------
  // Event: leave-group
  // ---------------------------------------------------
  socket.on('leave-group', (data: { groupId: string }) => {
    const { groupId } = data;
    if (!groupId) return;

    const members = groupMembers.get(groupId);
    if (members) {
      members.delete(userId);
      if (members.size === 0) {
        groupMembers.delete(groupId);
      }
    }
    console.log(`[chat] ${user.email} left group ${groupId}`);
  });

  // ---------------------------------------------------
  // Disconnect
  // ---------------------------------------------------
  socket.on('disconnect', (reason) => {
    console.log(`[chat] ${user.email} disconnected (${reason})`);

    // Remove this socket from user's socket set
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        userInfo.delete(userId);
        // Remove from all groups
        for (const [, members] of groupMembers) {
          members.delete(userId);
        }
      }
    }
    socketUser.delete(socket.id);

    // Broadcast updated online status
    const online = getOnlineUsers();
    io.emit('online-status', { online });
  });

  // ---------------------------------------------------
  // Error handler
  // ---------------------------------------------------
  socket.on('error', (err) => {
    console.error(`[chat] Socket error (${socket.id}):`, err);
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`\n============================================`);
  console.log(`  ICSEasy Chat Service — NIGHTMARE STUDIOS`);
  console.log(`  Socket.io server running on port ${PORT}`);
  console.log(`============================================\n`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

const shutdown = (signal: string) => {
  console.log(`\n[chat] Received ${signal}, shutting down gracefully...`);
  io.close();
  httpServer.close(() => {
    console.log('[chat] Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
