'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ChevronRight, Crown, Medal, Award, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

type TimeTab = 'weekly' | 'monthly' | 'alltime'

interface LeaderboardEntry {
  rank: number
  name: string
  initials: string
  score: number
  quizzesTaken: number
  school: string
}

// Pre-computed leaderboard data
const leaderboardData: Record<TimeTab, LeaderboardEntry[]> = {
  weekly: [
    { rank: 1, name: 'Ananya Patel', initials: 'AP', score: 2850, quizzesTaken: 28, school: 'St. Xavier\'s, Mumbai' },
    { rank: 2, name: 'Rahul Sharma', initials: 'RS', score: 2740, quizzesTaken: 25, school: 'La Martiniere, Kolkata' },
    { rank: 3, name: 'Meera Kapoor', initials: 'MK', score: 2680, quizzesTaken: 30, school: 'Bishop Cotton, Bangalore' },
    { rank: 4, name: 'Arjun Nair', initials: 'AN', score: 2520, quizzesTaken: 22, school: 'Delhi Public School' },
    { rank: 5, name: 'Ishita Gupta', initials: 'IG', score: 2480, quizzesTaken: 27, school: 'Modern School, Delhi' },
    { rank: 6, name: 'Vikram Singh', initials: 'VS', score: 2350, quizzesTaken: 20, school: 'Mayo College, Ajmer' },
    { rank: 7, name: 'Priya Das', initials: 'PD', score: 2290, quizzesTaken: 24, school: 'Loreto House, Kolkata' },
    { rank: 8, name: 'Aditya Rao', initials: 'AR', score: 2200, quizzesTaken: 19, school: 'Cathedral School, Mumbai' },
    { rank: 9, name: 'Sneha Reddy', initials: 'SR', score: 2150, quizzesTaken: 23, school: 'Oakridge School, Hyderabad' },
    { rank: 10, name: 'Karan Mehta', initials: 'KM', score: 2080, quizzesTaken: 21, school: 'Jamnabai Narsee, Mumbai' },
  ],
  monthly: [
    { rank: 1, name: 'Meera Kapoor', initials: 'MK', score: 11200, quizzesTaken: 112, school: 'Bishop Cotton, Bangalore' },
    { rank: 2, name: 'Ananya Patel', initials: 'AP', score: 10850, quizzesTaken: 105, school: 'St. Xavier\'s, Mumbai' },
    { rank: 3, name: 'Arjun Nair', initials: 'AN', score: 10400, quizzesTaken: 98, school: 'Delhi Public School' },
    { rank: 4, name: 'Rahul Sharma', initials: 'RS', score: 10150, quizzesTaken: 100, school: 'La Martiniere, Kolkata' },
    { rank: 5, name: 'Ishita Gupta', initials: 'IG', score: 9800, quizzesTaken: 95, school: 'Modern School, Delhi' },
    { rank: 6, name: 'Sneha Reddy', initials: 'SR', score: 9400, quizzesTaken: 92, school: 'Oakridge School, Hyderabad' },
    { rank: 7, name: 'Vikram Singh', initials: 'VS', score: 9100, quizzesTaken: 88, school: 'Mayo College, Ajmer' },
    { rank: 8, name: 'Aditya Rao', initials: 'AR', score: 8750, quizzesTaken: 85, school: 'Cathedral School, Mumbai' },
    { rank: 9, name: 'Karan Mehta', initials: 'KM', score: 8400, quizzesTaken: 82, school: 'Jamnabai Narsee, Mumbai' },
    { rank: 10, name: 'Priya Das', initials: 'PD', score: 8100, quizzesTaken: 80, school: 'Loreto House, Kolkata' },
  ],
  alltime: [
    { rank: 1, name: 'Ananya Patel', initials: 'AP', score: 48500, quizzesTaken: 480, school: 'St. Xavier\'s, Mumbai' },
    { rank: 2, name: 'Meera Kapoor', initials: 'MK', score: 46200, quizzesTaken: 455, school: 'Bishop Cotton, Bangalore' },
    { rank: 3, name: 'Rahul Sharma', initials: 'RS', score: 44800, quizzesTaken: 440, school: 'La Martiniere, Kolkata' },
    { rank: 4, name: 'Arjun Nair', initials: 'AN', score: 42500, quizzesTaken: 418, school: 'Delhi Public School' },
    { rank: 5, name: 'Ishita Gupta', initials: 'IG', score: 40100, quizzesTaken: 395, school: 'Modern School, Delhi' },
    { rank: 6, name: 'Vikram Singh', initials: 'VS', score: 38800, quizzesTaken: 382, school: 'Mayo College, Ajmer' },
    { rank: 7, name: 'Sneha Reddy', initials: 'SR', score: 37200, quizzesTaken: 368, school: 'Oakridge School, Hyderabad' },
    { rank: 8, name: 'Aditya Rao', initials: 'AR', score: 35800, quizzesTaken: 352, school: 'Cathedral School, Mumbai' },
    { rank: 9, name: 'Karan Mehta', initials: 'KM', score: 34500, quizzesTaken: 340, school: 'Jamnabai Narsee, Mumbai' },
    { rank: 10, name: 'Priya Das', initials: 'PD', score: 33200, quizzesTaken: 328, school: 'Loreto House, Kolkata' },
  ],
}

const timeTabs: { key: TimeTab; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'alltime', label: 'All Time' },
]

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        bg: 'from-amber-500/15 to-amber-600/5',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
        icon: <Crown className="w-5 h-5 text-amber-400" />,
        badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      }
    case 2:
      return {
        bg: 'from-gray-300/15 to-gray-400/5',
        border: 'border-gray-300/30',
        text: 'text-gray-300',
        shadow: 'shadow-[0_0_20px_rgba(200,200,200,0.05)]',
        icon: <Medal className="w-5 h-5 text-gray-300" />,
        badgeBg: 'bg-gray-300/15 text-gray-300 border-gray-300/20',
      }
    case 3:
      return {
        bg: 'from-orange-600/15 to-orange-700/5',
        border: 'border-orange-600/30',
        text: 'text-orange-400',
        shadow: 'shadow-[0_0_20px_rgba(234,88,12,0.1)]',
        icon: <Award className="w-5 h-5 text-orange-400" />,
        badgeBg: 'bg-orange-600/15 text-orange-400 border-orange-600/20',
      }
    default:
      return {
        bg: 'from-white/5 to-transparent',
        border: 'border-white/5',
        text: 'text-muted-foreground',
        shadow: '',
        icon: null,
        badgeBg: 'bg-white/5 text-muted-foreground border-white/10',
      }
  }
}

function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`
  }
  return String(score)
}

export default function LeaderboardPage() {
  const { setCurrentPage } = useStore()
  const [activeTab, setActiveTab] = useState<TimeTab>('weekly')
  const data = leaderboardData[activeTab]

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      {/* Background glows */}
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-[#f59e0b]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/3 left-1/3 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
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
              <Trophy className="w-7 h-7" />
              Leaderboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">See how you rank among top ICSEasy students</p>
          </div>
        </motion.div>

        {/* Time Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-8"
        >
          {timeTabs.map((tab) => (
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
            </button>
          ))}
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          {data.slice(0, 3).map((entry, index) => {
            const style = getRankStyle(entry.rank)
            const isSecond = index === 1
            return (
              <motion.div
                key={entry.initials}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={cn(
                  'glass rounded-2xl p-4 sm:p-5 bg-gradient-to-b card-glow border',
                  style.border,
                  style.shadow,
                  isSecond && 'mt-4 sm:mt-8'
                )}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Rank icon / badge */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center mb-3 border',
                    style.badgeBg
                  )}>
                    {style.icon || <span className="text-xs font-bold">{entry.rank}</span>}
                  </div>
                  {/* Avatar */}
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-2',
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : entry.rank === 2
                      ? 'bg-gradient-to-br from-gray-300/20 to-gray-400/10 text-gray-300'
                      : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400'
                  )}>
                    {entry.initials}
                  </div>
                  <p className="text-sm font-semibold truncate w-full">{entry.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{entry.school}</p>
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <span className={cn('text-lg font-bold', style.text)}>{formatScore(entry.score)}</span>
                    <span className="text-[10px] text-muted-foreground">points</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Rest of Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl overflow-hidden card-glow"
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-muted-foreground">Rankings</h2>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {data.slice(3).map((entry, index) => {
              const style = getRankStyle(entry.rank)
              return (
                <motion.div
                  key={entry.initials}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    <span className={cn('text-sm font-bold', style.text)}>{entry.rank}</span>
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                    {entry.initials}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{entry.school}</p>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{entry.quizzesTaken}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#00f0ff]">{formatScore(entry.score)}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Your Rank Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 glass rounded-2xl p-5 border border-[#00f0ff]/10 shadow-[0_0_20px_rgba(0,240,255,0.05)]"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 text-center">
              <span className="text-sm font-bold text-[#00f0ff]">#15</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-xs font-semibold text-[#00f0ff] shrink-0 border border-[#00f0ff]/20">
              You
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Your Position</p>
              <p className="text-[11px] text-muted-foreground">Keep studying to climb the ranks!</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-[#00f0ff]">1,820</span>
              <p className="text-[10px] text-muted-foreground">points</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
