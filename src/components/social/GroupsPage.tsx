'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, ChevronRight, MessageCircle, Loader2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { useStore, type GroupData } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function GroupsPage() {
  const { setCurrentPage, setSelectedGroup } = useStore()
  const [groups, setGroups] = useState<GroupData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const loadGroups = async () => {
    try {
      const res = await authFetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const init = async () => {
      await loadGroups()
      setLoading(false)
    }
    init()
  }, [])

  const createGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name')
      return
    }
    setCreating(true)
    setError('')
    try {
      const res = await authFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupName.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        setShowCreateDialog(false)
        setGroupName('')
        toast.success('Group created successfully')
        loadGroups()
      } else {
        setError(data.error || 'Failed to create group')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setCreating(false)
  }

  const openGroupChat = (group: GroupData) => {
    setSelectedGroup(group)
    setCurrentPage('group-chat')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getGroupColor = (name: string) => {
    const colors = [
      'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
      'from-purple-500/20 to-purple-600/5 border-purple-500/20',
      'from-pink-500/20 to-pink-600/5 border-pink-500/20',
      'from-green-500/20 to-green-600/5 border-green-500/20',
      'from-amber-500/20 to-amber-600/5 border-amber-500/20',
      'from-violet-500/20 to-violet-600/5 border-violet-500/20',
    ]
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getGroupGlow = (name: string) => {
    const glows = [
      '0 0 20px rgba(0,240,255,0.1)',
      '0 0 20px rgba(168,85,247,0.1)',
      '0 0 20px rgba(236,72,153,0.1)',
      '0 0 20px rgba(34,197,94,0.1)',
      '0 0 20px rgba(245,158,11,0.1)',
      '0 0 20px rgba(139,92,246,0.1)',
    ]
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return glows[hash % glows.length]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen lg:pl-[260px] p-4 md:p-6 lg:p-8 pt-14 lg:pt-0 max-w-4xl mx-auto relative overflow-hidden"
    >
      {/* Floating orbs */}
      <motion.div
        className="fixed top-10 right-20 w-[300px] h-[300px] rounded-full pointer-events-none floating-orb"
        style={{ backgroundColor: 'rgba(0,240,255,0.05)' }}
        animate={{
          x: [0, 15, -10, 20, 0],
          y: [0, -15, 10, -10, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-20 left-10 w-[250px] h-[250px] rounded-full pointer-events-none floating-orb floating-delayed"
        style={{ backgroundColor: 'rgba(168,85,247,0.05)' }}
        animate={{
          x: [0, -10, 15, -5, 0],
          y: [0, 10, -15, 5, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('dashboard')}
              className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
            </motion.button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
                <Users className="w-7 h-7" />
                Study Groups
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {groups.length} groups
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="btn-neon-solid btn-shimmer gap-2 px-4 py-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </motion.div>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl bg-white/5 shimmer" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            {/* Enhanced empty state with orbital animation */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border border-white/5 orbital-ring" />
              <div className="absolute inset-4 rounded-full border border-dashed border-white/5 orbital-ring" style={{ animationDirection: 'reverse', animationDuration: '9s' }} />
              <div className="absolute inset-8 rounded-full border border-white/5 orbital-ring" style={{ animationDuration: '18s' }} />
              {/* Orbital dots */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="orbital-dot" style={{ animationDuration: '12s' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/30 shadow-[0_0_10px_rgba(0,240,255,0.3)]" />
                </div>
              </div>
              <div className="absolute bottom-4 right-0">
                <div className="orbital-dot" style={{ animationDuration: '9s' }}>
                  <div className="w-2 h-2 rounded-full bg-purple-400/30 shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
                </div>
              </div>
              <div className="absolute top-8 -left-2">
                <div className="orbital-dot" style={{ animationDuration: '18s' }}>
                  <div className="w-2 h-2 rounded-full bg-pink-400/30 shadow-[0_0_8px_rgba(236,72,153,0.3)]" />
                </div>
              </div>
              {/* Center icon */}
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
              </motion.div>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 mb-2"
            >
              No groups yet
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-600 mb-6"
            >
              Create a study group to collaborate with classmates
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => setShowCreateDialog(true)} className="btn-neon gap-2">
                <Plus className="w-4 h-4" /> Create Group
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="glass-card rounded-xl p-5 card-glow group-card-gradient cursor-pointer group relative overflow-hidden"
                  onClick={() => openGroupChat(group)}
                >
                  {/* Decorative gradient */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGroupColor(group.name).replace('border-', '')}`} />

                  <div className="flex items-start gap-4">
                    <motion.div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGroupColor(group.name)} flex items-center justify-center shrink-0 border`}
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      style={{ boxShadow: getGroupGlow(group.name) }}
                    >
                      <span className="text-lg font-bold text-white/80">
                        {getInitials(group.name)}
                      </span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="border-white/10 text-gray-500 text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {group.members?.length || 0} members
                        </Badge>
                      </div>
                      {/* Member avatars with stacking effect */}
                      {group.members && group.members.length > 0 && (
                        <div className="flex items-center mt-3 avatar-stack">
                          {group.members.slice(0, 5).map((member, mi) => (
                            <motion.div
                              key={member.userId}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.06 + mi * 0.05, type: 'spring', stiffness: 400 }}
                              whileHover={{ scale: 1.15, zIndex: 10 }}
                            >
                              <Avatar className="w-7 h-7 border-2 border-[#0f0f19] ring-1 ring-cyan-500/20">
                                <AvatarImage src={member.user?.avatarUrl || undefined} />
                                <AvatarFallback className="bg-white/10 text-[9px] text-gray-400">
                                  {getInitials(member.user?.name || '?')}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                          ))}
                          {(group.members.length || 0) > 5 && (
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-gray-400 border-2 border-[#0f0f19]">
                              +{(group.members.length || 0) - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-all duration-200 shrink-0 mt-1 group-hover:scale-110" />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-3">
                    Created {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Group Dialog with glassmorphism */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-strong border border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Create Study Group
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a group to study together with your classmates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-gray-300">Group Name</Label>
              <Input
                placeholder="e.g., Physics Study Squad, Math Masters..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 input-lift transition-all duration-200"
                maxLength={50}
              />
              <p className="text-xs text-gray-600">{groupName.length}/50 characters</p>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCreateDialog(false); setError('') }} className="text-gray-400">Cancel</Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={createGroup} disabled={creating || !groupName.trim()} className="btn-neon-solid gap-2">
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Group</>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
