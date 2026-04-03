'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Send, Circle, ImagePlus, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore, type FriendData, type MessageData } from '@/store/useStore'

export default function ChatPage() {
  const { selectedFriend, setCurrentPage, user, setSelectedFriend } = useStore()
  const [messages, setMessages] = useState<MessageData[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!selectedFriend) return
    try {
      const res = await fetch(`/api/messages?friendId=${selectedFriend.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [selectedFriend])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Socket.io for real-time messages
  useEffect(() => {
    if (!selectedFriend) return
    let socket: ReturnType<typeof import('socket.io-client').io> | null = null

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        socket = io('/?XTransformPort=3003', { transports: ['websocket'] })

        socket.on('connect', () => {
          console.log('Socket connected')
        })

        socket.on('private-message', (msg: MessageData) => {
          if (
            (msg.senderId === selectedFriend.id && msg.receiverId === user?.id) ||
            (msg.senderId === user?.id && msg.receiverId === selectedFriend.id)
          ) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev
              return [...prev, msg]
            })
          }
        })
      } catch { /* socket not available */ }
    }

    initSocket()

    return () => {
      if (socket) socket.disconnect()
    }
  }, [selectedFriend, user])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend) return

    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update
    const tempMsg: MessageData = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || '',
      receiverId: selectedFriend.id,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { name: user?.name || 'You', avatarUrl: user?.avatarUrl }
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedFriend.id,
          content
        })
      })
      if (res.ok) {
        const data = await res.json()
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m))
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (!selectedFriend) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-gray-400 mb-4">No friend selected</p>
          <Button onClick={() => setCurrentPage('friends')} className="btn-neon">
            Go to Friends
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col max-w-3xl mx-auto"
    >
      {/* Chat Header */}
      <div className="glass-strong p-4 flex items-center gap-3 border-b border-white/5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedFriend(null)
            setCurrentPage('friends')
          }}
          className="text-gray-400 hover:text-white p-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="relative">
          <Avatar className="w-10 h-10 border border-white/10">
            <AvatarImage src={selectedFriend.avatarUrl || undefined} />
            <AvatarFallback className="bg-white/10 text-gray-400">
              {getInitials(selectedFriend.name)}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
            selectedFriend.isOnline ? 'bg-green-400' : 'bg-gray-600'
          } border-2 border-[#0f0f19]`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm truncate">{selectedFriend.name}</h2>
          <p className="text-xs text-gray-500">
            {selectedFriend.isOnline ? (
              <span className="text-green-400">Online</span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-12 w-48 rounded-2xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">Start a conversation with {selectedFriend.name}</p>
              <p className="text-gray-600 text-xs mt-1">Say hello! 👋</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isMine = msg.senderId === user?.id
              const showAvatar = !isMine && (index === 0 || messages[index - 1]?.senderId !== msg.senderId)
              const showTime = index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex gap-2 mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && showAvatar && (
                    <Avatar className="w-7 h-7 shrink-0 mt-1 border border-white/5">
                      <AvatarImage src={msg.sender?.avatarUrl || selectedFriend.avatarUrl || undefined} />
                      <AvatarFallback className="bg-white/10 text-[10px] text-gray-400">
                        {getInitials(msg.sender?.name || selectedFriend.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!isMine && !showAvatar && <div className="w-7 shrink-0" />}

                  <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 text-white rounded-tr-md'
                        : 'glass border border-white/5 text-gray-300 rounded-tl-md'
                    }`}>
                      {msg.content}
                    </div>
                    {showTime && (
                      <p className={`text-[10px] text-gray-600 mt-1 px-1 ${
                        isMine ? 'text-right' : 'text-left'
                      }`}>
                        {formatTime(msg.createdAt)}
                        {isMine && (
                          <span className="ml-1 text-cyan-500/50">
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 glass-strong border-t border-white/5 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 pr-10"
              disabled={sending}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-neon-solid p-2.5 h-11 w-11"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}
