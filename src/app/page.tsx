'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useStore, type PageType } from '@/store/useStore'
import LandingPage from '@/components/landing/LandingPage'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import Dashboard from '@/components/dashboard/Dashboard'
import AITutor from '@/components/chat/AITutor'
import SubjectHub from '@/components/subjects/SubjectHub'
import SubjectDetail from '@/components/subjects/SubjectDetail'
import NotesPage from '@/components/notes/NotesPage'
import ResearchTool from '@/components/notes/ResearchTool'
import QuizSetup from '@/components/quiz/QuizSetup'
import QuizActive from '@/components/quiz/QuizActive'
import QuizResults from '@/components/quiz/QuizResults'
import FriendsPage from '@/components/social/FriendsPage'
import ChatPage from '@/components/social/ChatPage'
import GroupsPage from '@/components/social/GroupsPage'
import GroupChat from '@/components/social/GroupChat'
import ProfilePage from '@/components/profile/ProfilePage'
import StudyTimer from '@/components/timer/StudyTimer'
import LeaderboardPage from '@/components/leaderboard/LeaderboardPage'
import AchievementsPage from '@/components/achievements/AchievementsPage'
import FlashcardsPage from '@/components/flashcards/FlashcardsPage'
import QuizHistory from '@/components/quiz/QuizHistory'
import AnalyticsPage from '@/components/analytics/AnalyticsPage'
import SettingsPage from '@/components/settings/SettingsPage'



// Pages that need sidebar
const authenticatedPages: PageType[] = [
  'dashboard',
  'tutor',
  'subjects',
  'subject-detail',
  'notes',
  'research',
  'quiz-setup',
  'quiz-active',
  'quiz-results',
  'quiz-history',
  'friends',
  'messages',
  'groups',
  'group-chat',
  'profile',
  'timer',
  'leaderboard',
  'achievements',
  'flashcards',
  'analytics',
  'settings',
]

function AppRouter() {
  const { currentPage, user } = useStore()

  // Auth guard: redirect to landing if not authenticated on protected pages
  const needsAuth = currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'signup'
  if (needsAuth && !user) {
    return <LandingPage />
  }

  // Unauthenticated pages
  if (currentPage === 'landing') return <LandingPage />
  if (currentPage === 'login') return <LoginForm />
  if (currentPage === 'signup') return <SignupForm />

  // Authenticated pages
  const needsSidebar = authenticatedPages.includes(currentPage)

  return (
    <div className="min-h-screen">
      {needsSidebar && <Sidebar />}

      {/* Page Router with Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen"
        >
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'tutor' && <AITutor />}
          {currentPage === 'subjects' && <SubjectHub />}
          {currentPage === 'subject-detail' && <SubjectDetail />}

          {/* Notes & Research */}
          {currentPage === 'notes' && <NotesPage />}
          {currentPage === 'research' && <ResearchTool />}

          {/* Quiz */}
          {currentPage === 'quiz-setup' && <QuizSetup />}
          {currentPage === 'quiz-active' && <QuizActive />}
          {currentPage === 'quiz-results' && <QuizResults />}
          {currentPage === 'quiz-history' && <QuizHistory />}

          {/* Social */}
          {currentPage === 'friends' && <FriendsPage />}
          {currentPage === 'messages' && <ChatPage />}
          {currentPage === 'groups' && <GroupsPage />}
          {currentPage === 'group-chat' && <GroupChat />}

          {/* Profile */}
          {currentPage === 'profile' && <ProfilePage />}

          {/* Study Timer */}
          {currentPage === 'timer' && <StudyTimer />}

          {/* Leaderboard */}
          {currentPage === 'leaderboard' && <LeaderboardPage />}

          {/* Achievements */}
          {currentPage === 'achievements' && <AchievementsPage />}

          {/* Flashcards */}
          {currentPage === 'flashcards' && <FlashcardsPage />}

          {/* Analytics */}
          {currentPage === 'analytics' && <AnalyticsPage />}

          {/* Settings */}
          {currentPage === 'settings' && <SettingsPage />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation (mobile only) */}
      {needsSidebar && <BottomNav />}
    </div>
  )
}

export default function Home() {
  return <AppRouter />
}
