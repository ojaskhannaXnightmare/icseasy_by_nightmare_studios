'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Star, Trash2, Bookmark, BookmarkCheck,
  FileText, BookOpen, Filter, X, ChevronRight, Clock
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

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes')
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
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
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBookmarked: !note.isBookmarked })
      })
      if (res.ok) {
        setNotes(prev => prev.map(n =>
          n.id === note.id ? { ...n, isBookmarked: !n.isBookmarked } : n
        ))
        if (selectedNote?.id === note.id) {
          setSelectedNote(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null)
        }
      }
    } catch {
      // silent fail
    }
  }

  const deleteNote = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/notes/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== deleteId))
        if (selectedNote?.id === deleteId) setSelectedNote(null)
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
      className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
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
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">My Notes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{notes.length} notes total</p>
          </div>
        </div>
        <Button
          onClick={() => setShowGenerateDialog(true)}
          className="btn-neon-solid gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Generate Note
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass rounded-xl p-3 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search notes by title, topic, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 focus:border-cyan-500/50 text-white placeholder:text-gray-500"
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass bg-transparent p-1 h-auto flex-wrap gap-1 mb-6">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-lg text-gray-400 mb-2">No notes found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {searchQuery ? 'Try a different search term' : 'Generate your first AI-powered note'}
              </p>
              <Button onClick={() => setShowGenerateDialog(true)} className="btn-neon gap-2">
                <Plus className="w-4 h-4" /> Generate Note
              </Button>
            </motion.div>
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
                    className="glass rounded-xl p-4 card-glow cursor-pointer group relative overflow-hidden"
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
                      <button
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
                      </button>
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
                        {formatDate(note.createdAt)}
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
        <DialogContent className="glass-strong max-w-2xl max-h-[85vh] overflow-y-auto border border-white/10">
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
                  <AlertDialogContent className="glass-strong border-red-500/20">
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
