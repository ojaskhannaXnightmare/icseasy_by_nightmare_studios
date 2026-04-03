'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  ChevronRight,
  Brain,
  FileText,
  TrendingUp,
  Flame,
  Calendar,
  Sparkles,
  Trophy,
  BookOpen,
  Target,
  Zap,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

// --- Types ---
interface AnalyticsData {
  totalStudyTime: number
  subjectPerformance: { subject: string; avgScore: number; totalQuizzes: number }[]
  scoreDistribution: Record<string, number>
  notesPerSubject: { subject: string; count: number }[]
  mostActiveDay: string
  monthlyTrend: { month: string; notes: number; quizzes: number }[]
  totalNotes: number
  totalQuizzes: number
  avgScore: number
}

// --- Pre-computed fallback data (no Math.random) ---
const fallbackData: AnalyticsData = {
  totalStudyTime: 485,
  subjectPerformance: [
    { subject: 'Mathematics', avgScore: 82.5, totalQuizzes: 8 },
    { subject: 'Physics', avgScore: 74.3, totalQuizzes: 6 },
    { subject: 'Chemistry', avgScore: 68.9, totalQuizzes: 5 },
    { subject: 'Biology', avgScore: 85.1, totalQuizzes: 7 },
    { subject: 'English', avgScore: 91.2, totalQuizzes: 4 },
    { subject: 'History', avgScore: 77.8, totalQuizzes: 3 },
  ],
  scoreDistribution: { '0-40%': 2, '41-60%': 3, '61-80%': 8, '81-100%': 12 },
  notesPerSubject: [
    { subject: 'Mathematics', count: 12 },
    { subject: 'Physics', count: 8 },
    { subject: 'Chemistry', count: 6 },
    { subject: 'Biology', count: 9 },
    { subject: 'English', count: 5 },
    { subject: 'History', count: 4 },
  ],
  mostActiveDay: 'Wednesday',
  monthlyTrend: [
    { month: 'Oct', notes: 8, quizzes: 5 },
    { month: 'Nov', notes: 12, quizzes: 8 },
    { month: 'Dec', notes: 6, quizzes: 4 },
    { month: 'Jan', notes: 15, quizzes: 10 },
    { month: 'Feb', notes: 11, quizzes: 7 },
    { month: 'Mar', notes: 14, quizzes: 9 },
  ],
  totalNotes: 44,
  totalQuizzes: 25,
  avgScore: 79.8,
}

// --- Score distribution config ---
const scoreRanges = [
  { key: '0-40%', label: '0 – 40%', color: '#ef4444', gradient: 'from-red-500/20 to-red-500/5' },
  { key: '41-60%', label: '41 – 60%', color: '#f59e0b', gradient: 'from-amber-500/20 to-amber-500/5' },
  { key: '61-80%', label: '61 – 80%', color: '#a855f7', gradient: 'from-purple-500/20 to-purple-500/5' },
  { key: '81-100%', label: '81 – 100%', color: '#00f0ff', gradient: 'from-cyan-500/20 to-cyan-500/5' },
]

// --- Insight generators ---
function generateInsights(data: AnalyticsData) {
  const insights: { icon: React.ElementType; text: string; color: string }[] = []

  // Best subject
  if (data.subjectPerformance.length > 0) {
    const best = data.subjectPerformance.reduce((a, b) => (a.avgScore > b.avgScore ? a : b))
    insights.push({
      icon: Trophy,
      text: `Your best subject is ${best.subject} with an average of ${best.avgScore}%`,
      color: '#f59e0b',
    })
  }

  // Total study time
  const hours = Math.floor(data.totalStudyTime / 60)
  const mins = data.totalStudyTime % 60
  insights.push({
    icon: Flame,
    text: `You've spent ${hours}h ${mins}m studying across all activities`,
    color: '#ec4899',
  })

  // High score rate
  const totalQuizzes = Object.values(data.scoreDistribution).reduce((a, b) => a + b, 0)
  if (totalQuizzes > 0) {
    const highScoreRate = Math.round(((data.scoreDistribution['81-100%'] || 0) / totalQuizzes) * 100)
    insights.push({
      icon: Target,
      text: `${highScoreRate}% of your quizzes scored above 80%`,
      color: '#22c55e',
    })
  }

  // Most active day
  insights.push({
    icon: Calendar,
    text: `${data.mostActiveDay} is your most productive study day`,
    color: '#00f0ff',
  })

  // Notes count
  if (data.totalNotes > 0) {
    insights.push({
      icon: BookOpen,
      text: `You've created ${data.totalNotes} notes to reinforce your learning`,
      color: '#a855f7',
    })
  }

  return insights.slice(0, 4)
}

// --- Custom Tooltip for BarChart ---
function SubjectTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { subject: string; avgScore: number; totalQuizzes: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-sm border border-white/10">
      <p className="font-semibold text-foreground">{d.subject}</p>
      <p className="neon-text-cyan text-xs">{d.avgScore}% avg score</p>
      <p className="text-xs text-muted-foreground">{d.totalQuizzes} quizzes taken</p>
    </div>
  )
}

// --- Custom Tooltip for AreaChart ---
function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-sm border border-white/10">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="text-xs font-semibold"
          style={{ color: p.dataKey === 'notes' ? '#a855f7' : '#00f0ff' }}
        >
          {p.dataKey === 'notes' ? 'Notes' : 'Quizzes'}: {p.value}
        </p>
      ))}
    </div>
  )
}

// --- Skeleton ---
function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-4 w-16 mb-3 bg-white/5" />
          <Skeleton className="h-8 w-40 mb-2 bg-white/5" />
          <Skeleton className="h-4 w-64 bg-white/5" />
        </div>
        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-80 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
        </div>
        {/* Bottom row skeleton */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Skeleton className="lg:col-span-2 h-72 rounded-xl bg-white/5" />
          <Skeleton className="h-72 rounded-xl bg-white/5" />
        </div>
        {/* Insights skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---
export default function AnalyticsPage() {
  const { user, setCurrentPage, streak } = useStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await authFetch('/api/analytics')
        if (res.ok) {
          const json = await res.json()
          if (json.stats) {
            setData(json.stats as AnalyticsData)
          }
        }
      } catch {
        // Fall back to sample data on error
      }
      // Use fallback if no data
      setData((prev) => prev ?? fallbackData)
      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  if (loading) return <AnalyticsSkeleton />

  const analytics = data ?? fallbackData
  const insights = generateInsights(analytics)
  const totalDist = Object.values(analytics.scoreDistribution).reduce((a, b) => a + b, 0)
  const studyHours = Math.floor(analytics.totalStudyTime / 60)
  const studyMins = analytics.totalStudyTime % 60

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back button + Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#00f0ff] transition-colors mb-4 group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#a855f7]/20 border border-[#00f0ff]/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#00f0ff]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track your learning progress and performance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overview Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Brain,
              label: 'Total Quizzes',
              value: analytics.totalQuizzes,
              color: '#ec4899',
              suffix: '',
            },
            {
              icon: FileText,
              label: 'Total Notes',
              value: analytics.totalNotes,
              color: '#a855f7',
              suffix: '',
            },
            {
              icon: TrendingUp,
              label: 'Avg Score',
              value: analytics.avgScore,
              color: '#00f0ff',
              suffix: '%',
            },
            {
              icon: Flame,
              label: 'Study Streak',
              value: user?.streak ?? streak,
              color: '#f59e0b',
              suffix: ' days',
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="glass rounded-xl p-4 sm:p-5 card-glow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: stat.color }}>
                  {stat.value}{stat.suffix}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Charts Row: Subject Performance + Score Distribution */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Performance Bar Chart */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-xl p-5 sm:p-6 card-glow"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#a855f7]/15 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#a855f7]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Subject Performance</h2>
                <p className="text-xs text-muted-foreground">Average quiz score per subject</p>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.subjectPerformance}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  barCategoryGap="20%"
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="subject"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<SubjectTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="avgScore" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Score Distribution */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-xl p-5 sm:p-6 card-glow"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#00f0ff]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Score Distribution</h2>
                <p className="text-xs text-muted-foreground">How your quiz scores are spread</p>
              </div>
            </div>
            <div className="space-y-5">
              {scoreRanges.map((range) => {
                const count = analytics.scoreDistribution[range.key] || 0
                const pct = totalDist > 0 ? (count / totalDist) * 100 : 0
                return (
                  <div key={range.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">{range.label}</span>
                      <span className="text-sm font-bold" style={{ color: range.color }}>
                        {count} {totalDist > 0 ? `(${Math.round(pct)}%)` : ''}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: range.color,
                          boxShadow: `0 0 10px ${range.color}40`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Monthly Activity Trend + Most Active Day */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Activity Area Chart */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 glass rounded-xl p-5 sm:p-6 card-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ec4899]/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#ec4899]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Monthly Activity</h2>
                  <p className="text-xs text-muted-foreground">Notes & quizzes over last 6 months</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                  Notes
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]" />
                  Quizzes
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="notesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="quizzesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="notes"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#notesGradient)"
                    dot={{ fill: '#a855f7', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#a855f7', strokeWidth: 2, stroke: '#0a0a0f' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quizzes"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    fill="url(#quizzesGradient)"
                    dot={{ fill: '#00f0ff', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#00f0ff', strokeWidth: 2, stroke: '#0a0a0f' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Most Active Day + Study Time */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Most Active Day */}
            <div className="glass rounded-xl p-5 card-glow">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#22c55e]" />
                </div>
                <h2 className="text-base font-semibold">Most Active Day</h2>
              </div>
              <div className="text-center py-3">
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, type: 'spring' }}
                  className="text-2xl font-bold neon-text-cyan"
                >
                  {analytics.mostActiveDay}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">Your peak study day</p>
              </div>
              {/* Day badges */}
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isActive = analytics.mostActiveDay.startsWith(day)
                  return (
                    <span
                      key={day}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#00f0ff]/15 text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                          : 'bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {day}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Study Time Card */}
            <div className="glass rounded-xl p-5 card-glow">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <h2 className="text-base font-semibold">Total Study Time</h2>
              </div>
              <div className="text-center py-2">
                <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
                  {studyHours}<span className="text-lg font-normal text-muted-foreground ml-1">h</span>
                  {studyMins > 0 && (
                    <>
                      <span className="mx-1 text-muted-foreground/40">:</span>
                      {String(studyMins).padStart(2, '0')}
                      <span className="text-lg font-normal text-muted-foreground ml-1">m</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Estimated across all activities
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Insights */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Quick Insights</h2>
              <p className="text-xs text-muted-foreground">Personalized observations from your data</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass rounded-xl p-4 card-glow flex items-start gap-3.5"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${insight.color}12` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: insight.color }} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
