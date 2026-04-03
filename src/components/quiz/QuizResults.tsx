'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, RotateCcw, Home, CheckCircle2, XCircle,
  ChevronRight, Star, Zap, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/store/useStore'

export default function QuizResults() {
  const {
    quizQuestions, quizAnswers, quizSubject, quizTopic,
    resetQuiz, setCurrentPage, setStats, totalNotes, totalQuizzes, avgScore
  } = useStore()
  const [animatedScore, setAnimatedScore] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  const results = useMemo(() => {
    return quizQuestions.map((q, i) => ({
      question: q.question,
      options: q.options,
      yourAnswer: quizAnswers[i],
      correctAnswer: q.correct,
      isCorrect: quizAnswers[i] === q.correct,
      explanation: q.explanation
    }))
  }, [quizQuestions, quizAnswers])

  const correctCount = results.filter(r => r.isCorrect).length
  const total = results.length
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const getScoreColor = () => {
    if (percentage >= 80) return { color: '#22c55e', label: 'Excellent!', text: 'text-green-400' }
    if (percentage >= 60) return { color: '#f59e0b', label: 'Good Job!', text: 'text-amber-400' }
    return { color: '#ef4444', label: 'Keep Practicing', text: 'text-red-400' }
  }

  const scoreInfo = getScoreColor()

  // Animated score counter
  useEffect(() => {
    let frame: number
    let current = 0
    const target = percentage
    const duration = 1500
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      current = Math.round(eased * target)
      setAnimatedScore(current)
      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [percentage])

  // Confetti for high scores
  useEffect(() => {
    if (percentage < 80) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [percentage])

  // Save result
  useEffect(() => {
    const saveResult = async () => {
      try {
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: quizSubject,
            topic: quizTopic,
            score: correctCount,
            totalMarks: total
          })
        })
        setStats(totalNotes, totalQuizzes + 1, avgScore > 0 ? Math.round((avgScore + percentage) / 2) : percentage)
      } catch { /* ignore */ }
    }
    if (total > 0) saveResult()
  }, [])

  const handleRetry = () => {
    resetQuiz()
    setCurrentPage('quiz-setup')
  }

  const handleDashboard = () => {
    resetQuiz()
    setCurrentPage('dashboard')
  }

  // SVG circular progress
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  const OPTION_LABELS = ['A', 'B', 'C', 'D']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 md:p-6 lg:p-8 max-w-3xl mx-auto"
    >
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: `${(i * 37) % 100}%`,
                y: '-5%',
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: '110%',
                rotate: [0, 180, 360],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2.5 + (i % 3),
                delay: (i * 0.03),
                ease: 'easeIn',
              }}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                backgroundColor: ['#00f0ff', '#a855f7', '#ec4899', '#22c55e', '#f59e0b'][i % 5],
              }}
            />
          ))}
        </div>
      )}

      {/* Score Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-gray-300">{quizSubject} • {quizTopic}</span>
        </motion.div>

        {/* Circular Progress */}
        <div className="relative inline-block mb-4">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx="80" cy="80" r="54"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="80" cy="80" r="54"
              stroke={scoreInfo.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                filter: `drop-shadow(0 0 10px ${scoreInfo.color}40)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-4xl font-bold ${scoreInfo.text}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {animatedScore}%
            </motion.span>
            <span className="text-xs text-gray-500 mt-0.5">
              {correctCount}/{total} correct
            </span>
          </div>
        </div>

        <motion.h2
          className={`text-2xl font-bold ${scoreInfo.text} mb-1`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {scoreInfo.label}
        </motion.h2>
        <motion.p
          className="text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {percentage >= 80
            ? 'Outstanding performance! You\'ve mastered this topic.'
            : percentage >= 60
              ? 'Good work! A little more practice and you\'ll ace it.'
              : 'Don\'t worry! Review the material and try again.'}
        </motion.p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        <div className="glass rounded-xl p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{correctCount}</p>
          <p className="text-xs text-gray-500">Correct</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{total - correctCount}</p>
          <p className="text-xs text-gray-500">Incorrect</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex items-center justify-center gap-3 mb-8"
      >
        <Button onClick={handleRetry} className="btn-neon gap-2 px-5">
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
        <Button onClick={handleDashboard} className="btn-neon-solid gap-2 px-5">
          <Home className="w-4 h-4" /> Dashboard
        </Button>
      </motion.div>

      {/* Question Review */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Question Review
        </h3>
        <div className="space-y-3">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + index * 0.05 }}
              className="glass rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  result.isCorrect
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {result.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 line-clamp-1">
                    <span className="text-gray-500 mr-1">Q{index + 1}.</span>
                    {result.question}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {result.yourAnswer !== null ? (
                      <Badge className={`text-[10px] px-1.5 ${
                        result.isCorrect
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        Your answer: {OPTION_LABELS[result.yourAnswer]}
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] px-1.5 bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        Not answered
                      </Badge>
                    )}
                    {!result.isCorrect && (
                      <Badge className="text-[10px] px-1.5 bg-green-500/10 text-green-400 border border-green-500/20">
                        Correct: {OPTION_LABELS[result.correctAnswer]}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-600 shrink-0 mt-1 transition-transform ${expandedQuestion === index ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {expandedQuestion === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 ml-11">
                      <p className="text-sm text-gray-300 mb-3">{result.question}</p>
                      <div className="space-y-2">
                        {result.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`text-sm px-3 py-2 rounded-lg border ${
                              oi === result.correctAnswer
                                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                : oi === result.yourAnswer && !result.isCorrect
                                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                  : 'border-white/5 bg-white/[0.02] text-gray-500'
                            }`}
                          >
                            <span className="font-medium mr-2">{OPTION_LABELS[oi]}.</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                      {result.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/5">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Explanation</p>
                          <p className="text-sm text-gray-400">{result.explanation}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
