'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, AlertTriangle, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useStore } from '@/store/useStore'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuizActive() {
  const {
    quizQuestions, quizAnswers, setQuizAnswer, quizSubject, quizTopic,
    resetQuiz, setCurrentPage
  } = useStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const totalQuestions = quizQuestions.length
  const currentQuestion = quizQuestions[currentIndex]
  const selectedAnswer = quizAnswers[currentIndex]
  const answeredCount = quizAnswers.filter(a => a !== null).length

  // Timer
  useState(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  })

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSelectOption = (optionIndex: number) => {
    setQuizAnswer(currentIndex, optionIndex)
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    setShowSubmitDialog(false)
    // Calculate score and navigate
    setCurrentPage('quiz-results')
  }

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen lg:pl-[260px] flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-gray-400 mb-4">No quiz questions loaded</p>
          <Button onClick={() => setCurrentPage('quiz-setup')} className="btn-neon">
            Back to Quiz Setup
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen lg:pl-[260px] p-4 md:p-6 lg:p-8 pt-14 lg:pt-0 max-w-3xl mx-auto"
    >
      {/* Top Bar */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">{quizSubject}</Badge>
            <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">{quizTopic}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-sm ${elapsedTime >= 30 ? 'timer-critical' : 'text-gray-400'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-400">
              {answeredCount}/{totalQuestions} answered
            </div>
          </div>
        </div>
        <Progress value={(answeredCount / totalQuestions) * 100} className="h-2 bg-white/5 progress-glow" />
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
        {quizQuestions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all border ${
              idx === currentIndex
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : quizAnswers[idx] !== null
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/10 bg-white/5 text-gray-500 hover:bg-white/10'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="glass rounded-2xl p-6 md:p-8 mb-6 neon-border question-card-border"
        >
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
              <span className="text-cyan-400 font-bold text-sm">{currentIndex + 1}</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 group option-btn ${
                  selectedAnswer === idx
                    ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,240,255,0.08)] option-btn-selected'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-all ${
                  selectedAnswer === idx
                    ? 'bg-cyan-500 text-black'
                    : 'bg-white/5 text-gray-400 group-hover:bg-white/10'
                }`}>
                  {OPTION_LABELS[idx]}
                </div>
                <span className={`text-sm md:text-base pt-1.5 transition-colors ${
                  selectedAnswer === idx ? 'text-white' : 'text-gray-300'
                }`}>
                  {option}
                </span>
                {selectedAnswer === idx && (
                  <CheckCircle className="w-5 h-5 text-cyan-400 ml-auto shrink-0 mt-1.5" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-gray-400 hover:text-white disabled:opacity-30 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {answeredCount < totalQuestions && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {totalQuestions - answeredCount} unanswered
            </span>
          )}
        </div>

        {currentIndex < totalQuestions - 1 ? (
          <Button onClick={handleNext} disabled={selectedAnswer === null} className="btn-neon gap-2 btn-shimmer-hover">
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={() => setShowSubmitDialog(true)} className="btn-neon-solid gap-2">
            <Send className="w-4 h-4" />
            Submit Quiz
          </Button>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="glass-strong border border-white/10 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {answeredCount < totalQuestions ? (
                <>
                  You have <span className="text-amber-400 font-semibold">{totalQuestions - answeredCount} unanswered</span> questions.
                  Unanswered questions will be marked as incorrect.
                </>
              ) : (
                <>You have answered all {totalQuestions} questions. Ready to see your results?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10">
              Continue Quiz
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="btn-neon-solid"
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
