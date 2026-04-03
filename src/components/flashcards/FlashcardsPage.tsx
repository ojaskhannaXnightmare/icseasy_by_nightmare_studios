'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Layers,
  Atom,
  FlaskConical,
  Calculator,
  Leaf,
  BookOpen,
  Landmark,
  Globe,
  Code2,
  Keyboard,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Flashcard {
  question: string
  answer: string
}

interface CustomFlashcard {
  id: string
  frontText: string
  backText: string
  subject: string
  topic: string
  tags: string
  createdAt: string
}

type SubjectKey = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'English' | 'History' | 'Geography' | 'Computer Science'

interface SubjectInfo {
  key: SubjectKey
  icon: React.ElementType
  color: string
  cards: Flashcard[]
}

const ICSE_SUBJECTS: SubjectKey[] = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'History', 'Geography', 'Computer Science']

const SUBJECT_COLORS: Record<string, string> = {
  'Physics': '#a855f7',
  'Chemistry': '#22c55e',
  'Mathematics': '#00f0ff',
  'Biology': '#10b981',
  'English': '#ec4899',
  'History': '#f59e0b',
  'Geography': '#06b6d4',
  'Computer Science': '#8b5cf6',
}

const subjects: SubjectInfo[] = [
  {
    key: 'Physics',
    icon: Atom,
    color: '#a855f7',
    cards: [
      { question: "What is Newton's First Law?", answer: 'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force' },
      { question: 'What is the SI unit of force?', answer: 'Newton (N)' },
      { question: 'What is acceleration due to gravity?', answer: '9.8 m/s²' },
    ],
  },
  {
    key: 'Chemistry',
    icon: FlaskConical,
    color: '#22c55e',
    cards: [
      { question: 'What is the chemical formula for water?', answer: 'H₂O' },
      { question: 'What is the pH of pure water?', answer: '7 (neutral)' },
      { question: 'What is an isotope?', answer: 'Atoms of the same element with different numbers of neutrons' },
    ],
  },
  {
    key: 'Mathematics',
    icon: Calculator,
    color: '#00f0ff',
    cards: [
      { question: 'What is the quadratic formula?', answer: 'x = (-b ± √(b²-4ac)) / 2a' },
      { question: 'What is the Pythagorean theorem?', answer: 'a² + b² = c²' },
      { question: 'What is π (pi) approximately?', answer: '3.14159...' },
    ],
  },
  {
    key: 'Biology',
    icon: Leaf,
    color: '#10b981',
    cards: [
      { question: 'What is the powerhouse of the cell?', answer: 'Mitochondria' },
      { question: 'What is photosynthesis?', answer: 'The process by which plants convert sunlight into glucose and oxygen' },
      { question: 'What is DNA?', answer: 'Deoxyribonucleic acid - carries genetic information' },
    ],
  },
  {
    key: 'English',
    icon: BookOpen,
    color: '#ec4899',
    cards: [
      { question: 'What is a simile?', answer: "A figure of speech comparing two things using 'like' or 'as'" },
      { question: 'What is a metaphor?', answer: 'A figure of speech directly comparing two unrelated things' },
      { question: 'What is alliteration?', answer: 'Repetition of initial consonant sounds in nearby words' },
    ],
  },
  {
    key: 'History',
    icon: Landmark,
    color: '#f59e0b',
    cards: [
      { question: 'When did World War II end?', answer: '1945' },
      { question: 'Who led the Indian independence movement?', answer: 'Mahatma Gandhi' },
      { question: 'When did the French Revolution begin?', answer: '1789' },
    ],
  },
  {
    key: 'Geography',
    icon: Globe,
    color: '#06b6d4',
    cards: [
      { question: 'What is the largest ocean?', answer: 'Pacific Ocean' },
      { question: 'What is the longest river?', answer: 'River Nile' },
      { question: 'What are tectonic plates?', answer: 'Large segments of Earth\'s lithosphere that move, float, and sometimes fracture' },
    ],
  },
  {
    key: 'Computer Science',
    icon: Code2,
    color: '#8b5cf6',
    cards: [
      { question: 'What is an algorithm?', answer: 'A step-by-step procedure for solving a problem' },
      { question: 'What is a variable?', answer: 'A named storage location that holds a value' },
      { question: 'What is HTML?', answer: 'HyperText Markup Language - used to create web pages' },
    ],
  },
]

type TabMode = 'subjects' | 'my-cards'

interface MergedCard {
  question: string
  answer: string
  isCustom: boolean
  customId?: string
}

export default function FlashcardsPage() {
  const { setCurrentPage } = useStore()
  const [tabMode, setTabMode] = useState<TabMode>('subjects')
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Custom cards state
  const [customCards, setCustomCards] = useState<CustomFlashcard[]>([])
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [myCardsSubjectFilter, setMyCardsSubjectFilter] = useState<string>('all')

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    frontText: '',
    backText: '',
    subject: '' as string,
    topic: '',
  })
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)

  // Fetch custom flashcards
  const fetchCustomCards = useCallback(async () => {
    setLoadingCustom(true)
    try {
      const res = await authFetch('/api/flashcards')
      if (res.ok) {
        const data = await res.json()
        setCustomCards(data.flashcards || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingCustom(false)
    }
  }, [])

  useEffect(() => {
    if (tabMode === 'my-cards') {
      fetchCustomCards()
    }
  }, [tabMode, fetchCustomCards])

  // Merged card logic for subject mode
  const currentSubject = subjects[selectedSubjectIndex]

  const customCardsForSubject = customCards.filter(
    c => c.subject === currentSubject.key
  )

  const mergedCards: MergedCard[] = tabMode === 'subjects'
    ? [
        ...currentSubject.cards.map(c => ({ ...c, isCustom: false })),
        ...customCardsForSubject.map(c => ({
            question: c.frontText,
            answer: c.backText,
            isCustom: true,
            customId: c.id,
          })),
      ]
    : []

  // My cards mode cards
  const filteredMyCards = myCardsSubjectFilter === 'all'
    ? customCards
    : customCards.filter(c => c.subject === myCardsSubjectFilter)

  const myCardsMerged: MergedCard[] = filteredMyCards.map(c => ({
    question: c.frontText,
    answer: c.backText,
    isCustom: true,
    customId: c.id,
  }))

  const activeCards = tabMode === 'subjects' ? mergedCards : myCardsMerged
  const currentCard = activeCards[cardIndex]
  const totalCards = activeCards.length
  const activeColor = tabMode === 'subjects'
    ? currentSubject.color
    : (currentCard ? (SUBJECT_COLORS[customCards.find(c => c.id === currentCard.customId)?.subject || 'Physics']) : '#00f0ff')

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  const nextCard = useCallback(() => {
    if (totalCards === 0) return
    setIsFlipped(false)
    setCardIndex(prev => (prev + 1) % totalCards)
  }, [totalCards])

  const prevCard = useCallback(() => {
    if (totalCards === 0) return
    setIsFlipped(false)
    setCardIndex(prev => (prev - 1 + totalCards) % totalCards)
  }, [totalCards])

  const resetCards = useCallback(() => {
    setIsFlipped(false)
    setCardIndex(0)
  }, [])

  // Switch tab or subject
  const switchToSubject = (index: number) => {
    setTabMode('subjects')
    setSelectedSubjectIndex(index)
    setCardIndex(0)
    setIsFlipped(false)
  }

  const switchToMyCards = () => {
    setTabMode('my-cards')
    setCardIndex(0)
    setIsFlipped(false)
  }

  // Create flashcard
  const handleCreate = async () => {
    if (!createForm.frontText.trim() || !createForm.backText.trim() || !createForm.subject) {
      toast.error('Please fill in all required fields')
      return
    }
    setCreating(true)
    try {
      const res = await authFetch('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        toast.success('Flashcard created!')
        setCreateForm({ frontText: '', backText: '', subject: '', topic: '' })
        setShowCreateDialog(false)
        fetchCustomCards()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create flashcard')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setCreating(false)
    }
  }

  // Delete flashcard
  const handleDelete = async () => {
    if (!deleteCardId) return
    try {
      const res = await authFetch(`/api/flashcards?id=${deleteCardId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Flashcard deleted')
        setCustomCards(prev => prev.filter(c => c.id !== deleteCardId))
        if (totalCards <= 1) {
          setCardIndex(0)
        } else if (cardIndex >= totalCards - 1) {
          setCardIndex(prev => prev - 1)
        }
      } else {
        toast.error('Failed to delete flashcard')
      }
    } catch {
      toast.error('Network error')
    }
    setDeleteCardId(null)
    setShowDeleteDialog(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        flipCard()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        nextCard()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        prevCard()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipCard, nextCard, prevCard])

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-[#8b5cf6]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/3 left-1/4 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
                <Layers className="w-7 h-7" />
                Flashcards
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Study with interactive flashcards</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="btn-neon-solid gap-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </motion.div>

        {/* Tab Selector: Subjects | My Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-4"
        >
          <button
            onClick={() => switchToSubject(selectedSubjectIndex)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border',
              tabMode === 'subjects'
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg'
                : 'border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-4 h-4" />
            Subjects
          </button>
          <button
            onClick={switchToMyCards}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border',
              tabMode === 'my-cards'
                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-lg'
                : 'border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="w-4 h-4" />
            My Cards
            {customCards.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-semibold">
                {customCards.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Subject Selector (visible in subjects mode) */}
        <AnimatePresence mode="wait">
          {tabMode === 'subjects' && (
            <motion.div
              key="subject-tabs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap gap-2 mb-8"
            >
              {subjects.map((subject, index) => {
                const Icon = subject.icon
                const isActive = index === selectedSubjectIndex
                return (
                  <button
                    key={subject.key}
                    onClick={() => switchToSubject(index)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border',
                      isActive
                        ? 'border-[#00f0ff]/20 shadow-lg'
                        : 'border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                    )}
                    style={isActive ? {
                      backgroundColor: `${subject.color}15`,
                      borderColor: `${subject.color}30`,
                      color: subject.color,
                      boxShadow: `0 0 15px ${subject.color}10`,
                    } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{subject.key}</span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Cards Subject Filter (visible in my-cards mode) */}
        <AnimatePresence mode="wait">
          {tabMode === 'my-cards' && (
            <motion.div
              key="my-cards-filter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap gap-2 mb-8"
            >
              <button
                onClick={() => { setMyCardsSubjectFilter('all'); resetCards() }}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border',
                  myCardsSubjectFilter === 'all'
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                    : 'border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                )}
              >
                All Subjects
              </button>
              {ICSE_SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => { setMyCardsSubjectFilter(s); resetCards() }}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border',
                    myCardsSubjectFilter === s
                      ? 'shadow-lg'
                      : 'border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                  )}
                  style={myCardsSubjectFilter === s ? {
                    backgroundColor: `${SUBJECT_COLORS[s]}15`,
                    borderColor: `${SUBJECT_COLORS[s]}30`,
                    color: SUBJECT_COLORS[s],
                    boxShadow: `0 0 15px ${SUBJECT_COLORS[s]}10`,
                  } : undefined}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress / Card Info */}
        {totalCards > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center border"
                style={{ backgroundColor: `${activeColor}15`, borderColor: `${activeColor}25` }}
              >
                {tabMode === 'subjects' ? (
                  (() => {
                    const Icon = currentSubject.icon
                    return <Icon className="w-4 h-4" style={{ color: activeColor }} />
                  })()
                ) : (
                  <User className="w-4 h-4" style={{ color: activeColor }} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {tabMode === 'subjects' ? currentSubject.key : 'My Custom Cards'}
                  {myCardsSubjectFilter !== 'all' && tabMode === 'my-cards' && ` — ${myCardsSubjectFilter}`}
                </p>
                <p className="text-[11px] text-muted-foreground">Card {cardIndex + 1} of {totalCards}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentCard?.isCustom && (
                <button
                  onClick={() => {
                    setDeleteCardId(currentCard.customId || null)
                    setShowDeleteDialog(true)
                  }}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                  title="Delete custom card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={resetCards}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {totalCards === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg text-gray-400 mb-2">
              {tabMode === 'my-cards' ? 'No custom cards yet' : 'No cards for this subject'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {tabMode === 'my-cards'
                ? 'Create your first flashcard to get started'
                : 'Custom cards you create will appear here'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="btn-neon gap-2">
              <Plus className="w-4 h-4" /> Create Flashcard
            </Button>
          </motion.div>
        )}

        {/* Card dots indicator */}
        {totalCards > 0 && (
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {activeCards.map((c, i) => (
              <button
                key={`${tabMode}-${i}`}
                onClick={() => {
                  setCardIndex(i)
                  setIsFlipped(false)
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i === cardIndex
                    ? 'w-6'
                    : 'hover:bg-white/20'
                )}
                style={{
                  backgroundColor: i === cardIndex ? activeColor : (c.isCustom ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.15)'),
                  boxShadow: i === cardIndex ? `0 0 8px ${activeColor}40` : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* Flashcard */}
        {totalCards > 0 && (
          <div className="mb-8">
            <div
              className="relative w-full cursor-pointer"
              style={{ perspective: '1200px' }}
              onClick={flipCard}
            >
              <motion.div
                className="w-full min-h-[280px] sm:min-h-[320px]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center glass card-glow border overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    borderColor: `${activeColor}20`,
                    boxShadow: `0 0 30px ${activeColor}08, inset 0 1px 0 ${activeColor}10`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{
                      background: `linear-gradient(90deg, ${activeColor}, transparent)`,
                    }}
                  />
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: activeColor }}
                  />

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Question
                    </span>
                    {currentCard?.isCustom && (
                      <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[9px] px-1.5 py-0">
                        custom
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl font-semibold leading-relaxed relative z-10">
                    {currentCard?.question}
                  </p>
                  <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
                    <Keyboard className="w-3 h-3" />
                    Click or press Space to flip
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center glass card-glow border overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderColor: `${activeColor}25`,
                    boxShadow: `0 0 40px ${activeColor}12, inset 0 1px 0 ${activeColor}15`,
                  }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${activeColor})`,
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[80px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: activeColor }}
                  />

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: activeColor }}>
                      Answer
                    </span>
                    {currentCard?.isCustom && (
                      <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[9px] px-1.5 py-0">
                        custom
                      </Badge>
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-medium leading-relaxed relative z-10" style={{ color: activeColor }}>
                    {currentCard?.answer}
                  </p>
                  <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
                    <Keyboard className="w-3 h-3" />
                    Click or press Space to flip back
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {totalCards > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={prevCard}
              className="rounded-xl glass neon-border border-white/10 hover:bg-white/5 h-11 w-11"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </Button>

            <Button
              onClick={flipCard}
              className={cn(
                'rounded-xl px-6 h-11 font-medium text-sm border transition-all duration-300',
              )}
              style={{
                backgroundColor: `${activeColor}15`,
                borderColor: `${activeColor}30`,
                color: activeColor,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isFlipped ? 'answer' : 'question'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {isFlipped ? 'Show Question' : 'Show Answer'}
                </motion.span>
              </AnimatePresence>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={nextCard}
              className="rounded-xl glass neon-border border-white/10 hover:bg-white/5 h-11 w-11"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>
          </motion.div>
        )}

        {/* Keyboard hints */}
        {totalCards > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">Space</kbd>
              Flip
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">←</kbd>
              Previous
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">→</kbd>
              Next
            </span>
          </motion.div>
        )}
      </div>

      {/* Create Flashcard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-strong max-w-md border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Create Flashcard
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Add your own custom flashcard to study from
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Subject *</Label>
              <Select
                value={createForm.subject}
                onValueChange={(val) => setCreateForm(prev => ({ ...prev, subject: val }))}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {ICSE_SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>
                      <span style={{ color: SUBJECT_COLORS[s] }}>{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Front (Question/Term) *</Label>
              <Textarea
                value={createForm.frontText}
                onChange={(e) => setCreateForm(prev => ({ ...prev, frontText: e.target.value }))}
                placeholder="Enter the question or term..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Back (Answer/Definition) *</Label>
              <Textarea
                value={createForm.backText}
                onChange={(e) => setCreateForm(prev => ({ ...prev, backText: e.target.value }))}
                placeholder="Enter the answer or definition..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Topic (optional)</Label>
              <Input
                value={createForm.topic}
                onChange={(e) => setCreateForm(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Newton's Laws, Organic Chemistry..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="btn-neon-solid gap-2"
            >
              {creating ? 'Saving...' : 'Save Flashcard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-strong max-w-sm border border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Delete Flashcard
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this custom flashcard? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
