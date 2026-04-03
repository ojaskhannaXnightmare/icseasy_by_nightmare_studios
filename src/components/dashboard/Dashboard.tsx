'use client'

import { motion } from 'framer-motion'
import {
  Flame,
  FileText,
  Brain,
  TrendingUp,
  Bot,
  BookOpen,
  Search,
  Pencil,
  Clock,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Pre-computed weekly activity data (no random)
const weeklyData = [
  { day: 'Mon', activity: 4 },
  { day: 'Tue', activity: 7 },
  { day: 'Wed', activity: 5 },
  { day: 'Thu', activity: 9 },
  { day: 'Fri', activity: 6 },
  { day: 'Sat', activity: 12 },
  { day: 'Sun', activity: 8 },
]

// Pre-computed recent activities
const recentActivities = [
  {
    id: '1',
    icon: Brain,
    text: 'Completed Physics Quiz',
    detail: 'Score: 85%',
    time: '2 hours ago',
    color: '#00f0ff',
  },
  {
    id: '2',
    icon: FileText,
    text: 'Generated Notes: Algebra',
    detail: 'Mathematics',
    time: '5 hours ago',
    color: '#a855f7',
  },
  {
    id: '3',
    icon: Bot,
    text: 'AI Tutor Session',
    detail: 'Biology - Cell Structure',
    time: 'Yesterday',
    color: '#ec4899',
  },
  {
    id: '4',
    icon: Trophy,
    text: 'Achievement Unlocked',
    detail: '7-day Study Streak',
    time: 'Yesterday',
    color: '#22c55e',
  },
  {
    id: '5',
    icon: Search,
    text: 'Researched: World War II',
    detail: 'History',
    time: '2 days ago',
    color: '#f59e0b',
  },
]

const statsCards = [
  {
    key: 'streak',
    label: 'Day Streak',
    icon: Flame,
    color: '#f59e0b',
    getValue: () => '7',
  },
  {
    key: 'notes',
    label: 'Total Notes',
    icon: FileText,
    color: '#a855f7',
    getValue: () => '23',
  },
  {
    key: 'quizzes',
    label: 'Quizzes Taken',
    icon: Brain,
    color: '#ec4899',
    getValue: () => '15',
  },
  {
    key: 'score',
    label: 'Avg Score',
    icon: TrendingUp,
    color: '#22c55e',
    getValue: () => '82%',
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

export default function Dashboard() {
  const { user, setCurrentPage, totalNotes, totalQuizzes, avgScore } = useStore()

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />

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
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            const value = stat.getValue()
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
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
          <div className="space-y-3">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon
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
                  <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
