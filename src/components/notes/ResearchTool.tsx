'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Sparkles, Loader2, Save, BookOpen, ChevronRight,
  Clock, AlertCircle, CheckCircle2, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'

const SUBJECTS = [
  'English', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Computer Science'
]

interface ResearchEntry {
  id: string
  topic: string
  subject: string
  result: string
  timestamp: number
}

export default function ResearchTool() {
  const { setCurrentPage } = useStore()
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [researching, setResearching] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<ResearchEntry[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('research-history')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const saveHistory = (entries: ResearchEntry[]) => {
    setHistory(entries)
    try {
      localStorage.setItem('research-history', JSON.stringify(entries))
    } catch { /* ignore */ }
  }

  const doResearch = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to research')
      return
    }
    if (!subject) {
      setError('Please select a subject')
      return
    }
    setError('')
    setResult('')
    setResearching(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Research and provide comprehensive information on the topic "${topic}" for ICSE ${subject}. Include key concepts, important definitions, historical context if relevant, and connections to exam topics. Structure the response clearly with headings and bullet points. Format in markdown.`
        })
      })
      const data = await res.json()
      if (data.content) {
        setResult(data.content)
        const entry: ResearchEntry = {
          id: `research-${Date.now()}`,
          topic: topic.trim(),
          subject,
          result: data.content,
          timestamp: Date.now()
        }
        saveHistory([entry, ...history])
        // Scroll to result
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        setError('Research failed. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    }
    setResearching(false)
  }

  const handleSaveAsNote = async () => {
    if (!result || !topic.trim() || !subject) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Research: ${topic}`,
          subject,
          topic: topic.trim(),
          content: result,
          noteType: 'long'
        })
      })
      if (res.ok) {
        setShowSaveDialog(false)
        setResult('')
        setTopic('')
      }
    } catch {
      setError('Failed to save note')
    }
    setSaving(false)
  }

  const loadFromHistory = (entry: ResearchEntry) => {
    setTopic(entry.topic)
    setSubject(entry.subject)
    setResult(entry.result)
    setError('')
  }

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-3 neon-text-cyan">{line.replace('# ', '')}</h1>
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mb-2 neon-text-purple">{line.replace('## ', '')}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mb-2 text-white">{line.replace('### ', '')}</h3>
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1 text-gray-300 list-disc">{line.replace(/^[-*]\s/, '')}</li>
      if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 mb-1 text-gray-300 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="mb-2 font-bold text-cyan-400">{line.replace(/\*\*/g, '')}</p>
      if (line.trim() === '') return <div key={i} className="h-2" />
      return <p key={i} className="mb-2 leading-relaxed">{line}</p>
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
            <Search className="w-7 h-7" />
            AI Research Tool
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Deep dive into any topic with AI-powered research</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Research Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Input Card */}
          <div className="glass rounded-xl p-5 neon-border">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              What would you like to research?
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label className="text-gray-400 text-sm mb-1.5 block">Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="glass bg-white/5 border-white/10 text-white h-11">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/10 bg-[#0f0f19]">
                      {SUBJECTS.map(s => (
                        <SelectItem key={s} value={s} className="text-gray-300 focus:bg-white/5 focus:text-white">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2]">
                  <Label className="text-gray-400 text-sm mb-1.5 block">Research Topic</Label>
                  <Input
                    placeholder="e.g., The impact of the Industrial Revolution on modern society..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !researching && doResearch()}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 h-11"
                    disabled={researching}
                  />
                </div>
              </div>
              <Button
                onClick={doResearch}
                disabled={researching || !topic.trim()}
                className="btn-neon-solid gap-2 px-6 w-full sm:w-auto"
              >
                {researching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Research</>
                )}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {researching && (
            <div className="glass rounded-xl p-8 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-gray-400 text-sm">Analyzing topic and gathering information...</span>
              </div>
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
              <Skeleton className="h-4 w-4/6 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
              <Skeleton className="h-4 w-2/3 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-4/6 bg-white/5" />
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && !researching && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">Research Results</h3>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">{subject}</Badge>
                  </div>
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="btn-neon gap-2 text-xs px-3 py-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save as Note
                  </Button>
                </div>
                <ScrollArea className="max-h-[60vh]">
                  <div className="p-5 markdown-content">
                    {renderMarkdown(result)}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-xl p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Research History
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No research history yet</p>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {history.slice(0, 20).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                        {entry.topic}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[10px] px-1.5 py-0 bg-white/5 text-gray-500 border border-white/5">
                          {entry.subject}
                        </Badge>
                        <span className="text-[10px] text-gray-600">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="glass-strong border border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Save as Note</DialogTitle>
            <DialogDescription className="text-gray-400">
              This research will be saved as a note in your collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <BookOpen className="w-4 h-4 text-gray-500" />
              Subject: <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">{subject}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="w-4 text-center text-gray-500">📋</span>
              Topic: <span className="text-white">{topic}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="w-4 text-center text-gray-500">📄</span>
              Type: <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">Long Notes</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSaveAsNote} disabled={saving} className="btn-neon-solid gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Note</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
