'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Star, Trash2, Bookmark, BookmarkCheck,
  FileText, BookOpen, Filter, X, ChevronRight, Clock,
  Sparkles, PenLine, NotebookPen, Download, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore, type NoteData } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'
import { GenerateNoteDialog } from './GenerateNoteDialog'

const SUBJECTS = [
  'English', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Computer Science'
]

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
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function EmptyNotesState({ searchQuery, onGenerate }: { searchQuery: string; onGenerate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20"
    >
      {/* Animated illustration */}
      <div className="relative w-28 h-28 mx-auto mb-6">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-3 rounded-full border border-dashed border-white/5"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center icon container */}
        <motion.div
          className="absolute inset-6 rounded-2xl bg-gradient-to-br from-[#00f0ff]/10 to-[#a855f7]/10 flex items-center justify-center floating orbital-enhanced"
          style={{ boxShadow: '0 0 30px rgba(0,240,255,0.08)' }}
        >
          <NotebookPen className="w-10 h-10 text-[#00f0ff]/60" />
        </motion.div>
        {/* Floating decorative dots */}
        <motion.div
          className="absolute top-1 right-8 w-2 h-2 rounded-full bg-[#a855f7]/40"
          animate={{ y: [0, -6, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-[#ec4899]/40"
          animate={{ y: [0, -4, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div
          className="absolute top-6 left-1 w-2.5 h-2.5 rounded-full bg-[#00f0ff]/30"
          animate={{ y: [0, -5, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      <motion.h3
        className="text-xl font-semibold text-gray-300 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {searchQuery ? 'No matches found' : 'No notes yet'}
      </motion.h3>
      <motion.p
        className="text-sm text-gray-500 mb-6 max-w-sm mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {searchQuery
          ? `No notes matching "${searchQuery}". Try a different search term.`
          : 'Start your learning journey by generating your first AI-powered note.'}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={onGenerate} className="btn-neon-solid gap-2 px-5 py-2.5">
          <Sparkles className="w-4 h-4" />
          Generate Your First Note
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default function NotesPage() {
  const { setCurrentPage } = useStore()
  const [notes, setNotes] = useState<NoteData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await authFetch('/api/notes/export?format=markdown')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `icseasy-notes-${new Date().toISOString().slice(0, 10)}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Notes exported successfully')
      } else {
        toast.error('Failed to export notes')
      }
    } catch {
      toast.error('Export failed')
    }
    setExporting(false)
  }

  const fetchNotes = useCallback(async () => {
    try {
      const res = await authFetch('/api/notes')
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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'bookmarked') return matchesSearch && note.isBookmarked
    if (activeTab.startsWith('subject:')) {
      const subject = activeTab.replace('subject:', '')
      return matchesSearch && note.subject === subject
    }
    return matchesSearch
  })

  const toggleBookmark = async (note: NoteData) => {
    try {
      const res = await authFetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isBookmarked: !note.isBookmarked })
      })
      if (res.ok) {
        setNotes(prev => prev.map(n =>
          n.id === note.id ? { ...n, isBookmarked: !n.isBookmarked } : n
        ))
        if (selectedNote?.id === note.id) {
          setSelectedNote(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null)
        }
        toast.success(!note.isBookmarked ? 'Bookmark added' : 'Bookmark removed')
      }
    } catch {
      // silent fail
    }
  }

  const deleteNote = async () => {
    if (!deleteId) return
    try {
      const res = await authFetch(`/api/notes/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== deleteId))
        if (selectedNote?.id === deleteId) setSelectedNote(null)
        toast.success('Note deleted')
      }
    } catch {
      // silent fail
    }
    setDeleteId(null)
    setShowDeleteDialog(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const getNoteTypeBadge = (type: string) => {
    switch (type) {
      case 'short': return <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">Short</Badge>
      case 'long': return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">Long</Badge>
      case 'bullet': return <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs">Bullet</Badge>
      default: return <Badge className="bg-white/5 text-gray-400 border border-white/10 text-xs">{type}</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen lg:pl-[260px] p-4 md:p-6 lg:p-8 pt-14 lg:pt-0 pb-24 lg:pb-8 max-w-7xl mx-auto"
    >
      {/* Animated orbs */}
      <motion.div
        className="fixed top-24 left-[15%] w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
        animate={{ y: [0, 25, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-32 right-[10%] w-60 h-60 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%)' }}
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient-animated">My Notes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{notes.length} notes total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={notes.length === 0 || exporting}
            variant="outline"
            className="btn-neon gap-2 px-4 py-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export
          </Button>
          <Button
            onClick={() => setShowGenerateDialog(true)}
            className="btn-neon-solid gap-2 px-4 py-2 btn-shimmer-hover"
          >
            <Plus className="w-4 h-4" />
            Generate Note
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card rounded-xl p-3 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search notes by title, topic, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 focus:border-cyan-500/50 text-white placeholder:text-gray-500 input-lift"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs — with animated underline indicator */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass bg-transparent p-1 h-auto flex-wrap gap-1 mb-6 tab-animated">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 rounded-lg px-4 py-2 text-gray-400 border border-transparent transition-all text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            All Notes
          </TabsTrigger>
          <TabsTrigger
            value="bookmarked"
            className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30 rounded-lg px-4 py-2 text-gray-400 border border-transparent transition-all text-sm"
          >
            <Star className="w-4 h-4 mr-2" />
            Bookmarked
          </TabsTrigger>
          {SUBJECTS.map(subject => (
            <TabsTrigger
              key={subject}
              value={`subject:${subject}`}
              className="data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30 rounded-lg px-4 py-2 text-gray-400 border border-transparent transition-all text-sm hidden lg:inline-flex"
            >
              {subject}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyNotesState
              searchQuery={searchQuery}
              onGenerate={() => setShowGenerateDialog(true)}
            />
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
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />

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
                      >
                        {note.isBookmarked ? (
                          <BookmarkCheck className="w-5 h-5 text-amber-400 fill-amber-400" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
                        )}
                      </motion.button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={`${SUBJECT_COLORS[note.subject] || 'bg-white/5 text-gray-400 border border-white/10'} text-xs`}>
                        {note.subject}
                      </Badge>
                      {getNoteTypeBadge(note.noteType)}
                    </div>

                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {note.content.substring(0, 120)}...
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(note.updatedAt || note.createdAt)}
                      </span>
                      <span>{note.topic}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${SUBJECT_COLORS[selectedNote.subject] || 'bg-white/5 text-gray-400'}`}>
                    {selectedNote.subject}
                  </Badge>
                  {getNoteTypeBadge(selectedNote.noteType)}
                  <Badge variant="outline" className="border-white/10 text-gray-400 text-xs">
                    {selectedNote.topic}
                  </Badge>
                </div>
                <DialogTitle className="text-xl text-white">{selectedNote.title}</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Created on {formatDate(selectedNote.createdAt)}
                  {selectedNote.updatedAt && selectedNote.updatedAt !== selectedNote.createdAt && (
                    <span> &bull; Edited {formatRelativeTime(selectedNote.updatedAt)}</span>
                  )}
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
                  className="text-gray-400 hover:text-amber-400"
                >
                  {selectedNote.isBookmarked ? (
                    <><BookmarkCheck className="w-4 h-4 mr-2 text-amber-400" /> Bookmarked</>
                  ) : (
                    <><Bookmark className="w-4 h-4 mr-2" /> Bookmark</>
                  )}
                </Button>
                <AlertDialog open={showDeleteDialog && deleteId === selectedNote.id} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-red-400"
                      onClick={() => { setDeleteId(selectedNote.id); setShowDeleteDialog(true) }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-red-500/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Note</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to delete &quot;{selectedNote.title}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-gray-400">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteNote} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Note Dialog */}
      <GenerateNoteDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onNoteCreated={fetchNotes}
      />
    </motion.div>
  )
}
