'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  CalendarDays,
  Sparkles,
  BookOpen,
  Brain,
  Clock,
  FileText,
  RefreshCw,
  Lightbulb,
  GraduationCap,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { useStore } from '@/store/useStore'

// --- Types ---
interface StudyBlock {
  subject: string
  topic: string
  duration: string
  priority: 'high' | 'medium' | 'low'
}

interface StudyPlan {
  plan: Record<string, StudyBlock[]>
  tips: string[]
}

interface StudyStats {
  totalNotes: number
  totalQuizzes: number
  totalStudyTime: number
  subjectProgress: { subject: string; quizzes: number; avgScore: number }[]
}

// Subject color map for consistent coloring
const subjectColors: Record<string, string> = {
  Mathematics: '#00f0ff',
  Physics: '#a855f7',
  Chemistry: '#ec4899',
  Biology: '#22c55e',
  English: '#f59e0b',
  History: '#f97316',
  Geography: '#06b6d4',
  Hindi: '#d946ef',
  Computer: '#14b8a6',
  Revision: '#eab308',
  Practice: '#ef4444',
  Economics: '#8b5cf6',
  Civics: '#fb923c',
  EnvironmentalScience: '#34d399',
}

function getSubjectColor(subject: string): string {
  // Check if any known subject name is a substring of the given subject
  for (const [key, color] of Object.entries(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }
  // Generate consistent color from subject name hash
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 65%)`
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return '#ef4444'
    case 'medium': return '#f59e0b'
    case 'low': return '#22c55e'
    default: return '#94a3b8'
  }
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// --- Skeleton ---
function PlannerSkeleton() {
  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8">
          <Skeleton className="h-4 w-16 mb-3 bg-white/5" />
          <Skeleton className="h-8 w-48 mb-2 bg-white/5" />
          <Skeleton className="h-4 w-72 bg-white/5" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl bg-white/5" />
          <Skeleton className="h-96 rounded-xl bg-white/5" />
        </div>
        <Skeleton className="h-80 rounded-xl bg-white/5" />
      </div>
    </div>
  )
}

// --- Empty State ---
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00f0ff]/10 to-[#a855f7]/10 border border-[#00f0ff]/20 flex items-center justify-center">
          <GraduationCap className="w-12 h-12 text-[#00f0ff]" />
        </div>
        <div className="absolute inset-0 rounded-full border border-dashed border-[#a855f7]/20 orbital-ring" />
        <div className="absolute -inset-4 rounded-full border border-dashed border-[#ec4899]/10 orbital-ring" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No Study Plan Yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        Let our AI create a personalized weekly study plan based on your performance and weak areas. It adapts to your progress!
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onGenerate}
        className="btn-neon-solid px-8 py-3 rounded-xl flex items-center gap-2 text-sm"
      >
        <Sparkles className="w-4 h-4" />
        Generate Your Study Plan
      </motion.button>
    </motion.div>
  )
}

// --- Study Block Card ---
function StudyBlockCard({ block, index }: { block: StudyBlock; index: number }) {
  const color = getSubjectColor(block.subject)
  const priorityColor = getPriorityColor(block.priority)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative overflow-hidden rounded-lg p-3 group hover:scale-[1.02] transition-transform duration-200"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}04)`,
        border: `1px solid ${color}20`,
      }}
    >
      {/* Priority indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
        style={{ backgroundColor: priorityColor }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color }}>
            {block.subject}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium glass-badge"
            style={{
              color: priorityColor,
              backgroundColor: `${priorityColor}15`,
              border: `1px solid ${priorityColor}30`,
            }}
          >
            {block.priority}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
          {block.topic}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <Clock className="w-3 h-3" />
          {block.duration}
        </div>
      </div>
    </motion.div>
  )
}

// --- Main Component ---
export default function StudyPlanner() {
  const { setCurrentPage } = useStore()
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, planRes] = await Promise.all([
          authFetch('/api/analytics'),
          authFetch('/api/planner/generate'),
        ])

        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          if (statsJson.stats) {
            const s = statsJson.stats
            setStats({
              totalNotes: s.totalNotes || 0,
              totalQuizzes: s.totalQuizzes || 0,
              totalStudyTime: s.totalStudyTime || 0,
              subjectProgress: (s.subjectPerformance || []).map(
                (sp: { subject: string; avgScore: number; totalQuizzes: number }) => ({
                  subject: sp.subject,
                  quizzes: sp.totalQuizzes,
                  avgScore: sp.avgScore,
                })
              ),
            })
          }
        }

        // Try to load saved plan from localStorage
        const savedPlan = localStorage.getItem('icseasy-study-plan')
        if (savedPlan) {
          try {
            setPlan(JSON.parse(savedPlan))
          } catch {
            // Ignore parse error
          }
        }
      } catch {
        // Silently handle
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await authFetch('/api/planner/generate', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to generate plan')
        setGenerating(false)
        return
      }
      const data = await res.json()
      if (data.plan) {
        setPlan(data.plan)
        localStorage.setItem('icseasy-study-plan', JSON.stringify(data.plan))
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setGenerating(false)
  }

  const studyHours = stats ? Math.floor(stats.totalStudyTime / 60) : 0
  const studyMins = stats ? stats.totalStudyTime % 60 : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (loading) return <PlannerSkeleton />

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />

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
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#a855f7]/20 border border-[#00f0ff]/20 flex items-center justify-center icon-container-ring">
                <CalendarDays className="w-6 h-6 text-[#00f0ff]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">AI Study Planner</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Personalized weekly study plan powered by AI
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={generating}
              className={`btn-neon-solid px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm ${generating ? 'opacity-60' : ''}`}
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generating ? 'Generating...' : 'Generate Study Plan'}
            </motion.button>
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

        {/* Stats Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          {[
            { icon: FileText, label: 'Total Notes', value: stats?.totalNotes ?? 0, color: '#a855f7', suffix: '' },
            { icon: Brain, label: 'Quizzes Taken', value: stats?.totalQuizzes ?? 0, color: '#ec4899', suffix: '' },
            { icon: Clock, label: 'Study Time', value: `${studyHours}h ${studyMins}m`, color: '#00f0ff', suffix: '' },
            { icon: BookOpen, label: 'Subjects', value: stats?.subjectProgress?.length ?? 0, color: '#f59e0b', suffix: '' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="glass rounded-xl p-4 card-glow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold number-shimmer" style={{ color: stat.color }}>
                  {stat.value}{stat.suffix}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            )
          })}
        </motion.div>

        {/* Subject Progress */}
        {stats && stats.subjectProgress.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#a855f7]/15 flex items-center justify-center icon-container-ring">
                <BookOpen className="w-4 h-4 text-[#a855f7]" />
              </div>
              <h2 className="text-lg font-semibold neon-underline-hover">Subject Progress</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.subjectProgress.map((sp) => {
                const color = getSubjectColor(sp.subject)
                return (
                  <div
                    key={sp.subject}
                    className="glass rounded-lg p-3 card-glow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium truncate">{sp.subject}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color }}>{sp.avgScore}%</span>
                      <span className="text-[10px] text-muted-foreground">{sp.quizzes} quiz{sp.quizzes !== 1 ? 'zes' : ''}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sp.avgScore}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Main Content: Plan Grid or Empty State */}
        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-8 mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#00f0ff] animate-pulse" />
                <span className="text-sm font-medium text-[#00f0ff]">AI is crafting your personalized study plan...</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
                {DAY_LABELS.map((day) => (
                  <div key={day} className="space-y-2">
                    <Skeleton className="h-6 w-full rounded bg-white/5" />
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 rounded-lg bg-white/5 shimmer" />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : plan && plan.plan ? (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              variants={itemVariants}
            >
              {/* Weekly Schedule Grid */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#ec4899]/15 flex items-center justify-center icon-container-ring">
                  <CalendarDays className="w-4 h-4 text-[#ec4899]" />
                </div>
                <h2 className="text-lg font-semibold neon-underline-hover">Weekly Schedule</h2>
              </div>

              {/* Desktop: 7-column grid */}
              <div className="hidden lg:block mb-8 glass-panel-deep border-sweep rounded-xl p-4">
                <div className="grid grid-cols-7 gap-3">
                  {DAYS.map((day, dayIdx) => {
                    const blocks = plan.plan[day] || []
                    return (
                      <div key={day} className="glass rounded-xl p-3 card-glow">
                        <div className="text-center mb-3">
                          <span className="text-xs font-semibold text-[#00f0ff] uppercase tracking-wider">
                            {DAY_LABELS[dayIdx]}
                          </span>
                          <div className="w-6 h-0.5 bg-gradient-to-r from-[#00f0ff] to-[#a855f7] mx-auto mt-1 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          {blocks.map((block, idx) => (
                            <StudyBlockCard key={`${day}-${idx}`} block={block} index={idx} />
                          ))}
                          {blocks.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-[10px] text-muted-foreground/50">Rest day</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mobile: Scrollable cards per day */}
              <div className="lg:hidden mb-8 space-y-4 glass-panel-deep border-sweep rounded-xl p-4">
                {DAYS.map((day, dayIdx) => {
                  const blocks = plan.plan[day] || []
                  if (blocks.length === 0) return null
                  return (
                    <div key={day} className="glass rounded-xl p-4 card-glow">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-[#00f0ff] uppercase tracking-wider w-8">
                          {DAY_LABELS[dayIdx]}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-[#00f0ff]/20 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {blocks.map((block, idx) => (
                          <StudyBlockCard key={`${day}-${idx}`} block={block} index={idx} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tips */}
              {plan.tips && plan.tips.length > 0 && (
                <motion.div variants={itemVariants} className="glass rounded-xl p-5 sm:p-6 card-glow mb-8">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 flex items-center justify-center icon-container-ring">
                      <Lightbulb className="w-4 h-4 text-[#22c55e]" />
                    </div>
                    <h2 className="text-lg font-semibold neon-underline-hover">Study Tips</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.tips.map((tip, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02]"
                      >
                        <span className="text-[#22c55e] text-sm mt-0.5">✦</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl"
            >
              <EmptyState onGenerate={handleGenerate} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
