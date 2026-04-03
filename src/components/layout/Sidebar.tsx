'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  FileText,
  Search,
  Brain,
  Users,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useStore, type PageType } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  page: PageType
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Bot, label: 'AI Tutor', page: 'tutor' },
  { icon: BookOpen, label: 'Subjects', page: 'subjects' },
  { icon: FileText, label: 'Notes', page: 'notes' },
  { icon: Search, label: 'Research', page: 'research' },
  { icon: Brain, label: 'Quiz', page: 'quiz-setup' },
  { icon: Users, label: 'Friends', page: 'friends' },
  { icon: MessageSquare, label: 'Groups', page: 'groups' },
  { icon: User, label: 'Profile', page: 'profile' },
]

function SidebarContent({ collapsed = false }: { collapsed?: boolean }) {
  const { currentPage, setCurrentPage, logout } = useStore()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-[#0a0a0f]" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0"
          >
            <h1 className="text-lg font-bold gradient-text leading-tight">ICSEasy</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Nightmare Studios
            </p>
          </motion.div>
        )}
      </div>

      <Separator className="bg-white/5" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page
            const Icon = item.icon
            return (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full text-left',
                  'hover:bg-white/5',
                  isActive
                    ? 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-colors',
                    isActive ? 'text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : ''
                  )}
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                  />
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/5" />

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 w-full text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore()

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] glass-strong z-40 flex-col"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg glass neon-border border-[#00f0ff]/20 hover:bg-[#00f0ff]/10"
            >
              <Menu className="w-5 h-5 text-[#00f0ff]" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 p-0"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile overlay gradient indicator */}
      <div className="lg:hidden fixed top-4 left-16 z-40">
        <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-neon-pulse" />
      </div>
    </>
  )
}
