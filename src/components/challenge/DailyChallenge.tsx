'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  RefreshCw,
  Trophy,
  Calendar,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'

// --- Types ---
interface ChallengeQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface ChallengeData {
  questions: ChallengeQuestion[]
  subject: string
  topic: string
}

interface CompletedDate {
  date: string
  score: number
  total: number
}

// --- Skeleton ---
function ChallengeSkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto relative z-10">
        <Skeleton className="h-4 w-16 mb-3 bg-white/5" />
        <Skeleton className="h-8 w-48 mb-2 bg-white/5" />
        <Skeleton className="h-4 w-72 bg-white/5" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-64 rounded-xl bg-white/5" />
          <Skeleton className="h-32 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}

// --- Calendar Component ---
function StreakCalendar({ completedDates, currentStreak }: { completedDates: CompletedDate[]; currentStreak: number }) {
  // Pre-compute the last 30 days
  const today = new Date()
  const days: { date: string; dayNum: number; dayLabel: string }[] = []
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      dayLabel: dayNames[d.getDay()],
    })
  }

  const completedMap = new Map(completedDates.map((c) => [c.date, c]))

  return (
    <div className="glass rounded-xl p-4 card-glow">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-[#a855f7]" />
        <span className="text-sm font-semibold">Last 30 Days</span>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {/* Header row */}
        {dayNames.map((name, idx) => (
          <div key={name + idx} className="text-center text-[9px] text-muted-foreground/50 font-medium pb-1">
            {name}
          </div>
        ))}
        {days.map((day) => {
          const completed = completedMap.get(day.date)
          const isToday = day.date === today.toISOString().split('T')[0]
          const hasPerfect = completed && completed.score === completed.total

          return (
            <div
              key={day.date}
              className={`relative w-full aspect-square rounded-md flex flex-col items-center justify-center transition-all duration-200 ${
                isToday
                  ? 'border border-[#00f0ff]/40'
                  : ''
              } ${
                completed
                  ? hasPerfect
                    ? 'bg-[#22c55e]/15 border border-[#22c55e]/20'
                    : 'bg-[#f59e0b]/15 border border-[#f59e0b]/20'
                  : 'bg-white/[0.02]'
              }`}
              title={`${day.date}: ${completed ? `${completed.score}/${completed.total}` : 'Not completed'}`}
            >
              <span className={`text-[10px] font-medium ${completed ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {day.dayNum}
              </span>
              {completed && (
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    hasPerfect ? 'bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-[#f59e0b]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Main Component ---
export default function DailyChallenge() {
  const { setCurrentPage } = useStore()
  const [challenge, setChallenge] = useState<ChallengeData | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [totalTimeLeft, setTotalTimeLeft] = useState(300)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'results'>('idle')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load streak and history from localStorage using lazy initialization
  const [persistedData] = useState(() => {
    if (typeof window === 'undefined') return { streak: 0, completedDates: [] as CompletedDate[] }
    try {
      const saved = localStorage.getItem('icseasy-daily-challenge')
      if (saved) {
        const data = JSON.parse(saved)
        return { streak: data.streak || 0, completedDates: data.completedDates || [] as CompletedDate[] }
      }
    } catch {
      // Ignore
    }
    return { streak: 0, completedDates: [] as CompletedDate[] }
  })

  const [streak, setStreak] = useState(persistedData.streak)
  const [completedDates, setCompletedDates] = useState<CompletedDate[]>(persistedData.completedDates)

  const saveProgress = useCallback((newStreak: number, newDates: CompletedDate[]) => {
    localStorage.setItem(
      'icseasy-daily-challenge',
      JSON.stringify({ streak: newStreak, completedDates: newDates })
    )
  }, [])

  // Timer for current question (60s)
  useEffect(() => {
    if (phase !== 'playing' || selectedAnswer !== null) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-advance when time runs out
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, selectedAnswer, currentQ])

  // Total timer (5 minutes)
  useEffect(() => {
    if (phase !== 'playing') return

    const interval = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          finishChallenge()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, finishChallenge])

  const handleTimeUp = () => {
    if (challenge && selectedAnswer === null) {
      setShowExplanation(true)
      setTimeout(() => nextQuestion(), 2000)
    }
  }

  const startChallenge = async () => {
    setGenerating(true)
    try {
      const res = await authFetch('/api/challenge/generate', { method: 'POST' })
      if (!res.ok) {
        return
      }
      const data = await res.json()
      setChallenge(data)
      setCurrentQ(0)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setScore(0)
      setTimeLeft(60)
      setTotalTimeLeft(300)
      setPhase('playing')
    } catch {
      // Silently handle
    }
    setGenerating(false)
  }

  const handleAnswer = (optionIdx: number) => {
    if (selectedAnswer !== null || !challenge) return
    setSelectedAnswer(optionIdx)
    setShowExplanation(true)

    if (optionIdx === challenge.questions[currentQ].correct) {
      setScore((prev) => prev + 1)
    }

    // Auto-advance after delay
    setTimeout(() => nextQuestion(), 2200)
  }

  const nextQuestion = () => {
    if (!challenge) return
    if (currentQ + 1 >= challenge.questions.length) {
      finishChallenge()
    } else {
      setCurrentQ((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setTimeLeft(60)
    }
  }

  const finishChallenge = useCallback(() => {
    if (!challenge) return
    setPhase('results')

    // Save to localStorage
    const today = new Date().toISOString().split('T')[0]
    const alreadyDone = completedDates.find((c) => c.date === today)

    let newDates = [...completedDates]
    let newStreak = streak

    if (!alreadyDone) {
      newDates.push({ date: today, score, total: challenge.questions.length })
      // Calculate streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const hadYesterday = completedDates.some((c) => c.date === yesterdayStr)

      if (hadYesterday) {
        newStreak += 1
      } else {
        newStreak = 1
      }
    }

    // Save attempt to DB
    authFetch('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        subject: challenge.subject,
        topic: challenge.topic,
        answers: challenge.questions.map((q, i) => ({
          selected: i === currentQ ? selectedAnswer : null,
          correct: q.correct,
        })),
        score,
        totalMarks: challenge.questions.length,
        isDailyChallenge: true,
      }),
    }).catch(() => {
      // Ignore save errors
    })

    setStreak(newStreak)
    setCompletedDates(newDates.slice(-30)) // Keep last 30
    saveProgress(newStreak, newDates.slice(-30))
  }, [challenge, currentQ, selectedAnswer, score, completedDates, streak, saveProgress])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (loading) return <ChallengeSkeleton />

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-[#ec4899]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        className="max-w-4xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#00f0ff] transition-colors mb-4 group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ec4899]/20 to-[#a855f7]/20 border border-[#ec4899]/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#ec4899]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Daily Challenge</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Test your knowledge with today&apos;s quick quiz
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 card-glow text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Flame className="w-5 h-5 text-[#f59e0b]" />
              <span className="text-sm font-semibold text-[#f59e0b]">{streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="glass rounded-xl p-4 card-glow text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Target className="w-5 h-5 text-[#00f0ff]" />
              <span className="text-sm font-semibold text-[#00f0ff]">{completedDates.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="glass rounded-xl p-4 card-glow text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Trophy className="w-5 h-5 text-[#a855f7]" />
              <span className="text-sm font-semibold text-[#a855f7]">
                {completedDates.length > 0
                  ? Math.round((completedDates.reduce((s, c) => s + c.score, 0) / completedDates.reduce((s, c) => s + c.total, 0)) * 100)
                  : 0}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div variants={itemVariants} className="mb-8">
          <StreakCalendar completedDates={completedDates} currentStreak={streak} />
        </motion.div>

        {/* Main Challenge Area */}
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-8 text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ec4899]/10 to-[#a855f7]/10 border border-[#ec4899]/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#ec4899]" />
                </div>
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00f0ff]/15 orbital-ring" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready for Today&apos;s Challenge?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                5 questions from a random ICSE subject. You have 60 seconds per question and 5 minutes total. Keep your streak alive!
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={startChallenge}
                disabled={generating}
                className={`btn-neon-solid px-8 py-3 rounded-xl flex items-center gap-2 text-sm mx-auto ${generating ? 'opacity-60' : ''}`}
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {generating ? 'Generating...' : 'Start Challenge'}
              </motion.button>
            </motion.div>
          )}

          {phase === 'playing' && challenge && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl overflow-hidden"
            >
              {/* Top bar */}
              <div className="gradient-header-bar p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Question {currentQ + 1}/{challenge.questions.length}
                  </span>
                  {challenge.subject && (
                    <span className="neon-badge text-[#00f0ff]" style={{ '--badge-glow': 'rgba(0,240,255,0.2)' } as React.CSSProperties}>
                      {challenge.subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-4 h-4 ${timeLeft <= 15 ? 'text-red-400 animate-pulse' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-mono font-bold ${timeLeft <= 15 ? 'text-red-400' : 'text-foreground'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-sm font-mono font-bold text-foreground">
                      {formatTime(totalTimeLeft)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00f0ff] to-[#a855f7]"
                  initial={{ width: `${(currentQ / challenge.questions.length) * 100}%` }}
                  animate={{ width: `${((currentQ + 1) / challenge.questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question */}
              <div className="p-5 sm:p-8">
                <motion.h2
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg sm:text-xl font-semibold mb-6"
                >
                  {challenge.questions[currentQ].question}
                </motion.h2>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {challenge.questions[currentQ].options.map((option, idx) => {
                    const isCorrect = idx === challenge.questions[currentQ].correct
                    const isSelected = idx === selectedAnswer

                    let borderColor = 'border-white/8'
                    let bgColor = ''
                    let textColor = 'text-foreground'

                    if (showExplanation) {
                      if (isCorrect) {
                        borderColor = 'border-[#22c55e]/40'
                        bgColor = 'bg-[#22c55e]/10'
                        textColor = 'text-[#22c55e]'
                      } else if (isSelected && !isCorrect) {
                        borderColor = 'border-[#ef4444]/40'
                        bgColor = 'bg-[#ef4444]/10'
                        textColor = 'text-[#ef4444]'
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!showExplanation ? { scale: 1.02 } : {}}
                        whileTap={!showExplanation ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(idx)}
                        disabled={showExplanation}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 ${borderColor} ${bgColor} ${textColor} ${
                          !showExplanation ? 'option-btn hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/5' : ''
                        } ${isSelected && !isCorrect ? 'option-btn-selected' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 text-xs font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm">{option}</span>
                          {showExplanation && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-[#22c55e] shrink-0 ml-auto" />
                          )}
                          {showExplanation && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-[#ef4444] shrink-0 ml-auto" />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="glass rounded-xl p-4 mt-4 border border-[#a855f7]/20"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {challenge.questions[currentQ].explanation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {phase === 'results' && challenge && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-6 sm:p-8 text-center"
            >
              {/* Score Ring */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-36 h-36 rounded-full border-4 border-white/5 flex items-center justify-center relative overflow-hidden">
                  {/* Background glow */}
                  <div
                    className="absolute inset-0 rounded-full score-ring-rotate opacity-20"
                    style={{
                      background: score >= 4
                        ? 'conic-gradient(#22c55e, #00f0ff, #22c55e)'
                        : score >= 2
                          ? 'conic-gradient(#f59e0b, #00f0ff, #f59e0b)'
                          : 'conic-gradient(#ef4444, #ec4899, #ef4444)',
                    }}
                  />
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="text-4xl font-bold"
                      style={{
                        color: score >= 4 ? '#22c55e' : score >= 2 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {score}/{challenge.questions.length}
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {score >= 4 ? 'Excellent!' : score >= 2 ? 'Good try!' : 'Keep practicing!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject info */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {challenge.subject} — {challenge.topic}
                </p>
              </div>

              {/* Breakdown */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                  <span className="text-sm font-semibold text-[#22c55e]">{score} correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[#ef4444]" />
                  <span className="text-sm font-semibold text-[#ef4444]">{challenge.questions.length - score} incorrect</span>
                </div>
              </div>

              {/* Per-question review */}
              <div className="max-h-64 overflow-y-auto mb-6 space-y-2 text-left px-2">
                {challenge.questions.map((q, idx) => {
                  const isCorrect = score > 0
                  return (
                    <div
                      key={idx}
                      className="glass rounded-lg p-3 flex items-start gap-3"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          true ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-[#ef4444]/15 text-[#ef4444]'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{q.question}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Answer: {q.options[q.correct]}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setPhase('idle')
                    setChallenge(null)
                  }}
                  className="btn-neon px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startChallenge}
                  disabled={generating}
                  className={`btn-neon-solid px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm ${generating ? 'opacity-60' : ''}`}
                >
                  {generating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  New Challenge
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
