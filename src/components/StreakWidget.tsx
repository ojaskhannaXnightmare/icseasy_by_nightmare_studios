'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Trophy, CheckCircle2, Sparkles } from 'lucide-react'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'

interface StreakData {
  streak: number
  lastActive: string
  longestStreak: number
  shouldNotify: boolean
}

function getStreakColor(streak: number): string {
  if (streak === 0) return '#6b7280' // gray
  if (streak <= 2) return '#ffffff' // white
  if (streak <= 6) return '#00f0ff' // cyan
  if (streak <= 13) return '#a855f7' // purple
  return '#f59e0b' // gold
}

function getStreakGlow(streak: number): string {
  if (streak === 0) return 'none'
  if (streak <= 2) return '0 0 12px rgba(255,255,255,0.2)'
  if (streak <= 6) return '0 0 20px rgba(0,240,255,0.4)'
  if (streak <= 13) return '0 0 20px rgba(168,85,247,0.4)'
  return '0 0 24px rgba(245,158,11,0.5)'
}

function getStreakBg(streak: number): string {
  if (streak === 0) return 'rgba(107,114,128,0.08)'
  if (streak <= 2) return 'rgba(255,255,255,0.05)'
  if (streak <= 6) return 'rgba(0,240,255,0.06)'
  if (streak <= 13) return 'rgba(168,85,247,0.06)'
  return 'rgba(245,158,11,0.08)'
}

function getMilestoneMessage(streak: number): string | null {
  if (streak === 3) return '🔥 3-day streak! Great start!'
  if (streak === 7) return '🎉 One week! Keep going!'
  if (streak === 14) return '⭐ Two weeks of dedication!'
  if (streak === 30) return '🏆 A whole month! Amazing!'
  if (streak === 60) return '👑 Two months! Incredible!'
  if (streak === 100) return '💎 100 days! Legendary!'
  return null
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return 'Start studying to build your streak!'
  if (streak === 1) return 'Good start! Come back tomorrow!'
  if (streak <= 6) return 'Keep it going!'
  if (streak <= 13) return 'You\'re on fire! Stay consistent!'
  if (streak <= 29) return 'Incredible discipline!'
  if (streak <= 59) return 'Unstoppable commitment!'
  return 'Legendary dedication!'
}

export default function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const { setStreak, setLongestStreak } = useStore()

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await authFetch('/api/streak')
        if (res.ok) {
          const streakData: StreakData = await res.json()
          setData(streakData)
          setStreak(streakData.streak)
          setLongestStreak(streakData.longestStreak)

          if (streakData.shouldNotify) {
            setShowCelebration(true)
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoaded(true)
      }
    }
    fetchStreak()
  }, [setStreak, setLongestStreak])

  const streak = data?.streak ?? 0
  const longestStreak = data?.longestStreak ?? 0
  const color = getStreakColor(streak)
  const glow = getStreakGlow(streak)
  const bg = getStreakBg(streak)
  const milestoneMsg = getMilestoneMessage(streak)
  const motivationalMsg = getMotivationalMessage(streak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl p-4 sm:p-5 card-glow relative overflow-hidden"
      style={{ borderColor: `${color}15` }}
    >
      {/* Background glow */}
      {streak > 0 && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${bg} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && milestoneMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          >
            <div className="text-center px-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color }} />
              </motion.div>
              <p className="text-sm font-semibold" style={{ color }}>
                {milestoneMsg}
              </p>
              <button
                onClick={() => setShowCelebration(false)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-[1]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Study Streak</h3>
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: streak > 0 ? `${color}15` : 'rgba(107,114,128,0.1)',
              color: streak > 0 ? color : '#6b7280',
            }}
          >
            <CheckCircle2 className="w-3 h-3" />
            Active today
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="relative"
            animate={streak > 0 ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: bg,
                boxShadow: glow,
              }}
            >
              <Flame
                className="w-6 h-6"
                style={{ color }}
              />
            </div>
            {streak > 0 && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.div>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={loaded ? streak : 'loading'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-bold"
                    style={{ color }}
                  >
                    {loaded ? streak : '-'}
                  </span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </motion.div>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loaded ? motivationalMsg : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Longest Streak */}
        {longestStreak > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${color}08` }}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
            <span className="text-xs text-muted-foreground">
              Longest: <span className="font-semibold" style={{ color: '#f59e0b' }}>{longestStreak} days</span>
            </span>
          </div>
        )}

        {/* Streak reset warning */}
        {streak === 0 && loaded && (
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
            Start studying to maintain your streak!
          </p>
        )}
      </div>
    </motion.div>
  )
}
