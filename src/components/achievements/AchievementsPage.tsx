'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Trophy,
  Lock,
  Check,
  Sparkles,
  Brain,
  BookOpen,
  Star,
  Zap,
  Compass,
  Award,
  FileText,
  Bookmark,
  PenTool,
  Flame,
  FlameKindling,
  Rocket,
  Users,
  Layers,
  Crown,
  Loader2,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

type FilterTab = 'all' | 'quiz' | 'notes' | 'streak' | 'social' | 'general'

interface AchievementResponse {
  stats: {
    totalQuizzes: number
    totalNotes: number
    totalBookmarks: number
    avgScore: number
    bestScore: number
    streak: number
    maxStreak: number
    totalFriends: number
    totalFlashcards: number
    subjectsExplored: number
    perfectQuizzes: number
  }
  unlockedIds: string[]
  progress: Record<string, number>
  allAchievements: {
    id: string
    title: string
    description: string
    icon: string
    color: string
    category: string
  }[]
}

const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  BookOpen,
  Trophy,
  Star,
  Zap,
  Compass,
  Award,
  FileText,
  Bookmark,
  PenTool,
  Flame,
  FlameKindling,
  Rocket,
  Users,
  Layers,
  Crown,
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  quiz: 'Quiz',
  notes: 'Notes',
  streak: 'Streak',
  social: 'Social',
  general: 'General',
}

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'notes', label: 'Notes' },
  { key: 'streak', label: 'Streak' },
  { key: 'social', label: 'Social' },
  { key: 'general', label: 'General' },
]

export default function AchievementsPage() {
  const { setCurrentPage } = useStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [data, setData] = useState<AchievementResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/achievements')
      if (!res.ok) {
        throw new Error('Failed to load achievements')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  const achievements = data?.allAchievements ?? []
  const unlockedIds = new Set(data?.unlockedIds ?? [])
  const progress = data?.progress ?? {}
  const totalCount = achievements.length
  const unlockedCount = unlockedIds.size
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  const filteredAchievements = achievements.filter((a) => {
    if (activeTab === 'all') return true
    return a.category === activeTab
  })

  // Count per category
  const categoryCounts: Record<string, { total: number; unlocked: number }> = {}
  for (const a of achievements) {
    if (!categoryCounts[a.category]) categoryCounts[a.category] = { total: 0, unlocked: 0 }
    categoryCounts[a.category].total++
    if (unlockedIds.has(a.id)) categoryCounts[a.category].unlocked++
  }

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-1/4 right-1/3 w-96 h-96 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
              <Sparkles className="w-7 h-7" />
              Achievements
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your learning milestones and earn badges</p>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
              <p className="text-sm text-muted-foreground">Loading achievements...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center card-glow mb-8"
          >
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchAchievements}
              className="px-4 py-2 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/20 transition-colors text-sm"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-5 sm:p-6 card-glow mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#a855f7]/20 flex items-center justify-center border border-[#00f0ff]/20">
                    <Trophy className="w-6 h-6 text-[#00f0ff]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      <span className="text-[#00f0ff]">{unlockedCount}</span>
                      <span className="text-muted-foreground">/{totalCount}</span>
                      <span className="text-sm text-muted-foreground ml-2">Achievements Unlocked</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Keep learning to unlock more!</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold gradient-text">{Math.round(progressPercent)}%</span>
                </div>
              </div>
              <div className="relative">
                <Progress value={progressPercent} className="h-2.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-[#00f0ff] [&>div]:to-[#a855f7]" />
                <div className="absolute inset-0 h-2.5 rounded-full bg-gradient-to-r from-[#00f0ff]/20 to-[#a855f7]/20 blur-sm pointer-events-none" />
              </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 mb-6 flex-wrap"
            >
              {filterTabs.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? totalCount
                    : categoryCounts[tab.key]?.total ?? 0
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border',
                      activeTab === tab.key
                        ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent'
                    )}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs opacity-60">{count}</span>
                  </button>
                )
              })}
            </motion.div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAchievements.map((achievement, index) => {
                  const isUnlocked = unlockedIds.has(achievement.id)
                  const achProgress = progress[achievement.id] ?? 0
                  const Icon = ICON_MAP[achievement.icon] || Trophy

                  return (
                    <motion.div
                      key={achievement.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 12) }}
                      className={cn(
                        'relative glass rounded-2xl p-5 border transition-all duration-300 group',
                        isUnlocked
                          ? 'card-glow hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]'
                          : 'opacity-60 border-white/5 hover:opacity-80'
                      )}
                      style={
                        isUnlocked
                          ? {
                              borderColor: `${achievement.color}30`,
                              boxShadow: `0 0 20px ${achievement.color}08, inset 0 1px 0 ${achievement.color}10`,
                            }
                          : undefined
                      }
                    >
                      {/* Locked overlay */}
                      {!isUnlocked && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      )}

                      {/* Unlocked badge */}
                      {isUnlocked && (
                        <div className="absolute top-3 right-3 z-10">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center border"
                            style={{
                              backgroundColor: `${achievement.color}15`,
                              borderColor: `${achievement.color}30`,
                            }}
                          >
                            <Check className="w-3.5 h-3.5" style={{ color: achievement.color }} />
                          </div>
                        </div>
                      )}

                      {/* Icon */}
                      <div className="mb-4">
                        <div
                          className={cn(
                            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
                            isUnlocked && 'group-hover:scale-110'
                          )}
                          style={{
                            backgroundColor: isUnlocked ? `${achievement.color}15` : 'rgba(255,255,255,0.03)',
                            boxShadow: isUnlocked ? `0 0 25px ${achievement.color}15` : 'none',
                          }}
                        >
                          <Icon
                            className={cn(
                              'w-7 h-7 transition-all duration-300',
                              isUnlocked ? 'drop-shadow-lg' : 'text-muted-foreground'
                            )}
                            style={
                              isUnlocked
                                ? {
                                    color: achievement.color,
                                    filter: `drop-shadow(0 0 6px ${achievement.color}60)`,
                                  }
                                : undefined
                            }
                          />
                        </div>
                      </div>

                      {/* Text */}
                      <h3
                        className={cn(
                          'text-base font-semibold mb-1.5',
                          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {achievement.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {achievement.description}
                      </p>

                      {/* Progress bar for locked achievements */}
                      {!isUnlocked && achProgress > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground/60">Progress</span>
                            <span className="text-[10px] font-medium text-muted-foreground/60">{achProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(to right, ${achievement.color}60, ${achievement.color})`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${achProgress}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + index * 0.03, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium border',
                          !isUnlocked && 'bg-white/3 border-white/5 text-muted-foreground/60'
                        )}
                        style={
                          isUnlocked
                            ? {
                                backgroundColor: `${achievement.color}10`,
                                borderColor: `${achievement.color}20`,
                                color: achievement.color,
                              }
                            : undefined
                        }
                      >
                        {CATEGORY_LABELS[achievement.category] || achievement.category}
                      </div>

                      {/* Glow effect for unlocked */}
                      {isUnlocked && (
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(ellipse at center, ${achievement.color}08, transparent 70%)`,
                          }}
                        />
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Empty filter state */}
            {filteredAchievements.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  No achievements in this category yet.
                </p>
              </motion.div>
            )}

            {/* Motivational Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                {unlockedCount === totalCount && totalCount > 0
                  ? '🎉 Congratulations! You have unlocked all achievements!'
                  : unlockedCount > totalCount / 2
                    ? `Great progress! Only ${totalCount - unlockedCount} more to go!`
                    : `You have ${totalCount - unlockedCount} achievements waiting to be unlocked. Keep studying!`}
              </p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
