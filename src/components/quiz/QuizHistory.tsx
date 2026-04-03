'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, History, Trophy, TrendingUp, Target,
  Filter, BookOpen, Atom, FlaskConical, Globe, Calculator,
  Code2, Languages, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'

const ICSE_SUBJECTS = [
  'All',
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
]

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  'English': <Languages className="w-4 h-4" />,
  'Mathematics': <Calculator className="w-4 h-4" />,
  'Physics': <Atom className="w-4 h-4" />,
  'Chemistry': <FlaskConical className="w-4 h-4" />,
  'Biology': <BookOpen className="w-4 h-4" />,
  'History': <History className="w-4 h-4" />,
  'Geography': <Globe className="w-4 h-4" />,
  'Computer Science': <Code2 className="w-4 h-4" />,
}

interface Attempt {
  id: string
  subject: string
  topic: string
  score: number
  totalMarks: number
  createdAt: string
}

interface HistoryStats {
  totalAttempts: number
  averageScore: number
  bestScore: number
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  const diffWeek = Math.floor(diffMs / 604800000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 4) return `${diffWeek}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getScoreColor(pct: number) {
  if (pct >= 80) return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', bar: 'bg-gradient-to-r from-green-500 to-emerald-400' }
  if (pct >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', bar: 'bg-gradient-to-r from-amber-500 to-yellow-400' }
  return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', bar: 'bg-gradient-to-r from-red-500 to-rose-400' }
}

function StatCard({ icon, label, value, color, delay }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
        ))}
      </div>
      {/* List skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#00f0ff]/10 to-[#a855f7]/10 border border-white/10 flex items-center justify-center">
          <History className="w-12 h-12 text-gray-600" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full border border-dashed border-[#00f0ff]/30"
        />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-400 mb-2">No Quiz History Yet</h3>
      <p className="text-sm text-gray-600 max-w-sm mb-6">
        Complete your first quiz to start tracking your progress and performance over time.
      </p>
      <Button
        onClick={() => useStore.getState().setCurrentPage('quiz-setup')}
        className="btn-neon-solid gap-2"
      >
        <Target className="w-4 h-4" />
        Take Your First Quiz
      </Button>
    </motion.div>
  )
}

export default function QuizHistory() {
  const { setCurrentPage } = useStore()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [stats, setStats] = useState<HistoryStats>({ totalAttempts: 0, averageScore: 0, bestScore: 0 })
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (subjectFilter !== 'All') {
        params.set('subject', subjectFilter)
      }
      const res = await authFetch(`/api/quiz/history?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAttempts(data.attempts || [])
        setStats(data.stats || { totalAttempts: 0, averageScore: 0, bestScore: 0 })
        setAvailableSubjects(data.filters?.subjects || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [subjectFilter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const subjectsToShow = availableSubjects.length > 0
    ? ICSE_SUBJECTS.filter(s => s === 'All' || availableSubjects.includes(s))
    : ICSE_SUBJECTS

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setCurrentPage('quiz-setup')}
          className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7]/20 to-[#ec4899]/10 border border-[#a855f7]/20 flex items-center justify-center">
            <History className="w-5 h-5 text-[#a855f7]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Quiz History</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your quiz performance and progress</p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : attempts.length === 0 && subjectFilter === 'All' ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Target className="w-5 h-5" style={{ color: '#00f0ff' }} />}
              label="Total Attempts"
              value={stats.totalAttempts}
              color="#00f0ff"
              delay={0}
            />
            <StatCard
              icon={<Trophy className="w-5 h-5" style={{ color: '#a855f7' }} />}
              label="Best Score"
              value={`${stats.bestScore}%`}
              color="#a855f7"
              delay={0.1}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" style={{ color: '#ec4899' }} />}
              label="Average Score"
              value={`${stats.averageScore}%`}
              color="#ec4899"
              delay={0.2}
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-48 glass bg-white/5 border-white/10 text-white h-9">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/10 bg-[#0f0f19]">
                {subjectsToShow.map(sub => (
                  <SelectItem key={sub} value={sub} className="text-gray-300 focus:bg-white/5 focus:text-white">
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subjectFilter !== 'All' && (
              <Badge variant="outline" className="border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/5">
                {attempts.length} result{attempts.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* History List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {attempts.map((attempt, index) => {
                const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0
                const colors = getScoreColor(pct)

                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                    className="glass-card rounded-xl p-4 card-glow group cursor-default"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Subject + Topic */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-gray-400">
                          {SUBJECT_ICONS[attempt.subject] || <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{attempt.subject}</p>
                            <span className="text-gray-600 hidden sm:inline">·</span>
                            <p className="text-xs text-gray-500 truncate hidden sm:block">{attempt.topic}</p>
                          </div>
                          <p className="text-xs text-gray-500 truncate sm:hidden">{attempt.topic}</p>
                        </div>
                      </div>

                      {/* Score + Bar */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 min-w-0 sm:w-48">
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: index * 0.04 + 0.2, duration: 0.6, ease: 'easeOut' }}
                                className={`h-full rounded-full ${colors.bar}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Score Badge */}
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${colors.bg} ${colors.border} border ${colors.text} shrink-0`}>
                          {pct}%
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1 text-gray-600 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{getRelativeTime(attempt.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score detail */}
                    <div className="mt-2 ml-12">
                      <p className="text-xs text-gray-600">
                        Scored <span className={colors.text}>{attempt.score}</span> out of <span className="text-gray-500">{attempt.totalMarks}</span> marks
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Empty for filtered */}
            {attempts.length === 0 && subjectFilter !== 'All' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Filter className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-500 text-sm">No quiz attempts found for <span className="text-white font-medium">{subjectFilter}</span></p>
                <Button
                  variant="ghost"
                  onClick={() => setSubjectFilter('All')}
                  className="mt-3 text-[#00f0ff] hover:text-[#00f0ff]/80"
                >
                  Clear filter
                </Button>
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
