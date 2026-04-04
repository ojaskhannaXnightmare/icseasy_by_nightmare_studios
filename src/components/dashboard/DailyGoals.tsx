'use client'

import { motion } from 'framer-motion'
import { Target, CheckCircle2, Circle, Loader2, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type GoalStatus = 'not_started' | 'in_progress' | 'completed'

interface DailyGoal {
  id: string
  title: string
  subtitle: string
  status: GoalStatus
  progress?: string
  color: string
}

const dailyGoals: DailyGoal[] = [
  {
    id: '1',
    title: 'Complete 1 Quiz',
    subtitle: 'Take a quiz to test your knowledge',
    status: 'not_started',
    color: '#ec4899',
  },
  {
    id: '2',
    title: 'Generate 2 Notes',
    subtitle: 'Create study notes with AI',
    status: 'not_started',
    color: '#a855f7',
  },
  {
    id: '3',
    title: 'Study for 30 min',
    subtitle: 'Use the Pomodoro timer',
    status: 'not_started',
    color: '#22c55e',
  },
  {
    id: '4',
    title: 'Review 5 Topics',
    subtitle: 'Browse subject topics',
    status: 'not_started',
    color: '#00f0ff',
  },
]

function StatusIcon({ status, color }: { status: GoalStatus; color: string }) {
  switch (status) {
    case 'completed':
      return (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center border"
          style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}
        >
          <CheckCircle2 className="w-4 h-4 icon-breathe" style={{ color }} />
        </div>
      )
    case 'in_progress':
      return (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center border"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />
        </div>
      )
    case 'not_started':
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10">
          <Circle className="w-3 h-3 text-muted-foreground/40" />
        </div>
      )
  }
}

function StatusBadge({ status, color }: { status: GoalStatus; color: string }) {
  switch (status) {
    case 'completed':
      return (
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}25`, color }}
        >
          Done
        </span>
      )
    case 'in_progress':
      return (
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}25`, color }}
        >
          In Progress
        </span>
      )
    case 'not_started':
      return (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 bg-white/3 text-muted-foreground/60">
          Pending
        </span>
      )
  }
}

export default function DailyGoals() {
  const completedCount = dailyGoals.filter(g => g.status === 'completed').length
  const totalCount = dailyGoals.length
  const progressPercent = (completedCount / totalCount) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="glass rounded-xl p-5 sm:p-6 card-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#a855f7]/20 flex items-center justify-center border border-[#00f0ff]/15">
            <Target className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Daily Goals</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {completedCount}/{totalCount} completed today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground gradient-text-shimmer">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/5 mb-5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#a855f7]"
          style={{ boxShadow: '0 0 8px rgba(0,240,255,0.3)' }}
        />
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {dailyGoals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 + index * 0.08 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 border-sweep',
              goal.status === 'completed'
                ? 'bg-white/[0.02] border-white/5'
                : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
            )}
          >
            <StatusIcon status={goal.status} color={goal.color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn(
                  'text-sm font-medium truncate neon-underline-hover',
                  goal.status === 'completed' && 'line-through text-muted-foreground'
                )}>
                  {goal.title}
                </p>
                {goal.progress && (
                  <span
                    className="text-[10px] font-semibold shrink-0"
                    style={{ color: goal.color }}
                  >
                    {goal.progress}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{goal.subtitle}</p>
            </div>
            <StatusBadge status={goal.status} color={goal.color} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
