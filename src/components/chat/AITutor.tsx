'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Trash2, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'

const suggestedPrompts = [
  "Explain Newton's Laws of Motion",
  'Help with Algebra: Quadratic Equations',
  'Biology: Explain Cell Structure',
  'Chemistry: Periodic Table Trends',
  'English: How to write an essay',
  'History: Causes of World War I',
]

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#00f0ff]/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function AITutor() {
  const {
    chatMessages,
    addChatMessage,
    clearChatMessages,
    setCurrentPage,
  } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages, loading])

  const handleSend = async (message?: string) => {
    const content = message || input.trim()
    if (!content || loading) return

    const userMessage = {
      id: `user-${chatMessages.length + 1}`,
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    }
    addChatMessage(userMessage)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      const data = await res.json()

      const assistantMessage = {
        id: `assistant-${chatMessages.length + 2}`,
        role: 'assistant' as const,
        content: data.response || data.content || 'Sorry, I could not process your request. Please try again.',
        timestamp: Date.now(),
      }
      addChatMessage(assistantMessage)
    } catch {
      addChatMessage({
        id: `error-${chatMessages.length + 2}`,
        role: 'assistant' as const,
        content: 'Something went wrong. Please check your connection and try again.',
        timestamp: Date.now(),
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen lg:pl-[260px] flex flex-col pt-14 lg:pt-0">
      {/* Background effects */}
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-80 h-80 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong px-4 sm:px-6 py-3 flex items-center justify-between border-b border-white/5 relative z-10"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-[#0a0a0f]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold">AI Tutor</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              <span className="text-xs text-muted-foreground">Online &bull; ICSE Expert</span>
            </div>
          </div>
        </div>

        {chatMessages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChatMessages}
            className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </Button>
        )}
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div ref={scrollRef} className="h-full overflow-y-auto px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            {chatMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff]/20 to-[#a855f7]/20 flex items-center justify-center mb-5">
                  <Sparkles className="w-8 h-8 text-[#00f0ff]" />
                </div>
                <h2 className="text-xl font-bold mb-2">How can I help you?</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-md">
                  I&apos;m your AI tutor specialized in ICSE subjects. Ask me about any topic and I&apos;ll help you understand it better.
                </p>

                {/* Suggested Prompts */}
                <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-left p-3 rounded-xl glass border border-white/5 hover:border-[#00f0ff]/20 hover:bg-[#00f0ff]/5 transition-all duration-200 text-sm text-muted-foreground hover:text-foreground group"
                    >
                      <span className="text-[#00f0ff] mr-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        &rarr;
                      </span>
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] ${
                        msg.role === 'user'
                          ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/20 rounded-2xl rounded-br-md px-4 py-3'
                          : 'glass rounded-2xl rounded-bl-md px-4 py-3'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center">
                            <Bot className="w-3 h-3 text-[#0a0a0f]" />
                          </div>
                          <span className="text-xs text-muted-foreground">AI Tutor</span>
                        </div>
                      )}
                      <div className={`text-sm leading-relaxed prose-sm ${
                        msg.role === 'user' ? 'text-[#e2e8f0]' : 'markdown-content'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="glass rounded-2xl rounded-bl-md">
                      <div className="flex items-center gap-2 px-4 py-3">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center">
                          <Bot className="w-3 h-3 text-[#0a0a0f]" />
                        </div>
                        <LoadingDots />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-strong border-t border-white/5 px-4 sm:px-6 py-4 relative z-10"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about ICSE topics..."
              className="h-11 bg-white/5 border-white/10 focus:border-[#00f0ff]/40 rounded-xl pr-4 text-sm"
              disabled={loading}
            />
          </div>
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="btn-neon-solid h-11 w-11 rounded-xl p-0 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 max-w-3xl mx-auto">
          AI Tutor may make mistakes. Verify important information with your textbooks.
        </p>
      </motion.div>
    </div>
  )
}
