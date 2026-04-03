'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Brain,
  User,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Home', page: 'dashboard' as const },
  { icon: BookOpen, label: 'Subjects', page: 'subjects' as const },
  { icon: Bot, label: 'AI Tutor', page: 'tutor' as const, center: true },
  { icon: Brain, label: 'Quiz', page: 'quiz-setup' as const },
  { icon: User, label: 'Profile', page: 'profile' as const },
]

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useStore()

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
    >
      <div className="mx-3 mb-3 rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] relative">
        {/* Gradient line at top */}
        <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent" />
        <nav className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = currentPage === item.page
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
                    <Icon className={cn(
                      'w-6 h-6 transition-colors',
                      isActive ? 'text-[#0a0a0f]' : 'text-[#0a0a0f]'
                    )} />
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
                className="flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px]"
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
        </nav>
      </div>
    </motion.div>
  )
}
