'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  BookmarkCheck,
  Search,
  X,
  ChevronRight,
  Clock,
  FileText,
  ArrowUpDown,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useStore, type NoteData } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'

const SUBJECT_COLORS: Record<string, string> = {
  'English': 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  'Mathematics': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  'Physics': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  'Chemistry': 'text-green-400 border-green-400/30 bg-green-400/10',
  'Biology': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  'History': 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  'Geography': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  'Computer Science': 'text-violet-400 border-violet-400/30 bg-violet-400/10',
}

type SortOption = 'recent' | 'alphabetical' | 'subject'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Pre-computed decorative particle positions (no Math.random in render)
const decorativeParticles = [
  { top: '10%', left: '20%', size: 4, color: '#00f0ff', delay: 0 },
  { top: '25%', left: '80%', size: 3, color: '#a855f7', delay: 0.5 },
  { top: '70%', left: '15%', size: 5, color: '#ec4899', delay: 1 },
  { top: '80%', left: '75%', size: 3, color: '#22c55e', delay: 1.5 },
  { top: '50%', left: '50%', size: 4, color: '#00f0ff', delay: 0.8 },
  { top: '15%', left: '60%', size: 3, color: '#a855f7', delay: 1.2 },
  { top: '65%', left: '35%', size: 4, color: '#ec4899', delay: 0.3 },
  { top: '40%', left: '90%', size: 3, color: '#00f0ff', delay: 2 },
]

function EmptyBookmarksState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20"
    >
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-4 rounded-full border border-dashed border-white/5"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center icon */}
        <motion.div
          className="absolute inset-7 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center orbital-enhanced"
          style={{ boxShadow: '0 0 30px rgba(251,191,36,0.08)' }}
        >
          <Bookmark className="w-12 h-12 text-amber-400/50" />
        </motion.div>
        {/* Floating decorative particles */}
        {decorativeParticles.slice(0, 4).map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: 0.4,
            }}
            animate={{ y: [0, -8, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}
      </div>

      <motion.h3
        className="text-xl font-semibold text-gray-300 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        No saved notes yet
      </motion.h3>
      <motion.p
        className="text-sm text-gray-500 mb-6 max-w-sm mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Bookmark your important notes to quickly find them here later.
        Start by creating notes and saving the ones you want to revisit.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={() => useStore.getState().setCurrentPage('notes')}
          className="btn-neon-solid gap-2 px-5 py-2.5 btn-shimmer-hover"
        >
          <Sparkles className="w-4 h-4" />
          Go to Notes
        </Button>
      </motion.div>
    </motion.div>
  )
}

function BookmarksSkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-0 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-56 mb-2 bg-white/5" />
          <Skeleton className="h-4 w-36 bg-white/5" />
        </div>
        <Skeleton className="h-12 rounded-xl bg-white/5 mb-6" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BookmarksPage() {
  const { setCurrentPage } = useStore()
  const [notes, setNotes] = useState<NoteData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSubject, setActiveSubject] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null)

  const fetchNotes = useCallback(async () => {
    try {
      const res = await authFetch('/api/notes?bookmark=true')
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
      }
    } catch {
      // fallback empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Extract unique subjects from bookmarked notes
  const subjectList = useMemo(() => {
    const subjects = Array.from(new Set(notes.map(n => n.subject)))
    return subjects.sort()
  }, [notes])

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => {
      const matchesSearch =
        searchQuery === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())

      if (activeSubject !== 'all') {
        return matchesSearch && note.subject === activeSubject
      }
      return matchesSearch
    })

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'subject':
        result.sort((a, b) => {
          const subjectCompare = a.subject.localeCompare(b.subject)
          return subjectCompare !== 0 ? subjectCompare : a.title.localeCompare(b.title)
        })
        break
    }

    return result
  }, [notes, searchQuery, activeSubject, sortBy])

  const toggleBookmark = async (note: NoteData) => {
    try {
      const res = await authFetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== note.id))
        if (selectedNote?.id === note.id) {
          setSelectedNote(null)
        }
        toast.success('Bookmark removed')
      }
    } catch {
      // silent fail
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getNoteTypeBadge = (type: string) => {
    switch (type) {
      case 'short':
        return (
          <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">
            Short
          </Badge>
        )
      case 'long':
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">
            Long
          </Badge>
        )
      case 'bullet':
        return (
          <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs">
            Bullet
          </Badge>
        )
      default:
        return (
          <Badge className="bg-white/5 text-gray-400 border border-white/10 text-xs">{type}</Badge>
        )
    }
  }

  if (loading) return <BookmarksSkeleton />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen lg:pl-[260px] p-4 md:p-6 lg:p-8 pt-14 lg:pt-0 pb-24 lg:pb-8 max-w-7xl mx-auto"
    >
      {/* Animated background orbs */}
      <motion.div
        className="fixed top-20 left-[15%] w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)',
        }}
        animate={{ y: [0, 25, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-32 right-[10%] w-60 h-60 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,240,255,0.04) 0%, transparent 70%)',
        }}
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-animated">
                Saved Notes
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {notes.length} bookmarked note{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-xl p-3 mb-4">
        <div className="relative search-input-animated">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search bookmarked notes by title, topic, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-cyan-500/50 text-white placeholder:text-gray-500 input-lift rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveSubject('all')}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              activeSubject === 'all'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {subjectList.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                activeSubject === subject
                  ? 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50 filter-neon cursor-pointer"
          >
            <option value="recent">Recent</option>
            <option value="alphabetical">A-Z</option>
            <option value="subject">By Subject</option>
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyBookmarksState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4 card-glow cursor-pointer group relative overflow-hidden note-card-hover"
                onClick={() => setSelectedNote(note)}
              >
                {/* Decorative gradient line at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-cyan-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate text-sm md:text-base">
                      {note.title}
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(note)
                    }}
                    className="ml-2 p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                    aria-label="Remove bookmark"
                  >
                    <BookmarkCheck className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </motion.button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    className={`${
                      SUBJECT_COLORS[note.subject] ||
                      'bg-white/5 text-gray-400 border border-white/10'
                    } text-xs`}
                  >
                    {note.subject}
                  </Badge>
                  {getNoteTypeBadge(note.noteType)}
                </div>

                <p className="text-xs text-gray-500 mb-2">{note.topic}</p>
                <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                  {note.content.substring(0, 150)}
                  {note.content.length > 150 ? '...' : ''}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(note.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400/60">
                    <Bookmark className="w-3 h-3" />
                    Saved
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className={`${
                      SUBJECT_COLORS[selectedNote.subject] ||
                      'bg-white/5 text-gray-400'
                    }`}
                  >
                    {selectedNote.subject}
                  </Badge>
                  {getNoteTypeBadge(selectedNote.noteType)}
                  <Badge
                    variant="outline"
                    className="border-white/10 text-gray-400 text-xs"
                  >
                    {selectedNote.topic}
                  </Badge>
                </div>
                <DialogTitle className="text-xl text-white">
                  {selectedNote.title}
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Created on {formatDate(selectedNote.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="markdown-content text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNote.content}
                </div>
              </div>

              <DialogFooter className="flex gap-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => toggleBookmark(selectedNote)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Remove Bookmark
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedNote(null)
                    setCurrentPage('notes')
                  }}
                  className="text-gray-400 hover:text-cyan-400"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View in Notes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
