'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, ChevronRight, Clock, Zap, Coffee } from 'lucide-react'
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  const handleComplete = useCallback(() => {
    setIsRunning(false)
    playBeep()
    if (mode === 'focus') {
      setSessions((prev) => prev + 1)
    }
  }, [mode])

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

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-1/3 left-1/3 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
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
              <Clock className="w-7 h-7" />
              Study Timer
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Pomodoro technique for focused learning</p>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <button
            onClick={() => switchMode('focus')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === 'focus'
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            }`}
          >
            <Zap className="w-4 h-4" />
            Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === 'break'
                ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            }`}
          >
            <Coffee className="w-4 h-4" />
            Break
          </button>
        </motion.div>

        {/* Timer Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* Background glow */}
            <div
              className="absolute inset-0 rounded-full blur-[40px] opacity-20"
              style={{
                backgroundColor: mode === 'focus' ? '#00f0ff' : '#a855f7',
              }}
            />
            {/* SVG Circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              {/* Track circle */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke={mode === 'focus' ? '#00f0ff' : '#a855f7'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: `drop-shadow(0 0 8px ${mode === 'focus' ? 'rgba(0,240,255,0.4)' : 'rgba(168,85,247,0.4)'})`,
                }}
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-bold font-mono tracking-wider" style={{
                color: mode === 'focus' ? '#00f0ff' : '#a855f7',
                textShadow: `0 0 20px ${mode === 'focus' ? 'rgba(0,240,255,0.3)' : 'rgba(168,85,247,0.3)'}`,
              }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                {mode === 'focus' ? 'Focus Time' : 'Break Time'}
              </span>
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
          <Button
            onClick={handleReset}
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full glass border-white/10 hover:bg-white/5"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button
            onClick={handleStartPause}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              mode === 'focus'
                ? 'bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0a0a0f] shadow-[0_0_30px_rgba(0,240,255,0.3)]'
                : 'bg-[#a855f7] hover:bg-[#a855f7]/90 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)]'
            }`}
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
        </motion.div>

        {/* Session Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 card-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Sessions Completed</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold gradient-text">{sessions}</span>
                <span className="text-xs text-muted-foreground">
                  {sessions === 1 ? 'session' : 'sessions'} today
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.4)]"
                />
              ))}
              {sessions === 0 && (
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-white/5" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {sessions > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total focus time</span>
                <span className="text-[#00f0ff] font-medium">{sessions * 25} minutes</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
