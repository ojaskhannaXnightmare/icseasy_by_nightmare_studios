'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Keyboard, ArrowRight, Zap, Navigation, Settings } from 'lucide-react'
import { useKeyboardShortcuts, shortcuts } from '@/hooks/useKeyboardShortcuts'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const categoryIcons: Record<string, React.ElementType> = {
  'Navigation': Navigation,
  'Quick Actions': Zap,
  'System': Settings,
}

const categoryColors: Record<string, string> = {
  'Navigation': 'text-[#00f0ff]',
  'Quick Actions': 'text-[#a855f7]',
  'System': 'text-[#ec4899]',
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md bg-white/10 border border-white/10 text-xs font-mono font-medium text-foreground/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]">
      {children}
    </kbd>
  )
}

export default function KeyboardShortcuts() {
  const { isOpen, close, executeShortcut } = useKeyboardShortcuts()
  const { currentPage } = useStore()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Group and filter shortcuts
  const filteredGroups = useMemo(() => {
    const query = search.toLowerCase().trim()
    const filtered = query
      ? shortcuts.filter(
          s =>
            s.label.toLowerCase().includes(query) ||
            s.key.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query)
        )
      : shortcuts

    const groups: Record<string, typeof shortcuts> = {}
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = []
      groups[s.category].push(s)
    }
    return groups
  }, [search])

  const flatList = useMemo(() => {
    return Object.values(filteredGroups).flat()
  }, [filteredGroups])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      // Focus search input after animation
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Clamp selected index when flat list changes
  useEffect(() => {
    if (selectedIndex >= flatList.length) {
      setSelectedIndex(Math.max(0, flatList.length - 1))
    }
  }, [flatList.length, selectedIndex])

  // Keyboard navigation within modal
  useEffect(() => {
    if (!isOpen) return

    function handleModalKeys(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % flatList.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + flatList.length) % flatList.length)
      } else if (e.key === 'Enter') {
        const item = flatList[selectedIndex]
        if (item) {
          e.preventDefault()
          executeShortcut(item)
        }
      }
    }

    window.addEventListener('keydown', handleModalKeys)
    return () => window.removeEventListener('keydown', handleModalKeys)
  }, [isOpen, flatList, selectedIndex, executeShortcut])

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex, isOpen])

  // Track flat index for grouped rendering
  let flatIndex = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen glass-strong backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] glass-strong"
            onClick={close}
          />

          {/* Centered modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[61] flex items-start justify-center pt-[15vh]"
            onClick={close}
          >
            <div
              className="w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Search header */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value)
                      setSelectedIndex(0)
                    }}
                    placeholder="Search shortcuts..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <KeyBadge className="shrink-0">Esc</KeyBadge>
                </div>
              </div>

              {/* Shortcuts list */}
              <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                {Object.entries(filteredGroups).length === 0 ? (
                  <div className="p-8 text-center">
                    <Keyboard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No shortcuts found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  Object.entries(filteredGroups).map(([category, items]) => {
                    const CategoryIcon = categoryIcons[category] || Settings
                    const categoryColor = categoryColors[category] || 'text-muted-foreground'

                    return (
                      <div key={category} className="mb-3 last:mb-0">
                        {/* Category header */}
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <CategoryIcon className={cn('w-3.5 h-3.5', categoryColor)} />
                          <span className={cn('text-[11px] font-semibold uppercase tracking-wider', categoryColor)}>
                            {category}
                          </span>
                        </div>

                        {/* Shortcut items */}
                        <div className="space-y-0.5">
                          {items.map(item => {
                            const currentIndex = flatIndex++
                            const isSelected = currentIndex === selectedIndex
                            const isActive = item.page === currentPage

                            return (
                              <button
                                key={`${item.category}-${item.key}`}
                                data-index={currentIndex}
                                onClick={() => executeShortcut(item)}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150',
                                  'group cursor-pointer',
                                  isSelected
                                    ? 'bg-[#00f0ff]/10 text-[#00f0ff]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                )}
                              >
                                {/* Key badge */}
                                <KeyBadge>
                                  {item.key}
                                </KeyBadge>

                                {/* Label */}
                                <span className={cn(
                                  'flex-1 text-sm',
                                  isActive && !isSelected && 'text-[#00f0ff]/70'
                                )}>
                                  {item.label}
                                </span>

                                {/* Active indicator or navigate hint */}
                                {isActive ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
                                    Current
                                  </span>
                                ) : item.page ? (
                                  <ArrowRight className={cn(
                                    'w-3.5 h-3.5 opacity-0 transition-opacity',
                                    isSelected ? 'opacity-60' : 'group-hover:opacity-40'
                                  )} />
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5">
                      <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/10 text-[10px] font-mono border border-white/10">↑</kbd>
                      <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/10 text-[10px] font-mono border border-white/10">↓</kbd>
                    </span>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-white/10 text-[10px] font-mono border border-white/10">↵</kbd>
                    Select
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/40">
                  {shortcuts.length} shortcuts
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
