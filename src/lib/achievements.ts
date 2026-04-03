// Achievement Tracking System for ICSEasy

export interface AchievementStats {
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

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string // lucide icon name
  color: string
  category: 'quiz' | 'notes' | 'streak' | 'social' | 'general'
  check: (stats: AchievementStats) => boolean
  /** Returns current progress toward unlocking (0-100) */
  progress: (stats: AchievementStats) => number
}

/**
 * Helper to clamp a progress value between 0 and 100
 */
function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- QUIZ ----
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first quiz',
    icon: 'Brain',
    color: '#00f0ff',
    category: 'quiz',
    check: (s) => s.totalQuizzes >= 1,
    progress: (s) => clampProgress((s.totalQuizzes / 1) * 100),
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Complete 10 quizzes',
    icon: 'Trophy',
    color: '#f59e0b',
    category: 'quiz',
    check: (s) => s.totalQuizzes >= 10,
    progress: (s) => clampProgress((s.totalQuizzes / 10) * 100),
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: 'Star',
    color: '#22c55e',
    category: 'quiz',
    check: (s) => s.perfectQuizzes >= 1,
    progress: (s) => clampProgress(s.bestScore),
  },
  {
    id: 'brain-power',
    title: 'Brain Power',
    description: 'Score above 90% average',
    icon: 'Zap',
    color: '#eab308',
    category: 'quiz',
    check: (s) => s.avgScore > 90,
    progress: (s) => clampProgress(s.avgScore),
  },
  {
    id: 'subject-explorer',
    title: 'Subject Explorer',
    description: 'Take quizzes in 5 different subjects',
    icon: 'Compass',
    color: '#06b6d4',
    category: 'quiz',
    check: (s) => s.subjectsExplored >= 5,
    progress: (s) => clampProgress((s.subjectsExplored / 5) * 100),
  },
  {
    id: 'high-achiever',
    title: 'High Achiever',
    description: 'Complete 25 quizzes',
    icon: 'Award',
    color: '#f97316',
    category: 'quiz',
    check: (s) => s.totalQuizzes >= 25,
    progress: (s) => clampProgress((s.totalQuizzes / 25) * 100),
  },

  // ---- NOTES ----
  {
    id: 'note-taker',
    title: 'Note Taker',
    description: 'Create your first note',
    icon: 'BookOpen',
    color: '#a855f7',
    category: 'notes',
    check: (s) => s.totalNotes >= 1,
    progress: (s) => clampProgress((s.totalNotes / 1) * 100),
  },
  {
    id: 'knowledge-seeker',
    title: 'Knowledge Seeker',
    description: 'Create 10 notes',
    icon: 'FileText',
    color: '#8b5cf6',
    category: 'notes',
    check: (s) => s.totalNotes >= 10,
    progress: (s) => clampProgress((s.totalNotes / 10) * 100),
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Bookmark 5 notes',
    icon: 'Bookmark',
    color: '#ec4899',
    category: 'notes',
    check: (s) => s.totalBookmarks >= 5,
    progress: (s) => clampProgress((s.totalBookmarks / 5) * 100),
  },
  {
    id: 'note-architect',
    title: 'Note Architect',
    description: 'Create 25 notes',
    icon: 'PenTool',
    color: '#d946ef',
    category: 'notes',
    check: (s) => s.totalNotes >= 25,
    progress: (s) => clampProgress((s.totalNotes / 25) * 100),
  },

  // ---- STREAK ----
  {
    id: 'streak-starter',
    title: 'Streak Starter',
    description: '3-day study streak',
    icon: 'Flame',
    color: '#fb923c',
    category: 'streak',
    check: (s) => s.streak >= 3,
    progress: (s) => clampProgress((s.streak / 3) * 100),
  },
  {
    id: 'on-fire',
    title: 'On Fire',
    description: '7-day study streak',
    icon: 'FlameKindling',
    color: '#ef4444',
    category: 'streak',
    check: (s) => s.streak >= 7,
    progress: (s) => clampProgress((s.streak / 7) * 100),
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: '30-day study streak',
    icon: 'Rocket',
    color: '#f43f5e',
    category: 'streak',
    check: (s) => s.streak >= 30,
    progress: (s) => clampProgress((s.streak / 30) * 100),
  },

  // ---- SOCIAL ----
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Add 5 friends',
    icon: 'Users',
    color: '#ec4899',
    category: 'social',
    check: (s) => s.totalFriends >= 5,
    progress: (s) => clampProgress((s.totalFriends / 5) * 100),
  },

  // ---- GENERAL ----
  {
    id: 'flashcard-fan',
    title: 'Flashcard Fan',
    description: 'Create 20 flashcards',
    icon: 'Layers',
    color: '#14b8a6',
    category: 'general',
    check: (s) => s.totalFlashcards >= 20,
    progress: (s) => clampProgress((s.totalFlashcards / 20) * 100),
  },
  {
    id: 'icseasy-legend',
    title: 'ICSEasy Legend',
    description: 'Unlock 10 other achievements',
    icon: 'Crown',
    color: '#fbbf24',
    category: 'general',
    // Legend is checked specially in getUnlockedAchievements
    check: () => false,
    progress: () => 0,
  },
]

/**
 * Get IDs of all unlocked achievements for the given stats.
 * The "ICSEasy Legend" achievement depends on the count of OTHER unlocked achievements.
 */
export function getUnlockedAchievements(stats: AchievementStats): string[] {
  const unlocked: string[] = []

  // First pass: unlock everything except the legend
  for (const ach of ACHIEVEMENTS) {
    if (ach.id === 'icseasy-legend') continue
    if (ach.check(stats)) {
      unlocked.push(ach.id)
    }
  }

  // Second pass: check legend based on count of other unlocks
  if (unlocked.length >= 10) {
    unlocked.push('icseasy-legend')
  }

  return unlocked
}

/**
 * Get progress (0-100) for each achievement based on the given stats.
 */
export function getAchievementProgress(stats: AchievementStats): Record<string, number> {
  const unlocked = getUnlockedAchievements(stats)
  const unlockedCount = unlocked.length
  const result: Record<string, number> = {}

  for (const ach of ACHIEVEMENTS) {
    if (ach.id === 'icseasy-legend') {
      result[ach.id] = clampProgress((unlockedCount / 10) * 100)
    } else {
      result[ach.id] = ach.progress(stats)
    }
  }

  return result
}
