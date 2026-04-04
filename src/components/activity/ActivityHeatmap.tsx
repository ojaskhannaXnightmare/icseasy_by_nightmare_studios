'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Activity,
  Flame,
  Trophy,
  Calendar,
  Sparkles,
  Brain,
  FileText,
  Timer,
  Zap,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'

// --- Types ---
interface DayActivity {
  date: string
  quizzes: number
  notes: number
  sessions: number
  total: number
}

interface ActivityStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  busiestDay: { date: string; total: number }
}

interface ActivityData {
  activity: DayActivity[]
  stats: ActivityStats
}

type FilterType = 'all' | 'quizzes' | 'notes' | 'sessions'

// --- Tooltip ---
function HeatmapTooltip({
  day,
  position,
}: {
  day: DayActivity | null
  position: { x: number; y: number }
}) {
  if (!day) return null

  const dateObj = new Date(day.date + 'T00:00:00')
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-white/10 shadow-xl min-w-[160px]">
        <p className="font-semibold text-foreground mb-1.5">{formattedDate}</p>
        {day.total === 0 ? (
          <p className="text-muted-foreground">No activity</p>
        ) : (
          <div className="space-y-0.5">
            {day.quizzes > 0 && (
              <p className="text-[#00f0ff]">
                <Brain className="w-3 h-3 inline mr-1" />
                {day.quizzes} quiz{day.quizzes > 1 ? 'zes' : ''}
              </p>
            )}
            {day.notes > 0 && (
              <p className="text-[#a855f7]">
                <FileText className="w-3 h-3 inline mr-1" />
                {day.notes} note{day.notes > 1 ? 's' : ''}
              </p>
            )}
            {day.sessions > 0 && (
              <p className="text-[#22c55e]">
                <Timer className="w-3 h-3 inline mr-1" />
                {day.sessions} session{day.sessions > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Heatmap Cell ---
function HeatmapCell({
  day,
  filter,
  onHover,
  onLeave,
}: {
  day: DayActivity
  filter: FilterType
  onHover: (day: DayActivity, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const value = useMemo(() => {
    switch (filter) {
      case 'quizzes': return day.quizzes
      case 'notes': return day.notes
      case 'sessions': return day.sessions
      default: return day.total
    }
  }, [day, filter])

  const colorClass = useMemo(() => {
    if (value === 0) return 'bg-white/[0.04] hover:bg-white/[0.08]'
    if (value <= 2) return 'bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 shadow-[0_0_4px_rgba(0,240,255,0.1)]'
    if (value <= 5) return 'bg-[#00f0ff]/35 hover:bg-[#00f0ff]/50 shadow-[0_0_6px_rgba(0,240,255,0.2)]'
    if (value <= 8) return 'bg-[#a855f7]/45 hover:bg-[#a855f7]/60 shadow-[0_0_6px_rgba(168,85,247,0.25)]'
    return 'bg-[#ec4899]/60 hover:bg-[#ec4899]/80 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
  }, [value])

  return (
    <div
      className={`w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] rounded-[2px] transition-all duration-150 cursor-pointer ${colorClass}`}
      onMouseEnter={(e) => onHover(day, e)}
      onMouseLeave={onLeave}
    />
  )
}

// --- Skeleton ---
function ActivitySkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8">
          <Skeleton className="h-4 w-20 mb-3 bg-white/5" />
          <Skeleton className="h-8 w-44 mb-2 bg-white/5" />
          <Skeleton className="h-4 w-72 bg-white/5" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl bg-white/5 mb-8" />
        <Skeleton className="h-48 rounded-xl bg-white/5 mb-6" />
        <div className="h-px gradient-divider mb-6" />
        <Skeleton className="h-32 rounded-xl bg-white/5" />
      </div>
    </div>
  )
}

// --- Generate insights from activity data ---
function generateActivityInsights(data: ActivityData) {
  const { activity, stats } = data
  const insights: { icon: React.ElementType; text: string; color: string }[] = []

  // Check for empty state
  if (stats.totalDays === 0) {
    return [
      { icon: Sparkles, text: 'Start your learning journey! Take a quiz, create notes, or start a study session to see your activity here.', color: '#00f0ff' },
      { icon: Brain, text: 'Consistency is key. Try to study a little every day to build your heatmap.', color: '#a855f7' },
      { icon: Flame, text: 'Build a streak to unlock achievements and track your progress.', color: '#f59e0b' },
      { icon: Zap, text: 'Use the Study Timer to track your focus sessions and watch your heatmap glow!', color: '#22c55e' },
    ]
  }

  // Most active day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  for (const day of activity) {
    if (day.total > 0) {
      const d = new Date(day.date + 'T00:00:00').getDay()
      dayCounts[d]++
    }
  }
  const maxDayIdx = dayCounts.indexOf(Math.max(...dayCounts))
  if (dayCounts[maxDayIdx] > 0) {
    insights.push({
      icon: Calendar,
      text: `You are most active on ${dayNames[maxDayIdx]}s with ${dayCounts[maxDayIdx]} active days`,
      color: '#00f0ff',
    })
  }

  // Streak insights
  if (stats.currentStreak >= 7) {
    insights.push({
      icon: Flame,
      text: `Amazing ${stats.currentStreak}-day streak! Keep the momentum going!`,
      color: '#f59e0b',
    })
  } else if (stats.currentStreak >= 3) {
    insights.push({
      icon: Flame,
      text: `${stats.currentStreak}-day streak and counting. You are building great habits!`,
      color: '#f59e0b',
    })
  } else if (stats.currentStreak > 0) {
    insights.push({
      icon: Flame,
      text: `${stats.currentStreak}-day streak. Study today to keep it alive!`,
      color: '#f59e0b',
    })
  }

  // Busiest day
  if (stats.busiestDay.total > 0) {
    const bd = new Date(stats.busiestDay.date + 'T00:00:00')
    const bdFormatted = bd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    insights.push({
      icon: Trophy,
      text: `Your busiest day was ${bdFormatted} with ${stats.busiestDay.total} activities`,
      color: '#ec4899',
    })
  }

  // Activity breakdown
  const totalQuizzes = activity.reduce((s, d) => s + d.quizzes, 0)
  const totalNotes = activity.reduce((s, d) => s + d.notes, 0)
  const totalSessions = activity.reduce((s, d) => s + d.sessions, 0)

  if (totalQuizzes > totalNotes && totalQuizzes > totalSessions) {
    insights.push({
      icon: Brain,
      text: `You are a quiz champion! ${totalQuizzes} quizzes taken in the last 6 months`,
      color: '#00f0ff',
    })
  } else if (totalNotes > totalQuizzes && totalNotes > totalSessions) {
    insights.push({
      icon: FileText,
      text: `Great note-taking! ${totalNotes} notes created in the last 6 months`,
      color: '#a855f7',
    })
  } else if (totalSessions > 0) {
    insights.push({
      icon: Timer,
      text: `${totalSessions} focus sessions completed. Dedication pays off!`,
      color: '#22c55e',
    })
  }

  // Longest streak
  if (stats.longestStreak > stats.currentStreak && stats.longestStreak >= 3) {
    insights.push({
      icon: Trophy,
      text: `Your longest streak was ${stats.longestStreak} days. You can beat it!`,
      color: '#ec4899',
    })
  }

  return insights.slice(0, 4)
}

// --- Main Component ---
export default function ActivityHeatmap() {
  const { setCurrentPage } = useStore()
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [tooltip, setTooltip] = useState<{
    day: DayActivity
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch('/api/activity')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleHover = useCallback((day: DayActivity, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltip({
      day,
      position: {
        x: rect.left + rect.width / 2 - 80,
        y: rect.top - 10,
      },
    })
  }, [])

  const handleLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // Build the 7×N grid of weeks
  const weeks = useMemo(() => {
    if (!data) return []

    const activityData = data.activity
    if (activityData.length === 0) return []

    // Find the Sunday before the first date
    const firstDate = new Date(activityData[0].date + 'T00:00:00')
    const startDow = firstDate.getDay() // 0=Sun
    const gridStart = new Date(firstDate)
    gridStart.setDate(gridStart.getDate() - startDow)

    // Build grid: array of weeks, each week is 7 days (Sun-Sat)
    const result: (DayActivity | null)[][] = []
    let currentWeek: (DayActivity | null)[] = []

    // Fill leading empty cells for the first week
    for (let i = 0; i < startDow; i++) {
      currentWeek.push(null)
    }

    const activityMap = new Map<string, DayActivity>()
    for (const d of activityData) {
      activityMap.set(d.date, d)
    }

    // Fill in days
    const endDate = activityData[activityData.length - 1].date
    let cursor = new Date(gridStart)
    while (cursor.toISOString().split('T')[0] <= endDate) {
      const ds = cursor.toISOString().split('T')[0]
      currentWeek.push(activityMap.get(ds) || null)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    // Fill trailing empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      result.push(currentWeek)
    }

    return result
  }, [data])

  // Month labels positioned at the top
  const monthLabels = useMemo(() => {
    if (weeks.length === 0) return []

    const labels: { label: string; colIndex: number }[] = []
    let lastMonth = -1

    for (let col = 0; col < weeks.length; col++) {
      // Find the first non-null day in this week column
      const week = weeks[col]
      for (let row = 0; row < 7; row++) {
        const day = week[row]
        if (day) {
          const month = new Date(day.date + 'T00:00:00').getMonth()
          if (month !== lastMonth) {
            labels.push({
              label: new Date(day.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }),
              colIndex: col,
            })
            lastMonth = month
          }
          break
        }
      }
    }

    return labels
  }, [weeks])

  // Day labels (Mon, Wed, Fri)
  const dayLabels = useMemo(() => ['Mon', '', 'Wed', '', 'Fri', '', ''] as const, [])

  const insights = useMemo(() => {
    if (!data) return []
    return generateActivityInsights(data)
  }, [data])

  const stats = data?.stats ?? { totalDays: 0, currentStreak: 0, longestStreak: 0, busiestDay: { date: '', total: 0 } }
  const isEmpty = !data || stats.totalDays === 0

  // Format busiest day for display
  const busiestDayDisplay = useMemo(() => {
    if (!stats.busiestDay || stats.busiestDay.total === 0) return 'N/A'
    const bd = new Date(stats.busiestDay.date + 'T00:00:00')
    return bd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }, [stats.busiestDay])

  if (loading) return <ActivitySkeleton />

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

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'notes', label: 'Notes' },
    { key: 'sessions', label: 'Sessions' },
  ]

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-20 right-20 w-80 h-80 bg-[#00f0ff]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-1/3 w-80 h-80 bg-[#a855f7]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Tooltip */}
      {tooltip && <HeatmapTooltip day={tooltip.day} position={tooltip.position} />}

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
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#00f0ff] transition-colors mb-4 group btn-shimmer-hover"
          >
            <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#ec4899]/20 border border-[#00f0ff]/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#00f0ff]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Study Activity</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your daily learning heatmap over the past 6 months
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Calendar,
              label: 'Active Days',
              value: stats.totalDays,
              color: '#00f0ff',
              suffix: '',
            },
            {
              icon: Flame,
              label: 'Current Streak',
              value: stats.currentStreak,
              color: '#f59e0b',
              suffix: ' days',
            },
            {
              icon: Trophy,
              label: 'Longest Streak',
              value: stats.longestStreak,
              color: '#a855f7',
              suffix: ' days',
            },
            {
              icon: Zap,
              label: 'Busiest Day',
              value: busiestDayDisplay,
              color: '#ec4899',
              suffix: stats.busiestDay?.total > 0 ? ` (${stats.busiestDay.total})` : '',
              isText: true,
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="glass-card rounded-xl p-4 sm:p-5 stat-card-lift card-glow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                {stat.isText ? (
                  <div className="text-lg sm:text-xl font-bold" style={{ color: stat.color }}>
                    {String(stat.value)}{stat.suffix}
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: stat.color }}>
                    {Number(stat.value)}{stat.suffix}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Heatmap Section */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl p-5 sm:p-6 card-glow mb-8">
          {/* Filter Tabs + Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`tab-animated px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filter === opt.key
                      ? 'bg-[#00f0ff]/15 text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                  data-active={filter === opt.key ? 'true' : 'false'}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-[11px] h-[11px] rounded-[2px] bg-white/[0.04]" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-[#00f0ff]/15" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-[#00f0ff]/35" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-[#a855f7]/45" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-[#ec4899]/60" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Month labels */}
          {monthLabels.length > 0 && (
            <div className="flex ml-[28px] sm:ml-[36px] mb-1">
              {monthLabels.map((ml, i) => {
                // Calculate offset based on column index
                const prevColIndex = i > 0 ? monthLabels[i - 1].colIndex : -1
                const colSpan = ml.colIndex - prevColIndex
                return (
                  <div
                    key={`${ml.label}-${i}`}
                    className="text-[10px] text-muted-foreground font-medium shrink-0"
                    style={{ width: `${colSpan * 17}px` }}
                  >
                    {ml.label}
                  </div>
                )
              })}
            </div>
          )}

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex gap-[3px] min-w-max">
              {/* Day labels column */}
              <div className="flex flex-col gap-[3px] mr-1">
                {dayLabels.map((label, row) => (
                  <div
                    key={row}
                    className="w-[22px] sm:w-[30px] h-[11px] sm:h-[13px] flex items-center justify-end text-[9px] sm:text-[10px] text-muted-foreground/50 font-medium"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, rowIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`${colIdx}-${rowIdx}`}
                          className="w-[11px] h-[11px] sm:w-[13px] sm:h-[13px]"
                        />
                      )
                    }
                    return (
                      <HeatmapCell
                        key={day.date}
                        day={day}
                        filter={filter}
                        onHover={handleHover}
                        onLeave={handleLeave}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Empty state message */}
          {isEmpty && (
            <div className="text-center py-6 mt-4">
              <div className="w-16 h-16 rounded-full bg-[#00f0ff]/5 flex items-center justify-center mx-auto mb-4 orbital-enhanced">
                <Activity className="w-8 h-8 text-[#00f0ff]/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No activity yet
              </p>
              <p className="text-xs text-muted-foreground/60">
                Start studying to build your heatmap! Take quizzes, create notes, or use the study timer.
              </p>
            </div>
          )}
        </motion.div>

        {/* Activity Type Breakdown */}
        {!isEmpty && (
          <>
            <div className="gradient-divider my-4" />
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#a855f7]/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Activity Breakdown</h2>
                  <p className="text-xs text-muted-foreground">What you have been doing over the past 6 months</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: Brain,
                    label: 'Quizzes Taken',
                    value: data.activity.reduce((s, d) => s + d.quizzes, 0),
                    color: '#00f0ff',
                    bg: 'from-[#00f0ff]/10 to-[#00f0ff]/5',
                  },
                  {
                    icon: FileText,
                    label: 'Notes Created',
                    value: data.activity.reduce((s, d) => s + d.notes, 0),
                    color: '#a855f7',
                    bg: 'from-[#a855f7]/10 to-[#a855f7]/5',
                  },
                  {
                    icon: Timer,
                    label: 'Study Sessions',
                    value: data.activity.reduce((s, d) => s + d.sessions, 0),
                    color: '#22c55e',
                    bg: 'from-[#22c55e]/10 to-[#22c55e]/5',
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.label}
                      className="glass rounded-xl p-4 card-glow text-center"
                    >
                      <div
                        className="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundImage: `linear-gradient(135deg, ${item.color}20, ${item.color}08)` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <p className="text-2xl font-bold" style={{ color: item.color }}>
                        {item.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* Insights */}
        <motion.div variants={itemVariants}>
          <div className="gradient-divider mb-6" />
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Activity Insights</h2>
              <p className="text-xs text-muted-foreground">Personalized observations from your study patterns</p>
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
