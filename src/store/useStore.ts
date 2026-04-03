import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PageType = 'landing' | 'login' | 'signup' | 'dashboard' | 'tutor' | 'subjects' | 'subject-detail' | 'notes' | 'bookmarks' | 'research' | 'quiz-setup' | 'quiz-active' | 'quiz-results' | 'quiz-history' | 'friends' | 'messages' | 'groups' | 'profile' | 'group-chat' | 'timer' | 'leaderboard' | 'achievements' | 'flashcards' | 'analytics' | 'settings' | 'planner' | 'challenge' | 'reports' | 'heatmap'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  studyPrefs?: string | null
  isOnline: boolean
  streak: number
  createdAt: string
}

export interface SubjectData {
  id: string
  name: string
  icon: string
  color: string
  description: string
  topics: { id: string; name: string }[]
}

export interface NoteData {
  id: string
  title: string
  subject: string
  topic: string
  content: string
  noteType: string
  isBookmarked: boolean
  createdAt: string
}

export interface QuizAttemptData {
  id: string
  subject: string
  topic: string
  score: number
  totalMarks: number
  createdAt: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface FriendData {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  isOnline: boolean
  lastSeen?: string | null
}

export interface MessageData {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  sender?: { name: string; avatarUrl?: string | null }
}

export interface GroupData {
  id: string
  name: string
  avatarUrl?: string | null
  createdBy: string
  members: { userId: string; user: { id: string; name: string; avatarUrl?: string | null } }[]
  createdAt: string
}

interface AppState {
  // Navigation
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
  previousPage: PageType | null
  navigateBack: () => void

  // Auth
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void

  // Selected items
  selectedSubject: SubjectData | null
  setSelectedSubject: (subject: SubjectData | null) => void
  selectedTopic: string | null
  setSelectedTopic: (topic: string | null) => void
  selectedFriend: FriendData | null
  setSelectedFriend: (friend: FriendData | null) => void
  selectedGroup: GroupData | null
  setSelectedGroup: (group: GroupData | null) => void

  // AI Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void

  // Quiz
  quizQuestions: QuizQuestion[]
  quizAnswers: (number | null)[]
  quizSubject: string
  quizTopic: string
  setQuizQuestions: (questions: QuizQuestion[], subject: string, topic: string) => void
  setQuizAnswer: (index: number, answer: number) => void
  resetQuiz: () => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Stats
  totalNotes: number
  totalQuizzes: number
  avgScore: number
  setStats: (notes: number, quizzes: number, avgScore: number) => void

  // Streak
  streak: number
  setStreak: (streak: number) => void
  longestStreak: number
  setLongestStreak: (longestStreak: number) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'landing' as PageType,
      setCurrentPage: (page) => set({ previousPage: get().currentPage, currentPage: page }),
      previousPage: null,
      navigateBack: () => {
        const prev = get().previousPage
        if (prev) set({ currentPage: prev, previousPage: null })
      },

      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({
        user: null,
        token: null,
        currentPage: 'landing' as PageType,
        chatMessages: [],
        quizQuestions: [],
        quizAnswers: [],
      }),

      // Selected items
      selectedSubject: null,
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),
      selectedTopic: null,
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      selectedFriend: null,
      setSelectedFriend: (friend) => set({ selectedFriend: friend }),
      selectedGroup: null,
      setSelectedGroup: (group) => set({ selectedGroup: group }),

      // AI Chat
      chatMessages: [],
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),
      clearChatMessages: () => set({ chatMessages: [] }),

      // Quiz
      quizQuestions: [],
      quizAnswers: [],
      quizSubject: '',
      quizTopic: '',
      setQuizQuestions: (questions, subject, topic) => set({
        quizQuestions: questions,
        quizSubject: subject,
        quizTopic: topic,
        quizAnswers: new Array(questions.length).fill(null),
      }),
      setQuizAnswer: (index, answer) => set((state) => {
        const newAnswers = [...state.quizAnswers]
        newAnswers[index] = answer
        return { quizAnswers: newAnswers }
      }),
      resetQuiz: () => set({
        quizQuestions: [],
        quizAnswers: [],
        quizSubject: '',
        quizTopic: '',
      }),

      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Stats
      totalNotes: 0,
      totalQuizzes: 0,
      avgScore: 0,
      setStats: (notes, quizzes, avgScore) => set({
        totalNotes: notes,
        totalQuizzes: quizzes,
        avgScore: avgScore,
      }),

      // Streak
      streak: 0,
      setStreak: (streak) => set({ streak }),
      longestStreak: 0,
      setLongestStreak: (longestStreak) => set({ longestStreak }),
    }),
    {
      name: 'icseasy-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        currentPage: state.currentPage,
        chatMessages: state.chatMessages,
        totalNotes: state.totalNotes,
        totalQuizzes: state.totalQuizzes,
        avgScore: state.avgScore,
        streak: state.streak,
        longestStreak: state.longestStreak,
      }),
    }
  )
)
