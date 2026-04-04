'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Brain,
  FileText,
  Bot,
  Layers,
  Timer,
  Flame,
  LogIn,
  Trophy,
  Target,
  Star,
  ChevronUp,
  Zap,
  X,
} from 'lucide-react'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

// Action type → icon + label + color mapping
const ACTION_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  quiz_complete: { icon: Brain, label: 'Quiz Completed', color: '#00f0ff' },
  perfect_quiz: { icon: Star, label: 'Perfect Quiz!', color: '#f59e0b' },
  note_created: { icon: FileText, label: 'Note Created', color: '#a855f7' },
  ai_note_generated: { icon: Bot, label: 'AI Note Generated', color: '#00f0ff' },
  flashcard_created: { icon: Layers, label: 'Flashcard Created', color: '#22c55e' },
  study_session: { icon: Timer, label: 'Study Session', color: '#a855f7' },
  streak_bonus: { icon: Flame, label: 'Streak Bonus', color: '#f97316' },
  daily_login: { icon: LogIn, label: 'Daily Login', color: '#22c55e' },
  achievement_unlocked: { icon: Trophy, label: 'Achievement Unlocked', color: '#f59e0b' },
  challenge_complete: { icon: Target, label: 'Challenge Complete', color: '#ec4899' },
}

// Level milestones with rewards
const LEVEL_MILESTONES = [
  { level: 5, reward: 'Streak Shield Badge', color: '#00f0ff' },
  { level: 10, reward: 'AI Tutor Pro Access', color: '#a855f7' },
  { level: 15, reward: 'Custom Profile Theme', color: '#ec4899' },
  { level: 20, reward: 'Study Analytics Premium', color: '#f59e0b' },
  { level: 25, reward: 'Leaderboard Crown Badge', color: '#22c55e' },
  { level: 50, reward: 'ICSEasy Legend Status', color: '#00f0ff' },
]

// Pre-computed decorative particle positions (no Math.random in render)
const PARTICLES = [
  { x: 12, y: 8, size: 3, delay: 0, color: '#00f0ff' },
  { x: 85, y: 15, size: 2, delay: 0.8, color: '#a855f7' },
  { x: 45, y: 90, size: 2.5, delay: 1.5, color: '#ec4899' },
  { x: 70, y: 75, size: 2, delay: 2.2, color: '#00f0ff' },
  { x: 25, y: 55, size: 1.5, delay: 3.0, color: '#a855f7' },
  { x: 90, y: 45, size: 2, delay: 0.4, color: '#ec4899' },
  { x: 8, y: 80, size: 1.5, delay: 1.8, color: '#22c55e' },
  { x: 60, y: 20, size: 2, delay: 2.8, color: '#f59e0b' },
]

interface XPHistoryEntry {
  action: string
  amount: number
  date: string
}

interface XPData {
  xp: number
  level: number
  xpToNextLevel: number
  xpProgress: number
  xpInCurrentLevel: number
  totalEarned: number
  recentHistory: XPHistoryEntry[]
}

function getRelativeTime(isoString: string): string {
  const now = new Date()
  const date = new Date(isoString)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LevelBadge({ level, size = 'sm' }: { level: number; size?: 'sm' | 'lg' }) {
  const isLarge = size === 'lg'
  const badgeSize = isLarge ? 'w-16 h-16 text-2xl' : 'w-9 h-9 text-sm'

  // Determine color based on level tier
  let glowColor = '#00f0ff'
  let ringColor = 'from-cyan-500 to-purple-500'
  if (level >= 50) {
    glowColor = '#f59e0b'
    ringColor = 'from-amber-400 to-yellow-500'
  } else if (level >= 25) {
    glowColor = '#ec4899'
    ringColor = 'from-pink-500 to-rose-500'
  } else if (level >= 15) {
    glowColor = '#a855f7'
    ringColor = 'from-purple-500 to-violet-500'
  } else if (level >= 10) {
    glowColor = '#22c55e'
    ringColor = 'from-green-500 to-emerald-500'
  }

  return (
    <motion.div
      className={`relative ${badgeSize} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${glowColor}25, ${glowColor}08)`,
        border: `2px solid ${glowColor}40`,
        boxShadow: `0 0 16px ${glowColor}20, 0 0 32px ${glowColor}08`,
        color: glowColor,
      }}
      animate={{ boxShadow: [`0 0 16px ${glowColor}20`, `0 0 24px ${glowColor}35`, `0 0 16px ${glowColor}20`] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="relative z-10">{level}</span>
      {/* Rotating ring */}
      <motion.div
        className="absolute inset-[-3px] rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${glowColor}60, transparent, ${glowColor}60)`,
          opacity: 0.3,
          zIndex: 0,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      />
    </motion.div>
  )
}

function XPProgressBar({ progress, max, level }: { progress: number; max: number; level: number }) {
  const percentage = Math.min((progress / max) * 100, 100)

  let barColor1 = '#00f0ff'
  let barColor2 = '#a855f7'
  if (level >= 50) { barColor1 = '#f59e0b'; barColor2 = '#ef4444' }
  else if (level >= 25) { barColor1 = '#ec4899'; barColor2 = '#a855f7' }
  else if (level >= 15) { barColor1 = '#a855f7'; barColor2 = '#6366f1' }
  else if (level >= 10) { barColor1 = '#22c55e'; barColor2 = '#00f0ff' }

  return (
    <div className="flex-1 min-w-0">
      <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden relative">
        {/* Animated fill bar */}
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, ${barColor1}, ${barColor2})`,
            boxShadow: `0 0 12px ${barColor1}40`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
          />
        </motion.div>
      </div>
    </div>
  )
}

function XPDropdownPanel({ data, onClose }: { data: XPData; onClose: () => void }) {
  const nextMilestones = LEVEL_MILESTONES.filter(m => m.level > data.level).slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-32px)] glass-strong rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
    >
      {/* Pre-computed decorative particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.25,
          }}
          animate={{ y: [0, -6, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          aria-hidden
        />
      ))}

      {/* Header */}
      <div className="relative p-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LevelBadge level={data.level} size="lg" />
            <div>
              <h3 className="font-semibold text-sm">Level {data.level}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-foreground font-semibold">{data.totalEarned}</span> total XP earned
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar in dropdown */}
        <div className="mt-3 flex items-center gap-2.5">
          <XPProgressBar progress={data.xpProgress} max={data.xpToNextLevel} level={data.level} />
          <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
            {data.xpProgress}/{data.xpToNextLevel}
          </span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="relative p-4 pb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Recent Activity
        </h4>
        {data.recentHistory.length === 0 ? (
          <div className="text-center py-4">
            <Sparkles className="w-5 h-5 mx-auto text-[#00f0ff]/40 mb-2" />
            <p className="text-xs text-muted-foreground">No XP earned yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Complete quizzes & create notes to earn XP!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5 pr-1">
              {data.recentHistory.map((entry, index) => {
                const meta = ACTION_META[entry.action] || { icon: Zap, label: entry.action, color: '#94a3b8' }
                const Icon = meta.icon
                return (
                  <motion.div
                    key={`${entry.action}-${entry.date}-${index}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}12` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{meta.label}</p>
                      <p className="text-[10px] text-muted-foreground">{getRelativeTime(entry.date)}</p>
                    </div>
                    <span
                      className="text-xs font-bold shrink-0"
                      style={{ color: meta.color }}
                    >
                      +{entry.amount}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Level Milestones */}
      {nextMilestones.length > 0 && (
        <div className="relative p-4 pt-2 border-t border-white/5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Level Milestones
          </h4>
          <div className="space-y-2">
            {nextMilestones.map((milestone) => {
              const levelsAway = milestone.level - data.level
              const progressPct = Math.min((data.xpProgress / data.xpToNextLevel) * 100, 100) / levelsAway
              return (
                <div
                  key={milestone.level}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${milestone.color}10` }}
                  >
                    <Star className="w-4 h-4" style={{ color: milestone.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">Level {milestone.level}</p>
                    <p className="text-[10px] text-muted-foreground">{milestone.reward}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {levelsAway * 100 - data.xpProgress} XP away
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function XPBarSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl glass-card">
      <Skeleton className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-20 bg-white/5" />
        <Skeleton className="h-2 w-full bg-white/5 rounded-full" />
      </div>
    </div>
  )
}

export default function XPBar() {
  const { xp, level, setXp, setLevel } = useStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [xpData, setXpData] = useState<XPData | null>(null)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchXP = useCallback(async () => {
    try {
      const res = await authFetch('/api/xp')
      if (res.ok) {
        const data = await res.json()
        setXpData(data)
        setXp(data.xp)
        setLevel(data.level)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [setXp, setLevel])

  useEffect(() => {
    fetchXP()
  }, [fetchXP])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  if (loading) return <XPBarSkeleton />

  const displayXP = xpData || { xp, level, xpToNextLevel: 100, xpProgress: xp % 100, totalEarned: xp, recentHistory: [] }

  // Derive display values
  const progressPct = Math.min((displayXP.xpProgress / displayXP.xpToNextLevel) * 100, 100)

  return (
    <div ref={containerRef} className="relative">
      {/* Compact XP Bar Widget */}
      <motion.button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl glass-card hover:bg-white/[0.04] transition-colors w-full text-left cursor-pointer group"
        whileTap={{ scale: 0.98 }}
        aria-label="XP Progress - Click to expand"
        aria-expanded={dropdownOpen}
      >
        {/* Level Badge */}
        <LevelBadge level={displayXP.level} size="sm" />

        {/* XP Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">
              Level {displayXP.level}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {displayXP.xpProgress}/{displayXP.xpToNextLevel} XP
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #00f0ff, #a855f7)',
                boxShadow: '0 0 8px rgba(0,240,255,0.3)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* Shimmer on hover */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden"
              aria-hidden
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
              />
            </motion.div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 opacity-60">
            {displayXP.xpToNextLevel - displayXP.xpProgress} XP to Level {displayXP.level + 1}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: dropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground shrink-0"
        >
          <ChevronUp className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {dropdownOpen && xpData && (
          <XPDropdownPanel
            data={xpData}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
