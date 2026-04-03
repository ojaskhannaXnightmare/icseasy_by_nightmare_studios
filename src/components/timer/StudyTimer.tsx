'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, ChevronRight, Clock, Zap, Coffee, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'

type TimerMode = 'focus' | 'break'

const FOCUS_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60 // 5 minutes in seconds

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gain.gain.value = 0.3
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not available
  }
}

export default function StudyTimer() {
  const { setCurrentPage } = useStore()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  const handleComplete = useCallback(() => {
    setIsRunning(false)
    if (soundEnabled) playBeep()
    if (mode === 'focus') {
      setSessions((prev) => prev + 1)
    }
  }, [mode, soundEnabled])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
          if (next >= totalSeconds) {
            handleComplete()
            return totalSeconds
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, totalSeconds, handleComplete])

  const handleStartPause = () => {
    if (remainingSeconds <= 0) {
      // Reset and start
      setElapsedSeconds(0)
      setIsRunning(true)
    } else {
      setIsRunning((prev) => !prev)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
  }

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setElapsedSeconds(0)
  }

  // SVG circle parameters
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  // Mode-dependent colors
  const modeColor = mode === 'focus' ? '#00f0ff' : '#a855f7'
  const modeColorRgb = mode === 'focus' ? 'rgba(0,240,255,' : 'rgba(168,85,247,'
  const modeColorAlt = mode === 'focus' ? '#a855f7' : '#ec4899'

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8 relative overflow-hidden">
      {/* Ambient glow - changes color based on mode */}
      <div
        className="timer-ambient"
        style={{ backgroundColor: mode === 'focus' ? '#00f0ff' : '#a855f7' }}
      />
      {/* Background orbs that change color based on mode */}
      <motion.div
        className="fixed top-1/3 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none floating-orb"
        animate={{
          backgroundColor: mode === 'focus' ? 'rgba(0,240,255,0.04)' : 'rgba(168,85,247,0.04)',
          x: [0, 30, -20, 10, 0],
          y: [0, -20, 15, -10, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none floating-orb floating-delayed"
        animate={{
          backgroundColor: mode === 'focus' ? 'rgba(0,240,255,0.03)' : 'rgba(168,85,247,0.03)',
          x: [0, -25, 15, -10, 0],
          y: [0, 20, -15, 10, 0],
          scale: [1, 0.95, 1.08, 1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed top-10 right-10 w-[250px] h-[250px] rounded-full pointer-events-none floating-orb"
        animate={{
          backgroundColor: mode === 'focus' ? 'rgba(0,240,255,0.02)' : 'rgba(236,72,153,0.02)',
          x: [0, 15, -25, 20, 0],
          y: [0, -15, 25, -20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: -5 }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
              <Clock className="w-7 h-7" />
              Study Timer
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Pomodoro technique for focused learning</p>
          </div>
        </motion.div>

        {/* Mode Toggle with enhanced neon active states */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => switchMode('focus')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === 'focus'
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 shadow-[0_0_20px_rgba(0,240,255,0.15)] mode-toggle-active'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            }`}
          >
            <Zap className="w-4 h-4" />
            Focus
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === 'break'
                ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 shadow-[0_0_20px_rgba(168,85,247,0.15)] mode-toggle-active'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            }`}
          >
            <Coffee className="w-4 h-4" />
            Break
          </motion.button>
        </motion.div>

        {/* Timer Circle with dramatic gradient stroke */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-[-20px] rounded-full blur-[50px] opacity-30"
              animate={{
                backgroundColor: mode === 'focus'
                  ? ['rgba(0,240,255,0.15)', 'rgba(0,240,255,0.08)', 'rgba(0,240,255,0.15)']
                  : ['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.08)', 'rgba(168,85,247,0.15)'],
                scale: isRunning ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: isRunning ? 2 : 0, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* SVG Circle with gradient stroke */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={modeColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={modeColorAlt} stopOpacity="0.7" />
                </linearGradient>
                <filter id="timerGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Track circle */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              {/* Gradient progress circle */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                filter="url(#timerGlow)"
              />
              {/* Subtle inner ring */}
              <circle
                cx="130"
                cy="130"
                r={radius - 16}
                fill="none"
                stroke="rgba(255,255,255,0.02)"
                strokeWidth="1"
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-5xl sm:text-6xl font-bold font-mono tracking-wider"
                style={{
                  color: modeColor,
                  textShadow: `0 0 25px ${modeColorRgb}0.3), 0 0 50px ${modeColorRgb}0.1)`,
                }}
                key={mode}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </motion.span>
              <motion.span
                className="text-xs text-muted-foreground mt-2 uppercase tracking-wider"
                key={`label-${mode}`}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {mode === 'focus' ? 'Focus Time' : 'Break Time'}
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={handleReset}
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full glass border-white/10 hover:bg-white/5 hover:border-white/20 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleStartPause}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                mode === 'focus'
                  ? 'bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0a0a0f] shadow-[0_0_30px_rgba(0,240,255,0.3)] timer-btn-pulse text-[#00f0ff]'
                  : 'bg-[#a855f7] hover:bg-[#a855f7]/90 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] timer-btn-pulse text-[#a855f7]'
              } ${isRunning ? '' : ''}`}
            >
              {isRunning ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>
          </motion.div>
          {/* Sound toggle with smooth icon transition */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="outline"
              size="icon"
              className={`w-12 h-12 rounded-full glass border-white/10 hover:bg-white/5 transition-all duration-200 ${
                soundEnabled ? 'hover:border-cyan-500/30' : ''
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {soundEnabled ? (
                  <motion.div
                    key="on"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="off"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </motion.div>

        {/* Session Counter with neon badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 card-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Sessions Completed</h3>
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-3xl font-bold gradient-text"
                  key={sessions}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {sessions}
                </motion.span>
                <span className="text-xs text-muted-foreground">
                  {sessions === 1 ? 'session' : 'sessions'} today
                </span>
                {sessions > 0 && (
                  <span
                    className="neon-badge text-cyan-400 border-cyan-500/20 bg-cyan-500/5"
                    style={{ '--badge-glow': 'rgba(0, 240, 255, 0.15)' } as React.CSSProperties}
                  >
                    {mode === 'focus' ? '🔥' : '☕'} {mode === 'focus' ? 'Focused' : 'Resting'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <AnimatePresence>
                {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                  <motion.div
                    key={`session-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, delay: i * 0.05 }}
                    className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.4)]"
                  />
                ))}
              </AnimatePresence>
              {sessions === 0 && (
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={`empty-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-3 h-3 rounded-full bg-white/5"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {sessions > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-white/5"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total focus time</span>
                <span className="text-[#00f0ff] font-medium">{sessions * 25} minutes</span>
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((sessions * 25) / 120 * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{Math.min((sessions * 25) / 120 * 100, 100).toFixed(0)}% of 2-hour goal</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
