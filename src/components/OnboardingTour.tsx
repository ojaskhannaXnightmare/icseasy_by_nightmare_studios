'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot, Brain, BookOpen, FileText, BrainCircuit,
  BarChart3, Trophy, Flame, ArrowRight, ArrowLeft,
  Sparkles, Rocket
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const TOTAL_STEPS = 4

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isPast = step < currentStep

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full transition-all duration-500"
                style={{
                  background: isActive
                    ? '#00f0ff'
                    : isPast
                      ? 'rgba(0, 240, 255, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isActive
                    ? '0 0 12px rgba(0, 240, 255, 0.6), 0 0 24px rgba(0, 240, 255, 0.3)'
                    : isPast
                      ? '0 0 8px rgba(0, 240, 255, 0.3)'
                      : 'none',
                }}
              />
            </div>
            {step < TOTAL_STEPS && (
              <div
                className="w-10 sm:w-16 h-[2px] mx-1 transition-all duration-500"
                style={{
                  background: isPast
                    ? 'linear-gradient(90deg, rgba(0, 240, 255, 0.5), rgba(168, 85, 247, 0.4))'
                    : 'rgba(255, 255, 255, 0.06)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepContent({
  step,
  direction,
}: {
  step: number
  direction: number
}) {
  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.95,
    }),
  }

  const content = (() => {
    switch (step) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <AIStep />
      case 3:
        return <ProgressStep />
      case 4:
        return <StartStep />
      default:
        return null
    }
  })()

  return (
    <motion.div
      key={step}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full"
    >
      {content}
    </motion.div>
  )
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <motion.div
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center mx-auto"
        style={{ boxShadow: '0 0 40px rgba(0, 240, 255, 0.3), 0 0 80px rgba(168, 85, 247, 0.15)' }}
        animate={{
          boxShadow: [
            '0 0 40px rgba(0, 240, 255, 0.3), 0 0 80px rgba(168, 85, 247, 0.15)',
            '0 0 55px rgba(0, 240, 255, 0.4), 0 0 100px rgba(168, 85, 247, 0.25)',
            '0 0 40px rgba(0, 240, 255, 0.3), 0 0 80px rgba(168, 85, 247, 0.15)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bot className="w-10 h-10 text-[#0a0a0f]" />
      </motion.div>
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold text-gradient-animated">
          Welcome to ICSEasy!
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Your AI-powered companion for ICSE exam preparation. Learn smarter,
          track your progress, and ace your exams with cutting-edge technology.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-xs sm:text-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-muted-foreground">AI-Powered</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-xs sm:text-sm">
          <Brain className="w-3.5 h-3.5 text-[#a855f7]" />
          <span className="text-muted-foreground">Smart Learning</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-xs sm:text-sm">
          <Trophy className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span className="text-muted-foreground">Track Progress</span>
        </div>
      </div>
    </div>
  )
}

function AIStep() {
  const features = [
    {
      icon: BrainCircuit,
      title: 'AI Tutor',
      description: 'Get instant help from your AI study companion — ask questions, get explanations, and learn at your own pace.',
      color: '#00f0ff',
      glow: 'rgba(0, 240, 255, 0.15)',
    },
    {
      icon: FileText,
      title: 'Smart Notes',
      description: 'Create, organize, and generate AI-powered notes for any subject or topic. Export to Markdown anytime.',
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.15)',
    },
    {
      icon: Brain,
      title: 'Adaptive Quizzes',
      description: 'Take quizzes tailored to your subjects and difficulty level. Review answers with detailed explanations.',
      color: '#ec4899',
      glow: 'rgba(236, 72, 153, 0.15)',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient-animated">
          AI-Powered Learning
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Leverage artificial intelligence to supercharge your study sessions
        </p>
      </div>
      <div className="space-y-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
            className="glass-card rounded-xl p-4 flex items-start gap-4"
            style={{ boxShadow: `0 0 20px ${feature.glow}` }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}08)`,
                border: `1px solid ${feature.color}30`,
              }}
            >
              <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm" style={{ color: feature.color }}>
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ProgressStep() {
  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard & Analytics',
      description: 'Real-time stats, weekly activity charts, and insights about your study habits.',
      color: '#00f0ff',
      glow: 'rgba(0, 240, 255, 0.15)',
    },
    {
      icon: Trophy,
      title: 'Achievements & Leaderboard',
      description: 'Unlock badges for milestones and compete with friends on the leaderboard.',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.15)',
    },
    {
      icon: Flame,
      title: 'Streak & Goals',
      description: 'Maintain your daily study streak and set personal goals to stay on track.',
      color: '#ec4899',
      glow: 'rgba(236, 72, 153, 0.15)',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient-animated">
          Track Your Progress
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Stay motivated with detailed analytics and achievement tracking
        </p>
      </div>
      <div className="space-y-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
            className="glass-card rounded-xl p-4 flex items-start gap-4"
            style={{ boxShadow: `0 0 20px ${feature.glow}` }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}08)`,
                border: `1px solid ${feature.color}30`,
              }}
            >
              <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm" style={{ color: feature.color }}>
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function StartStep() {
  const { setCurrentPage } = useStore()

  const quickActions = [
    {
      icon: Brain,
      label: 'Take a Quiz',
      page: 'quiz-setup' as const,
      color: '#00f0ff',
    },
    {
      icon: FileText,
      label: 'Create Notes',
      page: 'notes' as const,
      color: '#a855f7',
    },
    {
      icon: BrainCircuit,
      label: 'Ask AI Tutor',
      page: 'tutor' as const,
      color: '#ec4899',
    },
  ]

  return (
    <div className="text-center space-y-6">
      <div className="space-y-3">
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22c55e] to-[#00f0ff] flex items-center justify-center mx-auto"
          style={{ boxShadow: '0 0 30px rgba(34, 197, 94, 0.25), 0 0 60px rgba(0, 240, 255, 0.15)' }}
          animate={{
            boxShadow: [
              '0 0 30px rgba(34, 197, 94, 0.25), 0 0 60px rgba(0, 240, 255, 0.15)',
              '0 0 45px rgba(34, 197, 94, 0.35), 0 0 80px rgba(0, 240, 255, 0.2)',
              '0 0 30px rgba(34, 197, 94, 0.25), 0 0 60px rgba(0, 240, 255, 0.15)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Rocket className="w-8 h-8 text-[#0a0a0f]" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient-animated">
          Start Learning!
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          You&apos;re all set! Choose a quick action to begin your journey
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {quickActions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              localStorage.setItem('icseasy-onboarded', 'true')
              setCurrentPage(action.page)
            }}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl glass-card w-full sm:w-auto transition-all duration-300"
            style={{
              boxShadow: `0 0 15px ${action.color}15`,
            }}
          >
            <action.icon className="w-4 h-4" style={{ color: action.color }} />
            <span className="text-sm font-medium text-foreground">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingTour() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [visible, setVisible] = useState(true)

  const dismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem('icseasy-onboarded', 'true')
  }, [])

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dismiss])

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      dismiss()
    }
  }, [step, dismiss])

  const handleBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }, [step])

  const handleSkip = useCallback(() => {
    dismiss()
  }, [dismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 glass-strong" />

          {/* Floating orbs */}
          <motion.div
            className="absolute top-[15%] left-[10%] w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)' }}
            animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[15%] right-[10%] w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }}
            animate={{ y: [0, -25, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute top-[60%] right-[25%] w-32 h-32 rounded-full pointer-events-none floating-orb"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)' }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          {/* Content card */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="glass-card rounded-2xl p-6 sm:p-8" style={{ boxShadow: '0 0 50px rgba(0, 240, 255, 0.05), 0 25px 60px rgba(0, 0, 0, 0.5)' }}>
              {/* Step indicator */}
              <StepIndicator currentStep={step} />

              {/* Step content with AnimatePresence */}
              <div className="min-h-[280px] sm:min-h-[300px] flex items-center">
                <AnimatePresence mode="wait" custom={direction}>
                  <StepContent step={step} direction={direction} />
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div>
                  {step > 1 && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={handleBack}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </motion.button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {step < TOTAL_STEPS && (
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
                    >
                      Skip
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl btn-neon-solid text-sm font-semibold"
                  >
                    {step === TOTAL_STEPS ? (
                      <>
                        Let&apos;s Go!
                        <Rocket className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
