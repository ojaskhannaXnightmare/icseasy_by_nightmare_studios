'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Brain,
  TrendingUp,
  Bot,
  BookOpen,
  Search,
  Pencil,
  Clock,
  Atom,
  FlaskConical,
  Calculator,
  Globe,
  Leaf,
  Landmark,
  Monitor,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/store/useStore'
import DailyGoals from './DailyGoals'
import StreakWidget from '@/components/StreakWidget'
import { authFetch } from '@/lib/api'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Icon mapping for subjects from DB
const subjectIcons: Record<string, React.ElementType> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Leaf,
  English: BookOpen,
  History: Landmark,
  Geography: Globe,
  'Computer Science': Monitor,
}

// Activity type icon mapping
const activityTypeIcons: Record<string, React.ElementType> = {
  quiz: Brain,
  note: FileText,
  chat: Bot,
}

// Relative time helper (no Math.random, no Date.now in render)
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

interface WeeklyActivityItem {
  day: string
  activity: number
}

interface RecentActivityItem {
  id: string
  type: 'quiz' | 'note' | 'chat'
  text: string
  detail: string
  time: string
  color: string
}

interface SubjectItem {
  name: string
  topicsCount: number
  completedCount: number
  progress: number
  color: string
}

interface ActivityData {
  weeklyActivity: WeeklyActivityItem[]
  recentActivities: RecentActivityItem[]
  subjects: SubjectItem[]
}

const statsCards = [
  {
    key: 'notes',
    label: 'Total Notes',
    icon: FileText,
    color: '#a855f7',
    getValue: (_user: unknown, totalNotes: number) => String(totalNotes),
  },
  {
    key: 'quizzes',
    label: 'Quizzes Taken',
    icon: Brain,
    color: '#ec4899',
    getValue: (_user: unknown, _n: number, totalQuizzes: number) => String(totalQuizzes),
  },
  {
    key: 'score',
    label: 'Avg Score',
    icon: TrendingUp,
    color: '#22c55e',
    getValue: (_user: unknown, _n: number, _q: number, avgScore: number) => `${Math.round(avgScore)}%`,
  },
]

const quickActions = [
  {
    icon: Brain,
    label: 'Start Quiz',
    page: 'quiz-setup' as const,
    color: '#ec4899',
  },
  {
    icon: Bot,
    label: 'AI Tutor',
    page: 'tutor' as const,
    color: '#00f0ff',
  },
  {
    icon: Pencil,
    label: 'Take Notes',
    page: 'notes' as const,
    color: '#a855f7',
  },
  {
    icon: Search,
    label: 'Research Topic',
    page: 'research' as const,
    color: '#22c55e',
  },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-sm border border-white/10">
      <p className="text-muted-foreground">{label}</p>
      <p className="neon-text-cyan font-semibold">{payload[0].value} activities</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Welcome skeleton */}
        <div className="mb-8">
          <Skeleton className="h-4 w-40 mb-2 bg-white/5" />
          <Skeleton className="h-8 w-64 mb-2 bg-white/5" />
          <Skeleton className="h-4 w-48 bg-white/5" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        {/* Chart + Actions skeleton */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Skeleton className="lg:col-span-2 h-80 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
        </div>
        {/* Subjects skeleton */}
        <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
          ))}
        </div>
        {/* Activity skeleton */}
        <Skeleton className="h-72 rounded-xl bg-white/5" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, setCurrentPage, totalNotes, totalQuizzes, avgScore, setStats } = useStore()
  const [loading, setLoading] = useState(true)
  const [activityData, setActivityData] = useState<ActivityData | null>(null)

  useEffect(() => {
    const init = async () => {
      fetch('/api/seed').catch(() => {})
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.stats) {
            setStats(data.stats.totalNotes || 0, data.stats.totalQuizzes || 0, data.stats.avgScore || 0)
          }
        }
      } catch { /* ignore */ }
      try {
        const actRes = await authFetch('/api/dashboard/activity')
        if (actRes.ok) {
          const actData = await actRes.json()
          setActivityData(actData)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <DashboardSkeleton />

  const weeklyData = activityData?.weeklyActivity ?? [
    { day: 'Mon', activity: 0 },
    { day: 'Tue', activity: 0 },
    { day: 'Wed', activity: 0 },
    { day: 'Thu', activity: 0 },
    { day: 'Fri', activity: 0 },
    { day: 'Sat', activity: 0 },
    { day: 'Sun', activity: 0 },
  ]

  const recentActivities = activityData?.recentActivities ?? []
  const subjectsList = activityData?.subjects ?? []

  const isWeeklyEmpty = weeklyData.every((d) => d.activity === 0)

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />

      {/* Animated orbs */}
      <motion.div
        className="fixed top-20 right-[20%] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)' }}
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-20 left-[30%] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
        animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Streak Widget */}
          <div className="col-span-1">
            <StreakWidget />
          </div>
          {/* Stat Cards */}
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            const value = stat.getValue(user, totalNotes, totalQuizzes, avgScore)
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (index + 1) * 0.1 }}
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
                <div
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: stat.color }}
                >
                  {value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Chart + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 glass rounded-xl p-5 sm:p-6 card-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Weekly Activity</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your study activity this week</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                Activities
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="day"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="activity"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    fill="url(#activityGradient)"
                    dot={{ fill: '#00f0ff', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#00f0ff', strokeWidth: 2, stroke: '#0a0a0f' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {isWeeklyEmpty && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-xs text-muted-foreground mt-2"
              >
                Start studying to see your activity here
              </motion.p>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass rounded-xl p-5 sm:p-6 card-glow"
          >
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    onClick={() => setCurrentPage(action.page)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all duration-200 group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: `${action.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {action.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Daily Goals */}
        <div className="mb-8">
          <DailyGoals />
        </div>

        {/* Your Subjects - Progress Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Your Subjects</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track your progress across all subjects</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setCurrentPage('subjects')}
            >
              View All
            </Button>
          </div>
          {subjectsList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-8 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block mb-4"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#00f0ff10' }}>
                  <BookOpen className="w-8 h-8" style={{ color: '#00f0ff' }} />
                </div>
              </motion.div>
              <p className="text-sm text-muted-foreground">No subjects available yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setCurrentPage('subjects')}
              >
                Browse Subjects
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjectsList.map((subject, index) => {
                const Icon = subjectIcons[subject.name] || BookOpen
                const hasProgress = subject.progress > 0
                return (
                  <motion.div
                    key={subject.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                    className="glass rounded-xl p-4 card-glow hover:bg-white/[0.04] transition-colors cursor-pointer"
                    onClick={() => setCurrentPage('subjects')}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${subject.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: subject.color }} />
                      </div>
                      <span className="text-sm font-medium truncate">{subject.name}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/5 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.7 + index * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: subject.color,
                          boxShadow: `0 0 8px ${subject.color}40`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {hasProgress
                          ? `${subject.completedCount}/${subject.topicsCount} topics`
                          : `${subject.topicsCount} topics`}
                      </span>
                      {hasProgress ? (
                        <span className="text-[11px] font-semibold" style={{ color: subject.color }}>
                          {subject.progress}%
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold" style={{ color: subject.color }}>
                          Start
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass rounded-xl p-5 sm:p-6 card-glow"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your latest learning activities</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              View All
            </Button>
          </div>
          {recentActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-4"
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)' }} />
                  <Sparkles className="w-8 h-8 text-[#00f0ff]" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#a855f7' }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#ec4899' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  />
                </div>
              </motion.div>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                No activity yet — take a quiz or create notes to get started!
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1.5"
                  onClick={() => setCurrentPage('quiz-setup')}
                >
                  <Brain className="w-3.5 h-3.5" />
                  Take a Quiz
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1.5"
                  onClick={() => setCurrentPage('notes')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Create Notes
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activityTypeIcons[activity.type] || MessageCircle
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${activity.color}12` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: activity.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {getRelativeTime(activity.time)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
