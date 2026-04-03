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
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Flashcard {
  question: string
  answer: string
}

type SubjectKey = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'English' | 'History' | 'Geography' | 'Computer Science'

interface SubjectInfo {
  key: SubjectKey
  icon: React.ElementType
  color: string
  cards: Flashcard[]
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

export default function FlashcardsPage() {
  const { setCurrentPage } = useStore()
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentSubject = subjects[selectedSubjectIndex]
  const currentCard = currentSubject.cards[cardIndex]
  const totalCards = currentSubject.cards.length

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  const nextCard = useCallback(() => {
    setIsFlipped(false)
    setCardIndex(prev => (prev + 1) % totalCards)
  }, [totalCards])

  const prevCard = useCallback(() => {
    setIsFlipped(false)
    setCardIndex(prev => (prev - 1 + totalCards) % totalCards)
  }, [totalCards])

  const resetCards = useCallback(() => {
    setIsFlipped(false)
    setCardIndex(0)
  }, [])

  // Keyboard shortcut: Space to flip
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
          className="flex items-center gap-3 mb-8"
        >
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
        </motion.div>

        {/* Subject Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {subjects.map((subject, index) => {
            const Icon = subject.icon
            const isActive = index === selectedSubjectIndex
            return (
              <button
                key={subject.key}
                onClick={() => {
                  setSelectedSubjectIndex(index)
                  setCardIndex(0)
                  setIsFlipped(false)
                }}
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

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ backgroundColor: `${currentSubject.color}15`, borderColor: `${currentSubject.color}25` }}
            >
              {(() => {
                const Icon = currentSubject.icon
                return <Icon className="w-4 h-4" style={{ color: currentSubject.color }} />
              })()}
            </div>
            <div>
              <p className="text-sm font-semibold">{currentSubject.key}</p>
              <p className="text-[11px] text-muted-foreground">Card {cardIndex + 1} of {totalCards}</p>
            </div>
          </div>
          <button
            onClick={resetCards}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Card dots indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {currentSubject.cards.map((_, i) => (
            <button
              key={i}
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
                backgroundColor: i === cardIndex ? currentSubject.color : 'rgba(255,255,255,0.15)',
                boxShadow: i === cardIndex ? `0 0 8px ${currentSubject.color}40` : 'none',
              }}
            />
          ))}
        </div>

        {/* Flashcard */}
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
                  borderColor: `${currentSubject.color}20`,
                  boxShadow: `0 0 30px ${currentSubject.color}08, inset 0 1px 0 ${currentSubject.color}10`,
                }}
              >
                {/* Decorative gradient */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{
                    background: `linear-gradient(90deg, ${currentSubject.color}, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-20 pointer-events-none"
                  style={{ backgroundColor: currentSubject.color }}
                />

                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 font-medium">
                  Question
                </span>
                <p className="text-lg sm:text-xl font-semibold leading-relaxed relative z-10">
                  {currentCard.question}
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
                  borderColor: `${currentSubject.color}25`,
                  boxShadow: `0 0 40px ${currentSubject.color}12, inset 0 1px 0 ${currentSubject.color}15`,
                }}
              >
                {/* Decorative gradient */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${currentSubject.color})`,
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[80px] opacity-20 pointer-events-none"
                  style={{ backgroundColor: currentSubject.color }}
                />

                <span className="text-[10px] uppercase tracking-widest mb-4 font-medium" style={{ color: currentSubject.color }}>
                  Answer
                </span>
                <p className="text-base sm:text-lg font-medium leading-relaxed relative z-10" style={{ color: currentSubject.color }}>
                  {currentCard.answer}
                </p>
                <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
                  <Keyboard className="w-3 h-3" />
                  Click or press Space to flip back
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
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
              backgroundColor: `${currentSubject.color}15`,
              borderColor: `${currentSubject.color}30`,
              color: currentSubject.color,
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

        {/* Keyboard hints */}
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
      </div>
    </div>
  )
}
