'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  BarChart3,
  Clock,
  Brain,
  FileText,
  TrendingUp,
  TrendingDown,
  Flame,
  Download,
  Trophy,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { exportToCSV } from '@/lib/export'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

// --- Types ---
interface MetricValue {
  current: number
  previous: number
  change: number
}

interface ReportsData {
  period: string
  metrics: {
    studyTime: MetricValue
    quizzesTaken: MetricValue
    avgScore: MetricValue
    notesCreated: MetricValue
    streak: MetricValue
  }
  trendData: { date: string; studyTime: number }[]
  subjectPerformance: { subject: string; avgScore: number; totalQuizzes: number }[]
  achievementSummary: {
    totalNotes: number
    totalQuizzes: number
    perfectQuizzes: number
    subjectsExplored: number
    avgScore: number
  }
}

// --- Skeleton ---
function ReportsSkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto relative z-10">
        <Skeleton className="h-4 w-16 mb-3 bg-white/5" />
        <Skeleton className="h-8 w-48 mb-2 bg-white/5" />
        <Skeleton className="h-4 w-72 bg-white/5" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-80 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
        </div>
        <Skeleton className="h-64 rounded-xl bg-white/5" />
      </div>
    </div>
  )
}

// --- Change Indicator ---
function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Minus className="w-3 h-3" />
        No change
      </span>
    )
  }
  const isPositive = change > 0
  return (
    <span
      className={`flex items-center gap-1 text-[10px] font-medium ${
        isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {isPositive ? '+' : ''}
      {change}%
    </span>
  )
}

// --- Custom Tooltip ---
function StudyTimeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-sm border border-white/10">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="text-xs font-semibold text-[#00f0ff]">
        {payload[0].value} min
      </p>
    </div>
  )
}

function SubjectTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { subject: string; avgScore: number; totalQuizzes: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-sm border border-white/10">
      <p className="font-semibold text-foreground">{d.subject}</p>
      <p className="text-xs neon-text-cyan">{d.avgScore}% avg</p>
      <p className="text-xs text-muted-foreground">{d.totalQuizzes} quizzes</p>
    </div>
  )
}

// --- Main Component ---
export default function ProgressReports() {
  const { setCurrentPage } = useStore()
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await authFetch(`/api/reports?period=${period}`)
        if (res.ok) {
          const json = await res.json()
          setData(json as ReportsData)
        } else {
          setError('Failed to load reports')
        }
      } catch {
        setError('Network error')
      }
      setLoading(false)
    }
    fetchReports()
  }, [period])

  const handleDownloadCSV = () => {
    if (!data) return

    // Build CSV data
    const rows: Record<string, unknown>[] = []

    // Metrics summary
    rows.push({
      Metric: 'Study Time (min)',
      'Current Period': data.metrics.studyTime.current,
      'Previous Period': data.metrics.studyTime.previous,
      'Change (%)': data.metrics.studyTime.change,
    })
    rows.push({
      Metric: 'Quizzes Taken',
      'Current Period': data.metrics.quizzesTaken.current,
      'Previous Period': data.metrics.quizzesTaken.previous,
      'Change (%)': data.metrics.quizzesTaken.change,
    })
    rows.push({
      Metric: 'Average Score (%)',
      'Current Period': data.metrics.avgScore.current,
      'Previous Period': data.metrics.avgScore.previous,
      'Change (%)': data.metrics.avgScore.change,
    })
    rows.push({
      Metric: 'Notes Created',
      'Current Period': data.metrics.notesCreated.current,
      'Previous Period': data.metrics.notesCreated.previous,
      'Change (%)': data.metrics.notesCreated.change,
    })
    rows.push({
      Metric: 'Streak (days)',
      'Current Period': data.metrics.streak.current,
      'Previous Period': data.metrics.streak.previous,
      'Change (%)': data.metrics.streak.change,
    })

    // Empty row separator
    rows.push({ Metric: '', 'Current Period': '', 'Previous Period': '', 'Change (%)': '' })

    // Subject performance
    rows.push({ Metric: '--- Subject Performance ---', 'Current Period': '', 'Previous Period': '', 'Change (%)': '' })
    for (const sp of data.subjectPerformance) {
      rows.push({
        Metric: sp.subject,
        'Current Period': `${sp.avgScore}% avg score`,
        'Previous Period': `${sp.totalQuizzes} quizzes`,
        'Change (%)': '',
      })
    }

    // Study time trend
    rows.push({ Metric: '', 'Current Period': '', 'Previous Period': '', 'Change (%)': '' })
    rows.push({ Metric: '--- Daily Study Time Trend ---', 'Current Period': '', 'Previous Period': '', 'Change (%)': '' })
    for (const td of data.trendData) {
      rows.push({
        Metric: td.date,
        'Current Period': `${td.studyTime} min`,
        'Previous Period': '',
        'Change (%)': '',
      })
    }

    exportToCSV(rows, `icseasy-progress-report-${period}-${new Date().toISOString().split('T')[0]}`)
  }

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (loading) return <ReportsSkeleton />

  const isEmpty = !data || (
    data.metrics.studyTime.current === 0 &&
    data.metrics.quizzesTaken.current === 0 &&
    data.metrics.notesCreated.current === 0
  )

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#00f0ff] transition-colors mb-4 group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a855f7]/20 to-[#ec4899]/20 border border-[#a855f7]/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#a855f7]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Progress Reports</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Comprehensive view of your learning progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Period Toggle */}
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    period === 'weekly'
                      ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    period === 'monthly'
                      ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
              </div>
              {/* Download */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownloadCSV}
                disabled={isEmpty}
                className={`btn-neon px-4 py-2 rounded-lg flex items-center gap-2 text-xs ${isEmpty ? 'opacity-40' : ''}`}
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </motion.button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 mb-6 border border-red-500/20"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {isEmpty && !error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-12 text-center"
          >
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#a855f7]/10 to-[#00f0ff]/10 border border-[#a855f7]/20 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-[#a855f7]" />
              </div>
              <div className="absolute inset-0 rounded-full border border-dashed border-[#00f0ff]/15 orbital-ring" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Start studying, take quizzes, and create notes to see your progress reports here. Keep up the great work!
            </p>
          </motion.div>
        ) : (
          data && (
            <>
              {/* Key Metrics */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                  {
                    icon: Clock,
                    label: 'Study Time',
                    value: formatStudyTime(data.metrics.studyTime.current),
                    change: data.metrics.studyTime.change,
                    color: '#00f0ff',
                  },
                  {
                    icon: Brain,
                    label: 'Quizzes Taken',
                    value: data.metrics.quizzesTaken.current,
                    change: data.metrics.quizzesTaken.change,
                    color: '#ec4899',
                  },
                  {
                    icon: TrendingUp,
                    label: 'Avg Score',
                    value: `${data.metrics.avgScore.current}%`,
                    change: data.metrics.avgScore.change,
                    color: '#a855f7',
                  },
                  {
                    icon: FileText,
                    label: 'Notes Created',
                    value: data.metrics.notesCreated.current,
                    change: data.metrics.notesCreated.change,
                    color: '#f59e0b',
                  },
                  {
                    icon: Flame,
                    label: 'Streak',
                    value: `${data.metrics.streak.current} days`,
                    change: data.metrics.streak.change,
                    color: '#22c55e',
                  },
                ].map((metric) => {
                  const Icon = metric.icon
                  return (
                    <div key={metric.label} className="glass rounded-xl p-4 card-glow">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${metric.color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: metric.color }} />
                        </div>
                        <ChangeIndicator change={metric.change} />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold" style={{ color: metric.color }}>
                        {metric.value}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                    </div>
                  )
                })}
              </motion.div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Study Time Trend */}
                <motion.div variants={itemVariants} className="glass rounded-xl p-5 sm:p-6 card-glow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/15 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-[#00f0ff]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Study Time Trend</h2>
                        <p className="text-xs text-muted-foreground">
                          Daily focus minutes this {period === 'weekly' ? 'week' : 'month'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-[280px] w-full">
                    {data.trendData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="reportTimeGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            unit="m"
                          />
                          <Tooltip content={<StudyTimeTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="studyTime"
                            stroke="#00f0ff"
                            strokeWidth={2}
                            fill="url(#reportTimeGradient)"
                            dot={{ fill: '#00f0ff', strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, fill: '#00f0ff', strokeWidth: 2, stroke: '#0a0a0f' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Not enough data yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Subject Performance */}
                <motion.div variants={itemVariants} className="glass rounded-xl p-5 sm:p-6 card-glow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#a855f7]/15 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-[#a855f7]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Subject Performance</h2>
                        <p className="text-xs text-muted-foreground">Average score per subject (all time)</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-[280px] w-full">
                    {data.subjectPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.subjectPerformance}
                          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                          barCategoryGap="20%"
                        >
                          <defs>
                            <linearGradient id="reportBarGradient" x1="0" y1="0" x2="0" y2="1">
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
                            unit="%"
                          />
                          <Tooltip content={<SubjectTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="avgScore" fill="url(#reportBarGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No quiz data yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Achievement Progress Summary */}
              <motion.div variants={itemVariants} className="glass rounded-xl p-5 sm:p-6 card-glow">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Achievement Progress</h2>
                    <p className="text-xs text-muted-foreground">Overall milestones summary</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Notes', value: data.achievementSummary.totalNotes, target: 25, color: '#a855f7' },
                    { label: 'Total Quizzes', value: data.achievementSummary.totalQuizzes, target: 25, color: '#ec4899' },
                    { label: 'Perfect Quizzes', value: data.achievementSummary.perfectQuizzes, target: 10, color: '#22c55e' },
                    { label: 'Subjects Explored', value: data.achievementSummary.subjectsExplored, target: 5, color: '#00f0ff' },
                    { label: 'Avg Score', value: data.achievementSummary.avgScore, target: 90, color: '#f59e0b' },
                  ].map((item) => {
                    const pct = Math.min(100, Math.round((item.value / item.target) * 100))
                    return (
                      <div key={item.label} className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          {/* Progress ring */}
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                            <circle
                              cx="32" cy="32" r="28" fill="none"
                              stroke={item.color}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${(pct / 100) * 176} 176`}
                              style={{ transition: 'stroke-dasharray 1s ease-out' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold" style={{ color: item.color }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        <p className="text-[9px] text-muted-foreground/50 mt-0.5">Goal: {item.target}</p>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )
        )}
      </motion.div>
    </div>
  )
}
