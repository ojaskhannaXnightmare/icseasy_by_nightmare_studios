'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ChevronRight, Crown, Medal, Award, Brain, BookOpen, Flame, Loader2, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  points: number
  quizScore: number
  notesCount: number
  streak: number
  isCurrentUser: boolean
}

interface UserRankInfo {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  points: number
  quizScore: number
  notesCount: number
  streak: number
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  userRank: UserRankInfo | null
  totalUsers: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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
        avatarGradient: 'bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      }
    case 2:
      return {
        bg: 'from-gray-300/15 to-gray-400/5',
        border: 'border-gray-300/30',
        text: 'text-gray-300',
        shadow: 'shadow-[0_0_20px_rgba(200,200,200,0.05)]',
        icon: <Medal className="w-5 h-5 text-gray-300" />,
        badgeBg: 'bg-gray-300/15 text-gray-300 border-gray-300/20',
        avatarGradient: 'bg-gradient-to-br from-gray-300/20 to-gray-400/10 text-gray-300',
      }
    case 3:
      return {
        bg: 'from-orange-600/15 to-orange-700/5',
        border: 'border-orange-600/30',
        text: 'text-orange-400',
        shadow: 'shadow-[0_0_20px_rgba(234,88,12,0.1)]',
        icon: <Award className="w-5 h-5 text-orange-400" />,
        badgeBg: 'bg-orange-600/15 text-orange-400 border-orange-600/20',
        avatarGradient: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400',
      }
    default:
      return {
        bg: 'from-white/5 to-transparent',
        border: 'border-white/5',
        text: 'text-muted-foreground',
        shadow: '',
        icon: null,
        badgeBg: 'bg-white/5 text-muted-foreground border-white/10',
        avatarGradient: '',
      }
  }
}

function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`
  }
  return String(score)
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5">
      <div className="w-8 text-center">
        <div className="w-5 h-5 bg-white/5 rounded animate-pulse mx-auto" />
      </div>
      <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="w-28 h-4 bg-white/5 rounded animate-pulse mb-1.5" />
        <div className="w-20 h-3 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="text-right">
        <div className="w-12 h-4 bg-white/5 rounded animate-pulse ml-auto" />
      </div>
    </div>
  )
}

function SkeletonPodium() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'glass rounded-2xl p-4 sm:p-5 border border-white/5',
            i === 1 && 'mt-4 sm:mt-8'
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse mb-3" />
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse mb-2" />
            <div className="w-20 h-4 bg-white/5 rounded animate-pulse mb-1" />
            <div className="w-16 h-3 bg-white/5 rounded animate-pulse mb-3" />
            <div className="w-14 h-6 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </>
  )
}

export default function LeaderboardPage() {
  const { setCurrentPage } = useStore()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchLeaderboard() {
      try {
        setLoading(true)
        setError(null)
        const res = await authFetch('/api/leaderboard')
        if (!res.ok) {
          throw new Error('Failed to load leaderboard')
        }
        const json = await res.json()
        if (!cancelled) {
          setData(json)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLeaderboard()

    return () => {
      cancelled = true
    }
  }, [])

  const leaderboard = data?.leaderboard ?? []
  const userRank = data?.userRank ?? null
  const totalUsers = data?.totalUsers ?? 0

  // Check if there's only 1 user (the current user)
  const isOnlyUser = totalUsers <= 1

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
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              Leaderboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">See how you rank among top ICSEasy students</p>
          </div>
          {!loading && totalUsers > 0 && (
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 border border-white/5">
              <Users className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-sm font-semibold text-[#00f0ff]">{totalUsers}</span>
              <span className="text-xs text-muted-foreground">users</span>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
            >
              <SkeletonPodium />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5">
                <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="max-h-[480px] overflow-y-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 text-center border border-red-500/10"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Could not load leaderboard</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Only 1 user - Invite friends */}
        {!loading && !error && isOnlyUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 sm:p-12 text-center border border-white/5"
          >
            <div className="w-20 h-20 rounded-full bg-[#00f0ff]/10 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-[#00f0ff]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-2">You&apos;re the only one here!</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Be the first to compete! Invite friends to join the leaderboard and start climbing the ranks together.
            </p>
            {userRank && userRank.points > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/10">
                <span className="text-xs text-muted-foreground">Your current score</span>
                <span className="text-sm font-bold text-[#00f0ff]">{userRank.points} pts</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Leaderboard with real data */}
        {!loading && !error && !isOnlyUser && leaderboard.length > 0 && (
          <>
            {/* Top 3 Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
            >
              {leaderboard.slice(0, 3).map((entry, index) => {
                const style = getRankStyle(entry.rank)
                const isSecond = index === 1
                const initials = getInitials(entry.name)
                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={cn(
                      'glass rounded-2xl p-4 sm:p-5 bg-gradient-to-b card-glow border',
                      style.border,
                      style.shadow,
                      entry.isCurrentUser && 'ring-1 ring-[#00f0ff]/30 shadow-[0_0_25px_rgba(0,240,255,0.08)]',
                      isSecond && 'mt-4 sm:mt-8'
                    )}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Rank icon / badge */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center mb-3 border',
                          style.badgeBg
                        )}
                      >
                        {style.icon || <span className="text-xs font-bold">{entry.rank}</span>}
                      </div>
                      {/* Avatar */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-2',
                          style.avatarGradient || 'bg-white/5 text-muted-foreground'
                        )}
                      >
                        {initials}
                      </div>
                      <p className="text-sm font-semibold truncate w-full">{entry.name}</p>
                      {entry.isCurrentUser && (
                        <span className="text-[10px] text-[#00f0ff] font-medium mt-0.5">You</span>
                      )}
                      <div className="mt-3 flex flex-col items-center gap-1">
                        <span className={cn('text-lg font-bold', style.text)}>{formatScore(entry.points)}</span>
                        <span className="text-[10px] text-muted-foreground">points</span>
                      </div>
                      {/* Points breakdown */}
                      <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Brain className="w-2.5 h-2.5" />
                          {formatScore(entry.quizScore)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <BookOpen className="w-2.5 h-2.5" />
                          {entry.notesCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          {entry.streak}
                        </span>
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
                {leaderboard.slice(3).map((entry, index) => {
                  const style = getRankStyle(entry.rank)
                  const initials = getInitials(entry.name)
                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.04 }}
                      className={cn(
                        'flex items-center gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition-colors',
                        entry.isCurrentUser && 'bg-[#00f0ff]/[0.03] border-l-2 border-l-[#00f0ff]'
                      )}
                    >
                      {/* Rank */}
                      <div className="w-8 text-center">
                        <span className={cn('text-sm font-bold', style.text)}>{entry.rank}</span>
                      </div>
                      {/* Avatar */}
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                          entry.isCurrentUser
                            ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20'
                            : 'bg-white/5 text-muted-foreground'
                        )}
                      >
                        {initials}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{entry.name}</p>
                          {entry.isCurrentUser && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 font-medium shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        {/* Points breakdown */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Brain className="w-2.5 h-2.5" />
                            {entry.quizScore} quiz
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <BookOpen className="w-2.5 h-2.5" />
                            {entry.notesCount} notes
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" />
                            {entry.streak} streak
                          </span>
                        </div>
                      </div>
                      {/* Points */}
                      <div className="text-right shrink-0">
                        <span className={cn(
                          'text-sm font-semibold',
                          entry.isCurrentUser ? 'text-[#00f0ff]' : 'text-[#00f0ff]/80'
                        )}>
                          {formatScore(entry.points)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">pts</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Your Rank Card */}
            {userRank && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 glass rounded-2xl p-5 border border-[#00f0ff]/10 shadow-[0_0_20px_rgba(0,240,255,0.05)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold text-[#00f0ff]">#{userRank.rank}</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-xs font-semibold text-[#00f0ff] shrink-0 border border-[#00f0ff]/20">
                    {getInitials(userRank.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Your Position</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Brain className="w-2.5 h-2.5" />
                        {userRank.quizScore} quiz
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <BookOpen className="w-2.5 h-2.5" />
                        {userRank.notesCount} notes
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        {userRank.streak} day streak
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-[#00f0ff]">
                      {userRank.points.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted-foreground">points</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
