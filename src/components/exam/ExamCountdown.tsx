'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Brain, FileText, BookOpen, Quote, GraduationCap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'

// ICSE 2027 exam date
const EXAM_DATE = new Date('2027-02-15T09:00:00')

// 30 motivational quotes (pre-computed, selected by day-of-year index)
const MOTIVATIONAL_QUOTES = [
  '"The expert in anything was once a beginner. Keep going!"',
  '"Success is the sum of small efforts, repeated day in and day out."',
  '"Don\'t watch the clock; do what it does. Keep going."',
  '"Education is the passport to the future."',
  '"The only way to do great work is to love what you do."',
  '"Believe you can and you\'re halfway there."',
  '"Hard work beats talent when talent doesn\'t work hard."',
  '"The secret of getting ahead is getting started."',
  '"It always seems impossible until it\'s done."',
  '"Push yourself, because no one else is going to do it for you."',
  '"Great things never come from comfort zones."',
  '"Dream it. Wish it. Do it."',
  '"The future belongs to those who believe in their dreams."',
  '"Don\'t stop when you\'re tired. Stop when you\'re done."',
  '"Study hard, for the well is deep, and our brains are shallow."',
  '"Knowledge is power. Practice makes perfect."',
  '"Every moment is a fresh beginning."',
  '"The pain you feel today will be the strength you feel tomorrow."',
  '"Little things make big days."',
  '"Strive for progress, not perfection."',
  '"Work hard in silence, let your success be your noise."',
  '"The best time to plant a tree was 20 years ago. The second best time is now."',
  '"Your limitation — it\'s only your imagination."',
  '"Don\'t let what you cannot do interfere with what you can do."',
  '"Success is not final, failure is not fatal."',
  '"What you get by achieving your goals is not as important as what you become."',
  '"The harder you work, the luckier you get."',
  '"Discipline is the bridge between goals and accomplishment."',
  '"Champions keep playing until they get it right."',
  '"Fall seven times, stand up eight."',
]

interface SubjectPerformance {
  subject: string
  avgScore: number
  totalQuizzes: number
}

// Pre-computed particles for decorative background (no Math.random in render)
const particlePositions = [
  { x: 10, y: 15, size: 3, opacity: 0.2 },
  { x: 85, y: 10, size: 2, opacity: 0.15 },
  { x: 90, y: 80, size: 4, opacity: 0.1 },
  { x: 15, y: 85, size: 2, opacity: 0.2 },
  { x: 50, y: 5, size: 3, opacity: 0.15 },
  { x: 5, y: 50, size: 2, opacity: 0.1 },
]

function getCountdownColor(totalDays: number): {
  primary: string
  secondary: string
  glow: string
  label: string
} {
  if (totalDays > 180) {
    return {
      primary: '#22c55e',
      secondary: '#00f0ff',
      glow: 'rgba(34, 197, 94, 0.3)',
      label: 'On Track',
    }
  }
  if (totalDays > 90) {
    return {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.3)',
      label: 'Pace Up',
    }
  }
  return {
    primary: '#ec4899',
    secondary: '#f43f5e',
    glow: 'rgba(236, 72, 153, 0.3)',
    label: 'Intensive',
  }
}

function ReadinessBar({ subject, score }: { subject: string; score: number }) {
  const barColor =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#00f0ff' : '#ef4444'

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 sm:w-36 shrink-0">
        <span className="text-xs text-gray-400 truncate block">{subject}</span>
      </div>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full"
          style={{
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${barColor}40`,
          }}
        />
      </div>
      <span
        className="text-xs font-semibold w-10 text-right"
        style={{ color: barColor }}
      >
        {score}%
      </span>
    </div>
  )
}

export default function ExamCountdown() {
  const { setCurrentPage } = useStore()
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])

  // Get today's quote based on day of year
  const todayQuote = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]
  }, [])

  // Fetch subject performance from analytics on mount
  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        const res = await authFetch('/api/analytics')
        if (res.ok && !cancelled) {
          const data = await res.json()
          if (data.stats?.subjectPerformance) {
            setSubjectPerformance(data.stats.subjectPerformance)
          }
        }
      } catch {
        // silent fail
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  // Countdown state — update every minute
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const diff = EXAM_DATE.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setCountdown({ days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [])

  const { days, hours, minutes } = countdown
  const colorScheme = getCountdownColor(days)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl overflow-hidden relative"
    >
      {/* Decorative background particles */}
      {particlePositions.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: colorScheme.primary,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -6, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* Header */}
      <div className="p-5 sm:p-6 pb-0 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${colorScheme.primary}15` }}
          >
            <GraduationCap className="w-4 h-4" style={{ color: colorScheme.primary }} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">ICSE 2027 Countdown</h2>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${colorScheme.primary}15`,
                  color: colorScheme.primary,
                  border: `1px solid ${colorScheme.primary}30`,
                }}
              >
                {colorScheme.label}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Numbers */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-6">
          {/* Days */}
          <div className="text-center">
            <motion.div
              className="text-4xl sm:text-5xl font-bold tabular-nums"
              style={{
                color: colorScheme.primary,
                textShadow: `0 0 20px ${colorScheme.glow}, 0 0 40px ${colorScheme.glow}`,
              }}
              key={`days-${days}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {String(days).padStart(3, '0')}
            </motion.div>
            <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 block">Days</span>
          </div>

          <span className="text-2xl font-light text-gray-600 mb-4">:</span>

          {/* Hours */}
          <div className="text-center">
            <motion.div
              className="text-4xl sm:text-5xl font-bold tabular-nums"
              style={{
                color: colorScheme.secondary,
                textShadow: `0 0 15px ${colorScheme.glow}`,
              }}
              key={`hours-${hours}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {String(hours).padStart(2, '0')}
            </motion.div>
            <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 block">Hrs</span>
          </div>

          <span className="text-2xl font-light text-gray-600 mb-4">:</span>

          {/* Minutes */}
          <div className="text-center">
            <motion.div
              className="text-4xl sm:text-5xl font-bold tabular-nums"
              style={{
                color: colorScheme.secondary,
                textShadow: `0 0 15px ${colorScheme.glow}`,
              }}
              key={`minutes-${minutes}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {String(minutes).padStart(2, '0')}
            </motion.div>
            <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 block">Min</span>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="px-5 sm:px-6 pb-4 relative z-10">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <Quote className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colorScheme.primary, opacity: 0.6 }} />
          <p className="text-xs text-gray-400 italic leading-relaxed">{todayQuote}</p>
        </div>
      </div>

      {/* Subject Readiness */}
      {subjectPerformance.length > 0 && (
        <div className="px-5 sm:px-6 pb-4 relative z-10">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Subject Readiness
          </h3>
          <div className="space-y-2.5">
            {subjectPerformance.slice(0, 5).map((sp) => (
              <ReadinessBar key={sp.subject} subject={sp.subject} score={Math.round(sp.avgScore)} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCurrentPage('quiz-setup')}
            className="btn-neon gap-1.5 text-xs px-3 py-2 flex-1 btn-shimmer-hover"
          >
            <Brain className="w-3.5 h-3.5" />
            Practice Quiz
          </Button>
          <Button
            size="sm"
            onClick={() => setCurrentPage('notes')}
            className="gap-1.5 text-xs px-3 py-2 flex-1 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Review Notes
          </Button>
          <Button
            size="sm"
            onClick={() => setCurrentPage('subjects')}
            className="gap-1.5 text-xs px-3 py-2 flex-1 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study Now
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
