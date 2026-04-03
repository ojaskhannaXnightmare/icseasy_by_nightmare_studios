'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Bell,
  Timer,
  Trophy,
  Award,
  Layers,
  BarChart3,
  History,
  Settings,
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
import { authFetch } from '@/lib/api'

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
  { icon: History, label: 'Quiz History', page: 'quiz-history' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Layers, label: 'Flashcards', page: 'flashcards' },
  { icon: Timer, label: 'Study Timer', page: 'timer' },
  { icon: Trophy, label: 'Leaderboard', page: 'leaderboard' },
  { icon: Award, label: 'Achievements', page: 'achievements' },
  { icon: Users, label: 'Friends', page: 'friends' },
  { icon: MessageSquare, label: 'Groups', page: 'groups' },
  { icon: Settings, label: 'Settings', page: 'settings' },
  { icon: User, label: 'Profile', page: 'profile' },
]

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  color: string
  isRead: boolean
  createdAt: string
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, collapsed = false }: {
  notifications: NotificationItem[]
  unreadCount: number
  onMarkAllRead: () => void
  collapsed?: boolean
}) {
  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <Bell className="w-5 h-5 text-gray-600" />
        </div>
        <p className="text-xs text-gray-500">No notifications yet</p>
        <p className="text-[10px] text-gray-600 mt-0.5">We&apos;ll notify you about quiz scores, streaks, and more</p>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="max-h-72">
        {notifications.map(n => (
          <div
            key={n.id}
            className={cn(
              'px-3 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer',
              !n.isRead && 'bg-white/[0.02]'
            )}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{getRelativeTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-[#00f0ff] mt-1.5 shrink-0" />
              )}
            </div>
          </div>
        ))}
      </ScrollArea>
      {unreadCount > 0 && (
        <div className="p-2 border-t border-white/5">
          <button
            onClick={(e) => { e.stopPropagation(); onMarkAllRead() }}
            className="w-full text-center text-xs text-[#00f0ff] hover:text-[#00f0ff]/80 py-1.5 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </>
  )
}

function NotificationBell({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // ignore fetch errors
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and poll every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await authFetch('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ all: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const dropdownContent = (
    <div className="glass-strong rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
            {unreadCount} new
          </span>
        )}
      </div>
      {loading ? (
        <div className="p-6 text-center">
          <div className="w-4 h-4 border-2 border-white/10 border-t-[#00f0ff] rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          collapsed={collapsed}
        />
      )}
    </div>
  )

  if (collapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </span>
          )}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-full ml-2 mt-1 w-80 z-50"
            >
              {dropdownContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex justify-end" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="w-4.5 h-4.5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.5)]">
            <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-80 z-50"
          >
            {dropdownContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent({ collapsed = false }: { collapsed?: boolean }) {
  const { currentPage, setCurrentPage, logout } = useStore()

  return (
    <div className="flex flex-col h-full">
      {/* Logo + Notification Bell */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-[#0a0a0f]" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0 flex-1"
          >
            <h1 className="text-lg font-bold gradient-text leading-tight">ICSEasy</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Nightmare Studios
            </p>
          </motion.div>
        )}
        <NotificationBell collapsed={collapsed} />
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
