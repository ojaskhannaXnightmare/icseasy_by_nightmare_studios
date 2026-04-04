'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  ArrowLeft,
  BookOpen,
  Bell,
  Eye,
  User,
  Trash2,
  Save,
  Loader2,
  Clock,
  Target,
  GraduationCap,
  Check,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface UserSettings {
  studyGoalMinutes: number
  notificationsEnabled: boolean
  dailyReminderTime: string
  theme: string
  focusMode: boolean
  defaultDifficulty: string
  preferredSubjects: string[]
}

const ICSE_SUBJECTS = [
  { id: 'english', label: 'English Language', icon: '📚' },
  { id: 'mathematics', label: 'Mathematics', icon: '📐' },
  { id: 'physics', label: 'Physics', icon: '⚛️' },
  { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { id: 'biology', label: 'Biology', icon: '🧬' },
  { id: 'history', label: 'History & Civics', icon: '📜' },
  { id: 'geography', label: 'Geography', icon: '🌍' },
  { id: 'computer', label: 'Computer Science', icon: '💻' },
]

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const

const REMINDER_TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00',
]

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card rounded-xl p-6 space-y-4">
          <Skeleton className="h-6 w-40 bg-white/5" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-10 w-full bg-white/5" />
            <Skeleton className="h-4 w-3/4 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { setCurrentPage, user, setSidebarOpen } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [settings, setSettings] = useState<UserSettings>({
    studyGoalMinutes: 30,
    notificationsEnabled: true,
    dailyReminderTime: '09:00',
    theme: 'cyberpunk',
    focusMode: false,
    defaultDifficulty: 'Medium',
    preferredSubjects: [],
  })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await authFetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setEmail(data.email)
      setSettings((prev) => ({ ...prev, ...data.settings }))
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }
      toast.success('Settings saved successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both password fields')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setChangingPassword(true)
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          changePassword: { currentPassword, newPassword },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password')
      }
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      toast.error(message)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ deleteAccount: true }),
      })
      if (!res.ok) throw new Error('Failed to delete account')
      toast.success('Account deleted. Goodbye!')
      // Use logout from store to clear everything
      const { logout } = useStore.getState()
      logout()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      toast.error(message)
    }
  }

  const toggleSubject = (subjectId: string) => {
    setSettings((prev) => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.includes(subjectId)
        ? prev.preferredSubjects.filter((s) => s !== subjectId)
        : [...prev.preferredSubjects, subjectId],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/5" />
            <Skeleton className="h-8 w-48 bg-white/5" />
          </div>
          <SettingsSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage('dashboard')}
            className="rounded-lg hover:bg-white/5 text-muted-foreground hover:text-[#00f0ff] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f0ff]/20 to-[#a855f7]/20 border border-[#00f0ff]/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Settings</h1>
            <p className="text-xs text-muted-foreground">Customize your learning experience</p>
          </div>
        </motion.div>

        {/* Study Preferences */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#a855f7]" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Study Preferences</h2>
          </div>

          {/* Daily Study Goal */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Daily Study Goal
              </Label>
              <span className="text-sm font-semibold text-[#00f0ff]">
                {settings.studyGoalMinutes} min
              </span>
            </div>
            <Slider
              value={[settings.studyGoalMinutes]}
              onValueChange={([val]) => setSettings((prev) => ({ ...prev, studyGoalMinutes: val }))}
              min={15}
              max={120}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/60">
              <span>15 min</span>
              <span>120 min</span>
            </div>
          </div>

          <Separator className="bg-white/5 mb-6" />

          {/* Default Difficulty */}
          <div className="mb-6">
            <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              Default Difficulty
            </Label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isActive = settings.defaultDifficulty === diff
                const colorMap = {
                  Easy: { active: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-400', dot: 'bg-emerald-400' },
                  Medium: { active: 'from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400', dot: 'bg-amber-400' },
                  Hard: { active: 'from-red-500/20 to-red-500/5 border-red-500/40 text-red-400', dot: 'bg-red-400' },
                }
                const colors = colorMap[diff]
                return (
                  <button
                    key={diff}
                    onClick={() => setSettings((prev) => ({ ...prev, defaultDifficulty: diff }))}
                    className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isActive
                        ? `bg-gradient-to-b ${colors.active} border shadow-sm`
                        : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
                    {diff}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator className="bg-white/5 mb-6" />

          {/* Preferred Subjects */}
          <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              Preferred Subjects
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ICSE_SUBJECTS.map((subject) => {
                const isSelected = settings.preferredSubjects.includes(subject.id)
                return (
                  <label
                    key={subject.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#00f0ff]/5 border-[#00f0ff]/20'
                        : 'bg-white/[0.01] border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSubject(subject.id)}
                      className="data-[state=checked]:bg-[#00f0ff] data-[state=checked]:border-[#00f0ff] data-[state=checked]:text-[#0a0a0f]"
                    />
                    <span className="text-sm">{subject.icon}</span>
                    <span className={`text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {subject.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </motion.div>

        <div className="gradient-divider my-4" />
        {/* Notifications */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#ec4899]/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#ec4899]" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>

          {/* Enable Notifications */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Label className="text-sm font-medium text-foreground">Enable Notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Get reminders and updates</p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notificationsEnabled: checked }))
              }
              className="data-[state=checked]:bg-[#00f0ff]"
            />
          </div>

          <Separator className="bg-white/5 mb-6" />

          {/* Daily Reminder Time */}
          <div className={`transition-opacity duration-300 ${settings.notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#ec4899]" />
                  Daily Reminder Time
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">When to remind you to study</p>
              </div>
              <Select
                value={settings.dailyReminderTime}
                onValueChange={(val) =>
                  setSettings((prev) => ({ ...prev, dailyReminderTime: val }))
                }
              >
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f]/95 border-white/10 backdrop-blur-xl max-h-64 overflow-y-auto">
                  {REMINDER_TIMES.map((time) => (
                    <SelectItem key={time} value={time} className="text-foreground focus:bg-white/5 focus:text-[#00f0ff]">
                      {formatTime(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <div className="gradient-divider my-4" />
        {/* Appearance */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          </div>

          {/* Focus Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Focus Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Hide sidebar for distraction-free studying</p>
            </div>
            <Switch
              checked={settings.focusMode}
              onCheckedChange={(checked) => {
                setSettings((prev) => ({ ...prev, focusMode: checked }))
                setSidebarOpen(!checked)
              }}
              className="data-[state=checked]:bg-[#00f0ff]"
            />
          </div>
        </motion.div>

        <div className="gradient-divider my-4" />
        {/* Account */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <User className="w-4 h-4 text-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
          </div>

          {/* Email */}
          <div className="mb-6">
            <Label className="text-sm text-muted-foreground">Email Address</Label>
            <div className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span className="text-sm text-foreground">{email}</span>
            </div>
          </div>

          <Separator className="bg-white/5 mb-6" />

          {/* Change Password */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Change Password
            </Label>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-[#00f0ff]/50 focus-visible:ring-[#00f0ff]/20 input-lift"
              />
              <Input
                type="password"
                placeholder="New password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-[#00f0ff]/50 focus-visible:ring-[#00f0ff]/20 input-lift"
              />
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword}
                variant="outline"
                className="w-full sm:w-auto border-white/10 hover:bg-white/5 hover:border-white/20 text-foreground transition-all btn-shimmer-hover"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </div>
          </div>

          <Separator className="bg-white/5 mb-6" />

          {/* Delete Account */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-red-400">Delete Account</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0a0a0f]/95 backdrop-blur-xl border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-400">Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete your account and remove
                    all of your notes, quiz attempts, flashcards, and other data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 text-foreground hover:bg-white/5">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white hover:bg-red-700 border-0"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => fetchSettings()}
            className="border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-[#0a0a0f] font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 hover:scale-[1.02] btn-shimmer-hover"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
