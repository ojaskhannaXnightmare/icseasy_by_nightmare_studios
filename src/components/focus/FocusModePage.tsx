'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Flame,
  TreePine,
  Coffee,
  Wind,
  CloudLightning,
  Moon,
  Headphones,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Brain,
  GraduationCap,
  Clock,
  Flame as FlameIcon,
  Zap,
  X,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { authFetch } from '@/lib/api'
import { ambientMixer, SOUND_CONFIGS } from '@/lib/audio'

// Pre-computed icon map
const SOUND_ICONS: Record<string, React.ElementType> = {
  rain: CloudRain,
  ocean: Waves,
  fireplace: Flame,
  forest: TreePine,
  coffee: Coffee,
  wind: Wind,
  thunder: CloudLightning,
  night: Moon,
}

// Pre-computed 20 motivational quotes indexed by hour
const QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"It does not matter how slowly you go as long as you do not stop." — Confucius',
  '"Success is the sum of small efforts repeated day in and day out." — Robert Collier',
  '"The only way to do great work is to love what you do." — Steve Jobs',
  '"Believe you can and you\'re halfway there." — Theodore Roosevelt',
  '"Education is the most powerful weapon which you can use to change the world." — Mandela',
  '"The future belongs to those who believe in the beauty of their dreams." — Roosevelt',
  '"Don\'t watch the clock; do what it does. Keep going." — Sam Levenson',
  '"The more that you read, the more things you will know." — Dr. Seuss',
  '"Learning is a treasure that will follow its owner everywhere." — Chinese Proverb',
  '"Study hard what interests you the most in the most undisciplined, irreverent way." — Feynman',
  '"The beautiful thing about learning is that no one can take it away from you." — B.B. King',
  '"Knowledge is power. Information is liberating." — Kofi Annan',
  '"The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice." — Herbert',
  '"An investment in knowledge pays the best interest." — Benjamin Franklin',
  '"Live as if you were to die tomorrow. Learn as if you were to live forever." — Gandhi',
  '"The mind is not a vessel to be filled but a fire to be kindled." — Plutarch',
  '"Tell me and I forget, teach me and I remember, involve me and I learn." — Franklin',
  '"The only person you are destined to become is the person you decide to be." — Emerson',
  '"Push yourself, because no one else is going to do it for you."',
]

// Pre-computed decorative particle positions
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: ((i * 137.5) % 100),
  y: ((i * 73.3) % 100),
  size: 2 + (i % 4),
  opacity: 0.1 + (i % 5) * 0.04,
  duration: 4 + (i % 3) * 2,
  delay: (i * 0.3) % 6,
}))

const FOCUS_DURATION = 25 * 60  // 25 minutes
const BREAK_DURATION = 5 * 60   // 5 minutes
const RING_RADIUS = 120
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

type TimerMode = 'focus' | 'break'

export default function FocusModePage() {
  const { setCurrentPage, streak } = useStore()

  // Timer state
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sound state
  const [mixerExpanded, setMixerExpanded] = useState(false)
  const [soundActive, setSoundActive] = useState<Record<string, boolean>>({})
  const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>(
    Object.fromEntries(SOUND_CONFIGS.map(s => [s.id, 50]))
  )
  const [masterVolume, setMasterVolumeState] = useState(50)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Stats state
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Get motivational quote by hour
  const quote = useMemo(() => {
    const hour = new Date().getHours()
    return QUOTES[hour % QUOTES.length]
  }, [])

  // Fetch today's focus minutes on mount
  useEffect(() => {
    let cancelled = false
    const fetchStats = async () => {
      try {
        const res = await authFetch('/api/study-sessions?limit=1')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setTodayMinutes(data.todayFocusMinutes || 0)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setStatsLoaded(true)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [])

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer complete
          setIsRunning(false)
          if (timerRef.current) clearInterval(timerRef.current)

          const completedMode = mode
          const isFocus = completedMode === 'focus'

          // Save session
          const duration = isFocus ? FOCUS_DURATION : BREAK_DURATION
          authFetch('/api/study-sessions', {
            method: 'POST',
            body: JSON.stringify({ type: completedMode, duration }),
          }).catch(() => {})

          // Refresh stats
          authFetch('/api/study-sessions?limit=1')
            .then(res => res.ok ? res.json() : {})
            .then(data => setTodayMinutes(data.todayFocusMinutes || 0))
            .catch(() => {})

          // Show notification
          const msg = isFocus
            ? 'Focus session complete! Take a break.'
            : 'Break over! Time to focus.'
          setNotificationMessage(msg)
          setShowNotification(true)
          setTimeout(() => setShowNotification(false), 4000)

          // Auto-transition
          if (isFocus) {
            setSessions(s => s + 1)
            setMode('break')
            return BREAK_DURATION
          } else {
            setMode('focus')
            return FOCUS_DURATION
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode])

  // Initialize audio on first interaction
  const initAudio = useCallback(async () => {
    if (audioInitialized) return
    await ambientMixer.init()
    setAudioInitialized(true)
  }, [audioInitialized])

  // Toggle sound
  const handleToggleSound = useCallback((id: string) => {
    initAudio()
    ambientMixer.toggle(id)
    const isActive = ambientMixer.isActive(id)
    setSoundActive(prev => ({ ...prev, [id]: isActive }))
  }, [initAudio])

  // Set sound volume
  const handleSetVolume = useCallback((id: string, value: number) => {
    setSoundVolumes(prev => ({ ...prev, [id]: value }))
    ambientMixer.setVolume(id, value)
  }, [])

  // Set master volume
  const handleSetMasterVolume = useCallback((value: number) => {
    setMasterVolumeState(value)
    ambientMixer.setMasterVolume(value / 100)
  }, [])

  // Timer controls
  const handlePlayPause = useCallback(() => {
    initAudio()
    setIsRunning(prev => !prev)
  }, [initAudio])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION)
  }, [mode])

  // Format time display
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Timer progress for SVG ring
  const totalTime = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION
  const elapsed = totalTime - timeLeft
  const progress = elapsed / totalTime
  const strokeDashoffset = RING_CIRCUMFERENCE - (progress * RING_CIRCUMFERENCE)

  // Active sound count
  const activeCount = Object.values(soundActive).filter(Boolean).length

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] pb-24 lg:pb-0">
      {/* Animated background gradient */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(0,240,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(236,72,153,0.06) 0%, transparent 50%)',
            animation: 'focus-bg-shift 20s ease-in-out infinite',
          }}
        />
        {/* Decorative particles */}
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#00f0ff]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Quick access floating side panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3"
      >
        {[
          { icon: BookOpen, label: 'Open Notes', page: 'notes' as const },
          { icon: Brain, label: 'Start Quiz', page: 'quiz-setup' as const },
          { icon: GraduationCap, label: 'View Formulas', page: 'notes' as const },
        ].map(item => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(item.page)}
            className="group relative w-12 h-12 rounded-xl glass-card flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all duration-300"
          >
            <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-[#00f0ff] transition-colors duration-300" />
            <span className="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-[#0f0f19] border border-white/10 text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
              {item.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Exit button */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('dashboard')}
          className="absolute top-4 right-4 lg:top-6 lg:right-6 w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-white/5 transition-colors z-20"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Mode badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Badge
            className={cn(
              'px-4 py-1.5 text-xs font-semibold tracking-wider uppercase border backdrop-blur-md',
              mode === 'focus'
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                : 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
            )}
          >
            <Timer className="w-3 h-3 mr-1.5" />
            {mode === 'focus' ? 'Focus Session' : 'Break Time'}
          </Badge>
        </motion.div>

        {/* Timer Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative mb-8"
        >
          {/* Ambient glow behind timer */}
          <div
            className={cn(
              'absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000',
              mode === 'focus' ? 'bg-[#00f0ff]' : 'bg-[#a855f7]'
            )}
            style={{ transform: 'scale(1.5)' }}
          />

          <svg
            width={RING_RADIUS * 2 + 20}
            height={RING_RADIUS * 2 + 20}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={RING_RADIUS + 10}
              cy={RING_RADIUS + 10}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx={RING_RADIUS + 10}
              cy={RING_RADIUS + 10}
              r={RING_RADIUS}
              fill="none"
              stroke={mode === 'focus' ? '#00f0ff' : '#a855f7'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: `drop-shadow(0 0 8px ${mode === 'focus' ? 'rgba(0,240,255,0.5)' : 'rgba(168,85,247,0.5)'})`,
              }}
            />
          </svg>

          {/* Timer text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                'text-6xl sm:text-7xl font-bold font-mono tracking-wider transition-colors duration-1000',
                mode === 'focus' ? 'text-[#00f0ff]' : 'text-[#a855f7]'
              )}
              style={{
                textShadow: `0 0 30px ${mode === 'focus' ? 'rgba(0,240,255,0.3)' : 'rgba(168,85,247,0.3)'}`,
              }}
            >
              {timeDisplay}
            </span>
            <span className="text-xs text-muted-foreground mt-2 tracking-wider uppercase">
              {mode === 'focus' ? 'Stay Focused' : 'Relax'}
            </span>
          </div>
        </motion.div>

        {/* Timer Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg',
              isRunning
                ? 'glass-card hover:bg-white/5'
                : 'bg-gradient-to-br from-[#00f0ff] to-[#a855f7] shadow-[0_0_30px_rgba(0,240,255,0.2)]'
            )}
          >
            {isRunning ? (
              <Pause className="w-7 h-7 text-[#00f0ff]" />
            ) : (
              <Play className="w-7 h-7 text-[#0a0a0f] ml-0.5" />
            )}
          </motion.button>

          {/* Session counter */}
          <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">
              {sessions}
            </span>
          </div>
        </motion.div>

        {/* Study Stats Widget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mb-6"
        >
          <div className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-[#00f0ff]" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {statsLoaded ? todayMinutes : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Today (min)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FlameIcon className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <p className="text-xl font-bold text-foreground">{streak}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-[#a855f7]" />
                </div>
                <p className="text-xl font-bold text-foreground">{sessions}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</p>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="text-xs text-muted-foreground italic leading-relaxed text-center">
                {quote}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mobile Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex lg:hidden gap-2 mb-6"
        >
          {[
            { icon: BookOpen, label: 'Notes', page: 'notes' as const },
            { icon: Brain, label: 'Quiz', page: 'quiz-setup' as const },
            { icon: GraduationCap, label: 'Formulas', page: 'notes' as const },
          ].map(item => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(item.page)}
              className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Sound Mixer Toggle */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMixerExpanded(prev => !prev)}
          className={cn(
            'glass-card rounded-2xl px-5 py-3 flex items-center gap-3 transition-all duration-300',
            mixerExpanded && 'bg-white/[0.04]'
          )}
        >
          <div className="relative">
            <Headphones className="w-5 h-5 text-[#00f0ff]" />
            {activeCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Ambient Sounds</p>
            <p className="text-[10px] text-muted-foreground">
              {activeCount > 0 ? `${activeCount} playing` : 'Click to open mixer'}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {activeCount > 0 && !mixerExpanded && (
              <div className="flex items-end gap-0.5 h-4">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-0.5 rounded-full bg-[#00f0ff]"
                    animate={{
                      height: [4, 12, 6, 14, 8, 10, 4],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}
            <motion.div
              animate={{ rotate: mixerExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.button>

        {/* Sound Mixer Panel */}
        <AnimatePresence>
          {mixerExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg mt-4 overflow-hidden"
            >
              <div className="glass-card rounded-2xl p-5">
                {/* Master Volume */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    {masterVolume > 0 ? (
                      <Volume2 className="w-4 h-4 text-[#00f0ff]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground w-16">Master</span>
                  <div className="flex-1">
                    <Slider
                      value={[masterVolume]}
                      onValueChange={([v]) => handleSetMasterVolume(v)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                    {masterVolume}%
                  </span>
                </div>

                {/* Sound Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SOUND_CONFIGS.map((sound, index) => {
                    const Icon = SOUND_ICONS[sound.id]
                    const isActive = soundActive[sound.id] || false
                    const vol = soundVolumes[sound.id] || 50

                    return (
                      <motion.button
                        key={sound.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleToggleSound(sound.id)}
                        className={cn(
                          'relative rounded-xl p-3 text-left transition-all duration-300 border',
                          isActive
                            ? 'bg-white/[0.04] shadow-lg'
                            : 'bg-white/[0.01] hover:bg-white/[0.03]'
                        )}
                        style={{
                          borderColor: isActive ? `${sound.color}30` : 'rgba(255,255,255,0.05)',
                          boxShadow: isActive ? `0 0 15px ${sound.color}15, inset 0 0 15px ${sound.color}08` : 'none',
                        }}
                      >
                        {/* Active indicator glow */}
                        {isActive && (
                          <div
                            className="absolute -top-px -right-px w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: sound.color,
                              boxShadow: `0 0 8px ${sound.color}80`,
                            }}
                          />
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            className="w-4 h-4 shrink-0 transition-colors duration-300"
                            style={{ color: isActive ? sound.color : '#64748b' }}
                          />
                          <span
                            className={cn(
                              'text-xs font-medium truncate transition-colors duration-300',
                              isActive ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {sound.label}
                          </span>
                        </div>

                        {/* Volume slider */}
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Slider
                              value={[vol]}
                              onValueChange={([v]) => handleSetVolume(sound.id, v)}
                              max={100}
                              step={1}
                              className="w-full mt-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {vol}%
                            </p>
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Stop All button */}
                {activeCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 pt-3 border-t border-white/5 flex justify-center"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        ambientMixer.stopAll()
                        setSoundActive({})
                      }}
                      className="text-xs text-muted-foreground hover:text-red-400"
                    >
                      <VolumeX className="w-3.5 h-3.5 mr-1.5" />
                      Stop All Sounds
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timer Complete Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-32 lg:bottom-12 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-card rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(0,240,255,0.15)] border border-[#00f0ff]/20 max-w-sm">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  mode === 'focus' ? 'bg-[#a855f7]/15' : 'bg-[#00f0ff]/15'
                )}>
                  {mode === 'focus' ? (
                    <Pause className="w-5 h-5 text-[#a855f7]" />
                  ) : (
                    <Play className="w-5 h-5 text-[#00f0ff]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {mode === 'focus' ? 'Focus Complete!' : 'Break Over!'}
                  </p>
                  <p className="text-xs text-muted-foreground">{notificationMessage}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for focus background animation */}
      <style jsx global>{`
        @keyframes focus-bg-shift {
          0%, 100% {
            background-position: 0% 0%, 100% 0%, 50% 100%;
          }
          25% {
            background-position: 30% 20%, 70% 30%, 30% 70%;
          }
          50% {
            background-position: 60% 40%, 40% 60%, 70% 30%;
          }
          75% {
            background-position: 20% 60%, 80% 20%, 40% 60%;
          }
        }
      `}</style>
    </div>
  )
}
