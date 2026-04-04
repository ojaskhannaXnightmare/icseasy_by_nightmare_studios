'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, BookOpen, Target, Flame, FileText,
  Award, Save, ChevronRight, Edit3, Camera, LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function ProfilePage() {
  const {
    user, setCurrentPage, logout, totalNotes, totalQuizzes, avgScore
  } = useStore()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [studyPrefs, setStudyPrefs] = useState('')
  const [bookmarkedNotes, setBookmarkedNotes] = useState<{ id: string; title: string; subject: string }[]>([])

  const updateProfileState = (data: { name?: string; bio?: string; studyPrefs?: string; bookmarkedNotes?: { id: string; title: string; subject: string }[] }) => {
    if (data.name !== undefined) setName(data.name)
    if (data.bio !== undefined) setBio(data.bio)
    if (data.studyPrefs !== undefined) setStudyPrefs(data.studyPrefs)
    if (data.bookmarkedNotes !== undefined) setBookmarkedNotes(data.bookmarkedNotes)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          updateProfileState({
            name: data.user?.name || user?.name || '',
            bio: data.user?.bio || '',
            studyPrefs: data.user?.studyPrefs || '',
            bookmarkedNotes: Array.isArray(data.bookmarkedNotes) ? data.bookmarkedNotes : []
          })
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, bio, studyPrefs })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          const { setAuth, token } = useStore.getState()
          setAuth(data.user, token || '')
        }
        setSuccess(true)
        setEditing(false)
        toast.success('Profile updated successfully')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const stats = [
    {
      label: 'Total Notes',
      value: totalNotes,
      icon: FileText,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: 'Quizzes Taken',
      value: totalQuizzes,
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Avg Score',
      value: `${avgScore}%`,
      icon: Award,
      color: avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400',
      bgColor: avgScore >= 80 ? 'bg-green-500/10' : avgScore >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10',
      borderColor: avgScore >= 80 ? 'border-green-500/20' : avgScore >= 60 ? 'border-amber-500/20' : 'border-red-500/20'
    },
    {
      label: 'Streak',
      value: `${user?.streak || 0} days`,
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ]

  const SUBJECT_COLORS: Record<string, string> = {
    'English': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'Mathematics': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'Physics': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'Chemistry': 'text-green-400 bg-green-400/10 border-green-400/20',
    'Biology': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'History': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'Geography': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Computer Science': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen lg:pl-[260px] p-4 md:p-6 lg:p-8 pt-14 lg:pt-0 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Profile</h1>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl bg-white/5" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />)}
          </div>
          <Skeleton className="h-64 rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 md:p-8 neon-border relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Avatar with animated gradient glow ring */}
              <div className="relative group">
                <div className="avatar-glow avatar-glow-rounded">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                    <Avatar className="w-24 h-24 h-full w-full rounded-2xl">
                      <AvatarImage src={user?.avatarUrl || undefined} className="object-cover" />
                      <AvatarFallback className="bg-transparent text-2xl font-bold text-white/60">
                        {user ? getInitials(user.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="text-center sm:text-left flex-1">
                {editing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-lg font-bold mb-1 focus:border-cyan-500/50 max-w-xs"
                    placeholder="Your name"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white">{user?.name || 'Student'}</h2>
                )}
                <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-400 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email || 'student@icseasy.com'}</span>
                </div>
                {bio && !editing && (
                  <p className="text-sm text-gray-500 mt-2 max-w-md">{bio}</p>
                )}
              </div>

              {/* Edit Button with neon hover glow */}
              <div className="flex items-center gap-2">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="btn-neon btn-neon-hover-glow gap-2 text-sm">
                    <Edit3 className="w-4 h-4" /> Edit
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setEditing(false)} variant="ghost" className="text-gray-400">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="btn-neon-solid gap-2 text-sm">
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center"
              >
                Profile updated successfully!
              </motion.div>
            )}
          </motion.div>

          {/* Edit Form */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 space-y-4"
            >
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Edit Profile
              </h3>
              <div className="space-y-2">
                <Label className="text-gray-400">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 min-h-[80px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Study Preferences</Label>
                <Textarea
                  value={studyPrefs}
                  onChange={(e) => setStudyPrefs(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 min-h-[80px] font-mono text-sm"
                  placeholder='{"preferredSubjects": ["Math", "Physics"], "studyTime": "evening"}'
                />
                <p className="text-xs text-gray-600">JSON format for study preferences</p>
              </div>
            </motion.div>
          )}

          {/* Section divider */}
          <div className="gradient-divider" />

          {/* Stats Grid with enhanced hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="glass rounded-xl p-4 text-center card-glow stat-card-enhanced"
                >
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-2 border ${stat.borderColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {/* Animated stat bar */}
                  <motion.div
                    className="h-0.5 rounded-full bg-white/5 overflow-hidden mb-2 mx-auto"
                    style={{ maxWidth: '80%' }}
                  >
                    <motion.div
                      className={`h-full rounded-full ${stat.bgColor.replace('/10', '/40')}`}
                      initial={{ width: 0 }}
                      animate={{ width: typeof stat.value === 'number' ? `${Math.min(stat.value * 2, 100)}%` : '60%' }}
                      transition={{ duration: 1.2, delay: 0.5 + index * 0.15, ease: 'easeOut' }}
                    />
                  </motion.div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Section divider */}
          {bookmarkedNotes.length > 0 && <div className="gradient-divider" />}

          {/* Bookmarked Notes */}
          {bookmarkedNotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Bookmarked Notes ({bookmarkedNotes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bookmarkedNotes.slice(0, 8).map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="glass rounded-xl p-4 card-glow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{note.title}</p>
                        <div className="mt-1.5">
                          <Badge className={`text-[10px] px-1.5 ${SUBJECT_COLORS[note.subject] || 'text-gray-400 bg-white/5 border border-white/10'}`}>
                            {note.subject}
                          </Badge>
                        </div>
                      </div>
                      <BookOpen className="w-4 h-4 text-gray-600 shrink-0 ml-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-4"
          >
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
