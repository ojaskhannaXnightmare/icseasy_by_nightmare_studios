'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  BookOpen,
  Trophy,
  Users,
  Flame,
  Bot,
  Search,
  Moon,
  Sun,
  Compass,
  Bookmark,
  Brain,
  Lock,
  Check,
  Sparkles,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

type FilterTab = 'all' | 'unlocked' | 'locked'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ElementType
  unlocked: boolean
  color: string
  category: string
}

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first quiz',
    icon: Brain,
    unlocked: true,
    color: '#00f0ff',
    category: 'Quiz',
  },
  {
    id: '2',
    title: 'Bookworm',
    description: 'Generate 5 notes',
    icon: BookOpen,
    unlocked: false,
    color: '#a855f7',
    category: 'Notes',
  },
  {
    id: '3',
    title: 'Quiz Master',
    description: 'Score 100% on any quiz',
    icon: Trophy,
    unlocked: false,
    color: '#f59e0b',
    category: 'Quiz',
  },
  {
    id: '4',
    title: 'Social Butterfly',
    description: 'Add 3 friends',
    icon: Users,
    unlocked: false,
    color: '#ec4899',
    category: 'Social',
  },
  {
    id: '5',
    title: 'Streak Warrior',
    description: '7-day study streak',
    icon: Flame,
    unlocked: false,
    color: '#f97316',
    category: 'Study',
  },
  {
    id: '6',
    title: 'AI Scholar',
    description: 'Ask AI Tutor 10 questions',
    icon: Bot,
    unlocked: false,
    color: '#00f0ff',
    category: 'AI',
  },
  {
    id: '7',
    title: 'Research Guru',
    description: 'Use Research Tool 3 times',
    icon: Search,
    unlocked: false,
    color: '#22c55e',
    category: 'Research',
  },
  {
    id: '8',
    title: 'Night Owl',
    description: 'Study after 10 PM',
    icon: Moon,
    unlocked: false,
    color: '#8b5cf6',
    category: 'Study',
  },
  {
    id: '9',
    title: 'Early Bird',
    description: 'Study before 8 AM',
    icon: Sun,
    unlocked: false,
    color: '#f59e0b',
    category: 'Study',
  },
  {
    id: '10',
    title: 'Subject Explorer',
    description: 'Visit all 8 subjects',
    icon: Compass,
    unlocked: true,
    color: '#06b6d4',
    category: 'Explore',
  },
  {
    id: '11',
    title: 'Note Taker',
    description: 'Bookmark 10 notes',
    icon: Bookmark,
    unlocked: false,
    color: '#ec4899',
    category: 'Notes',
  },
  {
    id: '12',
    title: 'Group Leader',
    description: 'Create a study group',
    icon: Users,
    unlocked: false,
    color: '#a855f7',
    category: 'Social',
  },
]

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unlocked', label: 'Unlocked' },
  { key: 'locked', label: 'Locked' },
]

export default function AchievementsPage() {
  const { setCurrentPage } = useStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const progressPercent = (unlockedCount / totalCount) * 100

  const filteredAchievements = achievements.filter(a => {
    if (activeTab === 'all') return true
    if (activeTab === 'unlocked') return a.unlocked
    return !a.unlocked
  })

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
          className="flex items-center gap-2 mb-6"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border',
                activeTab === tab.key
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent'
              )}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-60">
                {tab.key === 'all' ? totalCount : tab.key === 'unlocked' ? unlockedCount : totalCount - unlockedCount}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement, index) => {
            const Icon = achievement.icon
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                className={cn(
                  'relative glass rounded-2xl p-5 border transition-all duration-300 group',
                  achievement.unlocked
                    ? 'card-glow hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]'
                    : 'opacity-50 border-white/5 hover:opacity-70'
                )}
                style={achievement.unlocked ? {
                  borderColor: `${achievement.color}30`,
                  boxShadow: `0 0 20px ${achievement.color}08, inset 0 1px 0 ${achievement.color}10`,
                } : undefined}
              >
                {/* Locked overlay */}
                {!achievement.unlocked && (
                  <div className="absolute top-3 right-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Unlocked badge */}
                {achievement.unlocked && (
                  <div className="absolute top-3 right-3">
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
                      achievement.unlocked && 'group-hover:scale-110'
                    )}
                    style={{
                      backgroundColor: achievement.unlocked ? `${achievement.color}15` : 'rgba(255,255,255,0.03)',
                      boxShadow: achievement.unlocked ? `0 0 25px ${achievement.color}15` : 'none',
                    }}
                  >
                    <Icon
                      className={cn(
                        'w-7 h-7 transition-all duration-300',
                        achievement.unlocked
                          ? 'drop-shadow-lg'
                          : 'text-muted-foreground'
                      )}
                      style={achievement.unlocked ? {
                        color: achievement.color,
                        filter: `drop-shadow(0 0 6px ${achievement.color}60)`,
                      } : undefined}
                    />
                  </div>
                </div>

                {/* Text */}
                <h3 className={cn(
                  'text-base font-semibold mb-1.5',
                  achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {achievement.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {achievement.description}
                </p>

                {/* Category Badge */}
                <div
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium border',
                    achievement.unlocked
                      ? ''
                      : 'bg-white/3 border-white/5 text-muted-foreground/60'
                  )}
                  style={achievement.unlocked ? {
                    backgroundColor: `${achievement.color}10`,
                    borderColor: `${achievement.color}20`,
                    color: achievement.color,
                  } : undefined}
                >
                  {achievement.category}
                </div>

                {/* Glow effect for unlocked */}
                {achievement.unlocked && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${achievement.color}06, transparent 70%)`,
                    }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            {unlockedCount === totalCount
              ? '🎉 Congratulations! You have unlocked all achievements!'
              : unlockedCount > totalCount / 2
                ? `Great progress! Only ${totalCount - unlockedCount} more to go!`
                : `You have ${totalCount - unlockedCount} achievements waiting to be unlocked. Keep studying!`
            }
          </p>
        </motion.div>
      </div>
    </div>
  )
}
