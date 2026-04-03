'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Loader2, Save, X, BookOpen, FileText, ListChecks
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

const SUBJECTS = [
  'English', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Computer Science'
]

interface GenerateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNoteCreated: () => void
}

export function GenerateNoteDialog({ open, onOpenChange, onNoteCreated }: GenerateNoteDialogProps) {
  const [step, setStep] = useState<'config' | 'generating' | 'preview'>('config')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [noteType, setNoteType] = useState<'short' | 'long' | 'bullet'>('short')
  const [generatedContent, setGeneratedContent] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset state when dialog opens
  const openRef = useRef(false)
  useEffect(() => {
    if (open && !openRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('config')
      setSubject('')
      setTopic('')
      setNoteType('short')
      setGeneratedContent('')
      setGeneratedTitle('')
      setError('')
    }
    openRef.current = open
  }, [open])

  const generateNote = async () => {
    if (!subject || !topic.trim()) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setStep('generating')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate ICSE ${subject} study notes on the topic "${topic}" in ${noteType} format. The notes should be comprehensive, well-structured, and suitable for ICSE exam preparation. Include key concepts, definitions, and important points. Format the response in markdown. Do not include a title at the top - just start with the content directly.`
        })
      })
      const data = await res.json()
      if (data.content) {
        setGeneratedContent(data.content)
        setGeneratedTitle(`${topic} - ${subject} Notes`)
        setStep('preview')
      } else {
        setError('Failed to generate notes. Please try again.')
        setStep('config')
      }
    } catch {
      setError('Network error. Please try again.')
      setStep('config')
    }
  }

  const saveNote = async () => {
    if (!generatedContent) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedTitle,
          subject,
          topic: topic.trim(),
          content: generatedContent,
          noteType
        })
      })
      if (res.ok) {
        onNoteCreated()
        onOpenChange(false)
      }
    } catch {
      setError('Failed to save note')
    }
    setSaving(false)
  }

  const noteTypeOptions = [
    { value: 'short' as const, label: 'Short Summary', icon: FileText, desc: 'Concise overview' },
    { value: 'long' as const, label: 'Detailed Notes', icon: BookOpen, desc: 'Comprehensive coverage' },
    { value: 'bullet' as const, label: 'Bullet Points', icon: ListChecks, desc: 'Quick revision' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-text flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate AI Note
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create study notes powered by AI for any ICSE subject and topic
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Configuration Step */}
          {step === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 mt-4"
            >
              <div className="space-y-2">
                <Label className="text-gray-300">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="glass bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/10 bg-[#0f0f19]">
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s} className="text-gray-300 focus:bg-white/5 focus:text-white">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Topic</Label>
                <Input
                  placeholder="e.g., Photosynthesis, Quadratic Equations, French Revolution..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Note Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {noteTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNoteType(opt.value)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        noteType === opt.value
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <opt.icon className="w-5 h-5 mx-auto mb-1.5" />
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">
                  Cancel
                </Button>
                <Button onClick={generateNote} className="btn-neon-solid gap-2 px-6">
                  <Sparkles className="w-4 h-4" />
                  Generate
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center space-y-6"
            >
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-purple-500/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="relative w-full h-full rounded-full glass flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Generating your notes...</h3>
                <p className="text-sm text-gray-500">
                  AI is creating comprehensive {noteType} notes for {topic}
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-5/6 bg-white/5" />
                <Skeleton className="h-4 w-4/6 bg-white/5" />
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-3/6 bg-white/5" />
              </div>
            </motion.div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 mt-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{subject}</Badge>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">{topic}</Badge>
                  <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20">{noteType}</Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 max-h-[40vh] overflow-y-auto">
                <div className="markdown-content text-gray-300 text-sm leading-relaxed">
                  {generatedContent.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-3 neon-text-cyan">{line.replace('# ', '')}</h1>
                    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mb-2 neon-text-purple">{line.replace('## ', '')}</h2>
                    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mb-2 text-white">{line.replace('### ', '')}</h3>
                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1 text-gray-300">{line.replace(/^[-*]\s/, '')}</li>
                    if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 mb-1 text-gray-300 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
                    if (line.trim() === '') return <br key={i} />
                    return <p key={i} className="mb-2">{line}</p>
                  })}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={() => setStep('config')} className="text-gray-400">
                  Regenerate
                </Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">
                  Cancel
                </Button>
                <Button onClick={saveNote} disabled={saving} className="btn-neon-solid gap-2 px-6">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Note</>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
