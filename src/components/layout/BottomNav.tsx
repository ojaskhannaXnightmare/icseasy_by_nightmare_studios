'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Brain,
  User,
  FileText,
  BarChart3,
  Layers,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Home', page: 'dashboard' as const },
  { icon: BookOpen, label: 'Subjects', page: 'subjects' as const },
  { icon: Bot, label: 'AI Tutor', page: 'tutor' as const, center: true },
  { icon: Brain, label: 'Quiz', page: 'quiz-setup' as const },
  { icon: User, label: 'Profile', page: 'profile' as const },
]

const moreNavItems = [
  { icon: FileText, label: 'Notes', page: 'notes' as const },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' as const },
  { icon: Layers, label: 'Flashcards', page: 'flashcards' as const },
]

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useStore()
  const [showMore, setShowMore] = useState(false)

  const isItemActive = (page: string) => {
    // Active if exact match or related page
    if (currentPage === page) return true
    const relatedPages: Record<string, string[]> = {
      'dashboard': ['dashboard'],
      'subjects': ['subjects', 'subject-detail'],
      'tutor': ['tutor'],
      'quiz-setup': ['quiz-setup', 'quiz-active', 'quiz-results'],
      'profile': ['profile'],
      'notes': ['notes', 'research'],
      'analytics': ['analytics'],
      'flashcards': ['flashcards'],
    }
    return relatedPages[page]?.includes(currentPage) || false
  }

  return (
    <>
      {/* Main Bottom Nav */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      >
        <div className="mx-3 mb-3 rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] relative">
          {/* Gradient line at top */}
          <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent" />
          <nav className="flex items-center justify-around px-1 py-2">
            {primaryNavItems.map((item) => {
              const isActive = isItemActive(item.page)
              const Icon = item.icon

              if (item.center) {
                return (
                  <motion.button
                    key={item.page}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setCurrentPage(item.page)}
                    className="flex flex-col items-center gap-0.5 relative -mt-6"
                  >
                    {/* Glowing ring around center button */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#a855f7] blur-sm opacity-50" />
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10',
                        isActive
                          ? 'bg-[#00f0ff] shadow-[0_0_24px_rgba(0,240,255,0.4)]'
                          : 'bg-gradient-to-br from-[#00f0ff] to-[#a855f7] shadow-[0_0_16px_rgba(0,240,255,0.2)]'
                      )}
                    >
                      <Icon className="w-6 h-6 text-[#0a0a0f]" />
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium transition-colors relative z-10',
                      isActive ? 'text-[#00f0ff]' : 'text-muted-foreground'
                    )}>
                      {item.label}
                    </span>
                  </motion.button>
                )
              }

              return (
                <motion.button
                  key={item.page}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setCurrentPage(item.page)}
                  className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px]"
                >
                  <div className="relative">
                    <Icon className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : 'text-muted-foreground'
                    )} />
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.6)]"
                      />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium transition-colors',
                    isActive ? 'text-[#00f0ff]' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                </motion.button>
              )
            })}

            {/* More button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowMore(!showMore)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px]"
            >
              <div className="relative">
                <AnimatePresence mode="wait">
                  {showMore ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5 text-[#00f0ff]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="more"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">More</span>
            </motion.button>
          </nav>
        </div>
      </motion.div>

      {/* Expanded More Menu */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setShowMore(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-24 left-3 right-3 z-50 lg:hidden"
            >
              <div className="glass-strong rounded-2xl border border-white/10 shadow-[0_-4px_40px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Quick Access</p>
                </div>
                <div className="p-2">
                  {moreNavItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = isItemActive(item.page)
                    return (
                      <motion.button
                        key={item.page}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setCurrentPage(item.page)
                          setShowMore(false)
                        }}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-[#00f0ff]/10 text-[#00f0ff]'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        )}
                      >
                        <Icon className={cn(
                          'w-5 h-5',
                          isActive ? 'drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : ''
                        )} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="moreMenuActive"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.6)]"
                          />
                        )}
                      </motion.button>
                    )
                  })}

                  {/* Divider */}
                  <div className="my-2 mx-4 border-t border-white/5" />

                  {/* Additional quick links */}
                  {[
                    { icon: BookOpen, label: 'Timer', page: 'timer' as const },
                    { icon: Brain, label: 'Leaderboard', page: 'leaderboard' as const },
                    { icon: Layers, label: 'Achievements', page: 'achievements' as const },
                  ].map((item, index) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.page
                    return (
                      <motion.button
                        key={item.page}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (moreNavItems.length + index) * 0.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setCurrentPage(item.page)
                          setShowMore(false)
                        }}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-[#00f0ff]/10 text-[#00f0ff]'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        )}
                      >
                        <Icon className={cn(
                          'w-5 h-5',
                          isActive ? 'drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : ''
                        )} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="moreMenuActive2"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.6)]"
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
