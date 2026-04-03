'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore, type PageType } from '@/store/useStore'

interface ShortcutMapping {
  key: string
  label: string
  page: PageType | null
  category: string
}

export const shortcuts: ShortcutMapping[] = [
  { key: '1', label: 'Dashboard', page: 'dashboard', category: 'Navigation' },
  { key: '2', label: 'AI Tutor', page: 'tutor', category: 'Navigation' },
  { key: '3', label: 'Subjects', page: 'subjects', category: 'Navigation' },
  { key: '4', label: 'Notes', page: 'notes', category: 'Navigation' },
  { key: '5', label: 'Quiz', page: 'quiz-setup', category: 'Navigation' },
  { key: '6', label: 'Study Timer', page: 'timer', category: 'Navigation' },
  { key: '7', label: 'Analytics', page: 'analytics', category: 'Navigation' },
  { key: '8', label: 'Settings', page: 'settings', category: 'Navigation' },
  { key: '9', label: 'Profile', page: 'profile', category: 'Navigation' },
  { key: '0', label: 'Leaderboard', page: 'leaderboard', category: 'Navigation' },
  { key: 'N', label: 'New Note', page: 'notes', category: 'Quick Actions' },
  { key: 'Q', label: 'Quick Quiz', page: 'quiz-setup', category: 'Quick Actions' },
  { key: 'T', label: 'Study Timer', page: 'timer', category: 'Quick Actions' },
  { key: '?', label: 'Open Shortcuts', page: null, category: 'System' },
  { key: 'Ctrl+K', label: 'Open Shortcuts', page: null, category: 'System' },
  { key: 'Escape', label: 'Go Back / Close', page: null, category: 'System' },
]

function isInputFocused(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement).tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable
}

export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)
  const { setCurrentPage, navigateBack, user } = useStore()

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const executeShortcut = useCallback((shortcut: ShortcutMapping) => {
    if (shortcut.page) {
      setCurrentPage(shortcut.page)
    }
    setIsOpen(false)
  }, [setCurrentPage])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts if user is not authenticated
      if (!user) return

      // Ctrl+K or Cmd+K always works regardless of modal state or input focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
        return
      }

      // Escape — close modal or go back
      if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault()
          setIsOpen(false)
        } else if (!isInputFocused(e)) {
          navigateBack()
        }
        return
      }

      // If user is typing in an input, ignore all other shortcuts
      if (isInputFocused(e)) return

      // ? to open shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        return
      }

      // When modal is open, handle shortcut keys for navigation
      if (isOpen) {
        const lowerKey = e.key.toLowerCase()

        // Number keys 0-9
        if (/^[0-9]$/.test(lowerKey)) {
          const shortcut = shortcuts.find(s => s.key === lowerKey)
          if (shortcut && shortcut.page) {
            e.preventDefault()
            executeShortcut(shortcut)
          }
          return
        }

        // Letter keys
        if (/^[a-z]$/.test(lowerKey)) {
          const shortcut = shortcuts.find(s => s.key.toLowerCase() === lowerKey)
          if (shortcut && shortcut.page) {
            e.preventDefault()
            executeShortcut(shortcut)
          }
          return
        }
        return
      }

      // When modal is NOT open, handle direct shortcuts
      const lowerKey = e.key.toLowerCase()

      // N — New Note
      if (lowerKey === 'n') {
        e.preventDefault()
        setCurrentPage('notes')
        return
      }

      // Q — Quick Quiz
      if (lowerKey === 'q') {
        e.preventDefault()
        setCurrentPage('quiz-setup')
        return
      }

      // T — Study Timer
      if (lowerKey === 't') {
        e.preventDefault()
        setCurrentPage('timer')
        return
      }

      // Number keys for quick navigation (without modal)
      if (/^[0-9]$/.test(lowerKey)) {
        const shortcut = shortcuts.find(s => s.key === lowerKey)
        if (shortcut && shortcut.page) {
          e.preventDefault()
          setCurrentPage(shortcut.page)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setCurrentPage, navigateBack, user, toggle, executeShortcut])

  return { isOpen, toggle, close, executeShortcut }
}
