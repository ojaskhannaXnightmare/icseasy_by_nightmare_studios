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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen lg:pl-[260px] p-4 md:p-6 lg:p-8 pt-14 lg:pt-0 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
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
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="btn-neon-solid gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg text-gray-400 mb-2">No groups yet</h3>
          <p className="text-sm text-gray-600 mb-4">Create a study group to collaborate with classmates</p>
          <Button onClick={() => setShowCreateDialog(true)} className="btn-neon gap-2">
            <Plus className="w-4 h-4" /> Create Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-5 card-glow cursor-pointer group relative overflow-hidden"
                onClick={() => openGroupChat(group)}
              >
                {/* Decorative gradient */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGroupColor(group.name).replace('border-', '')}`} />

                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGroupColor(group.name)} flex items-center justify-center shrink-0 border`}>
                    <span className="text-lg font-bold text-white/80">
                      {getInitials(group.name)}
                    </span>
                  </div>
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
                    {/* Member avatars */}
                    {group.members && group.members.length > 0 && (
                      <div className="flex items-center mt-3 -space-x-2">
                        {group.members.slice(0, 5).map((member) => (
                          <Avatar key={member.userId} className="w-7 h-7 border-2 border-[#0f0f19]">
                            <AvatarImage src={member.user?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-white/10 text-[9px] text-gray-400">
                              {getInitials(member.user?.name || '?')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(group.members.length || 0) > 5 && (
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-gray-400 border-2 border-[#0f0f19]">
                            +{(group.members.length || 0) - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
                </div>
                <p className="text-[10px] text-gray-600 mt-3">
                  Created {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Group Dialog */}
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
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50"
                maxLength={50}
              />
              <p className="text-xs text-gray-600">{groupName.length}/50 characters</p>
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCreateDialog(false); setError('') }} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={createGroup} disabled={creating || !groupName.trim()} className="btn-neon-solid gap-2">
              {creating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="w-4 h-4" /> Create Group</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
