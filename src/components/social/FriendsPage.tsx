'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, CheckCircle, XCircle,
  ChevronRight, MessageCircle, User, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { useStore, type FriendData } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'

interface FriendRequest {
  id: string
  user: { id: string; name: string; email: string; avatarUrl?: string | null }
  status: 'pending'
}

export default function FriendsPage() {
  const { setCurrentPage, setSelectedFriend, user } = useStore()
  const [friends, setFriends] = useState<FriendData[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addingFriend, setAddingFriend] = useState(false)
  const [addError, setAddError] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/friends')
      if (res.ok) {
        const data = await res.json()
        setFriends(Array.isArray(data.friends) ? data.friends : [])
        setRequests(Array.isArray(data.pendingRequests) ? data.pendingRequests.map((r: { id: string; sender: { id: string; name: string; email: string; avatarUrl?: string | null } }) => ({
          id: r.id,
          user: r.sender,
          status: 'pending' as const
        })) : [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddFriend = async () => {
    if (!addEmail.trim()) return
    setAddingFriend(true)
    setAddError('')
    try {
      const res = await authFetch('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ receiverEmail: addEmail.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        setShowAddDialog(false)
        setAddEmail('')
        toast.success('Friend request sent')
        fetchData()
      } else {
        setAddError(data.error || 'Failed to send friend request')
      }
    } catch {
      setAddError('Network error. Please try again.')
    }
    setAddingFriend(false)
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await authFetch(`/api/friends/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' })
      })
      setRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success('Friend request accepted')
      fetchData()
    } catch { /* ignore */ }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await authFetch(`/api/friends/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' })
      })
      setRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success('Friend request rejected')
    } catch { /* ignore */ }
  }

  const openChat = (friend: FriendData) => {
    setSelectedFriend(friend)
    setCurrentPage('messages')
  }

  const filteredFriends = friends.filter(f =>
    searchQuery === '' ||
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (online: boolean) => {
    return online ? 'bg-green-400' : 'bg-gray-600'
  }

  const getStatusText = (friend: FriendData) => {
    if (friend.isOnline) return 'Online'
    if (friend.lastSeen) {
      const diff = Date.now() - new Date(friend.lastSeen).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 60) return `${mins}m ago`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours}h ago`
      return `${Math.floor(hours / 24)}d ago`
    }
    return 'Offline'
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
              Friends
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {friends.length} friends • {requests.length} pending requests
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="btn-neon-solid gap-2 px-4 py-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Friend
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 focus:border-cyan-500/50 text-white placeholder:text-gray-600 glass"
        />
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Requests ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={req.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-white/10 text-gray-400 text-sm">
                      {getInitials(req.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{req.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{req.user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(req.id)}
                    className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 gap-1 px-3"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Accept</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRejectRequest(req.id)}
                    variant="ghost"
                    className="text-gray-500 hover:text-red-400 p-2"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <Separator className="mt-6 bg-white/5" />
        </motion.div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          All Friends ({friends.length})
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-gray-400 mb-2">
              {searchQuery ? 'No friends found' : 'No friends yet'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery ? 'Try a different search' : 'Add friends to start collaborating'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)} className="btn-neon gap-2">
                <UserPlus className="w-4 h-4" /> Add Friend
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredFriends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass rounded-xl p-4 flex items-center gap-3 card-glow cursor-pointer group"
                  onClick={() => openChat(friend)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-11 h-11 border border-white/10">
                      <AvatarImage src={friend.avatarUrl || undefined} />
                      <AvatarFallback className="bg-white/10 text-gray-400">
                        {getInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${getStatusColor(friend.isOnline)} border-2 border-[#0a0a0f]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                      {friend.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      friend.isOnline
                        ? 'border-green-500/20 text-green-400'
                        : 'border-white/5 text-gray-600'
                    }`}>
                      {getStatusText(friend)}
                    </Badge>
                    <MessageCircle className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-strong border border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Add Friend
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your friend&apos;s email address to send a friend request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50"
            />
            {addError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {addError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAddDialog(false); setAddError('') }} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleAddFriend} disabled={addingFriend || !addEmail.trim()} className="btn-neon-solid gap-2">
              {addingFriend ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Send Request</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
