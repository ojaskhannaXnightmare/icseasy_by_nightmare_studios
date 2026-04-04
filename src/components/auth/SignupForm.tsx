'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bot, Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store/useStore'

export default function SignupForm() {
  const { setCurrentPage, setAuth } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordFocused, setPasswordFocused] = useState(false)

  const passwordValid = password.length >= 6

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    if (password.length >= 12) score += 1

    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' }
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' }
    if (score <= 5) return { score, label: 'Good', color: '#00f0ff' }
    return { score, label: 'Strong', color: '#22c55e' }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValid) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed. Please try again.')
        return
      }

      // Store auth state
      if (data.token && data.user) {
        setAuth(data.user, data.token)
      }
      setCurrentPage('dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative grid-bg-animated">
      {/* Floating neon orbs */}
      <motion.div
        className="absolute top-1/4 right-[15%] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }}
        animate={{ y: [0, 25, 0], x: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 left-[15%] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)' }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute top-[40%] left-[25%] w-36 h-36 rounded-full pointer-events-none floating-orb"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#ec4899] flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '0 0 40px rgba(168,85,247,0.25), 0 0 80px rgba(236,72,153,0.15)' }}
            animate={{ boxShadow: ['0 0 40px rgba(168,85,247,0.25), 0 0 80px rgba(236,72,153,0.15)', '0 0 50px rgba(168,85,247,0.35), 0 0 100px rgba(236,72,153,0.2)', '0 0 40px rgba(168,85,247,0.25), 0 0 80px rgba(236,72,153,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bot className="w-9 h-9 text-[#0a0a0f]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gradient-animated text-neon-glow-cyan">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start your ICSE learning journey
          </p>
        </motion.div>

        {/* Form Card — frosted glass with stronger backdrop */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="glass-card card-glass-frost neon-border-cyan rounded-2xl p-6 sm:p-8"
          style={{ boxShadow: '0 0 40px rgba(168,85,247,0.04), 0 25px 60px rgba(0,0,0,0.4)' }}
        >
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-muted-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 focus:border-[#a855f7]/50 rounded-lg input-lift"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 focus:border-[#a855f7]/50 rounded-lg input-lift"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`pl-10 pr-10 h-11 bg-white/5 border-white/10 focus:border-[#a855f7]/50 rounded-lg input-lift ${
                    password && !passwordValid ? 'border-red-500/50' : ''
                  }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && !passwordValid && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-red-400"
                >
                  Password must be at least 6 characters
                </motion.p>
              )}
              {/* Password Strength Meter */}
              {passwordFocused && password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 pt-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Password strength</span>
                    <span className="text-[11px] font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: passwordStrength.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit — pulsing glow */}
            <Button
              type="submit"
              className={`w-full btn-neon-solid h-11 rounded-lg text-base ${!loading && passwordValid ? 'btn-pulse-glow' : ''}`}
              disabled={loading || !passwordValid}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>

          {/* Gradient divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="gradient-divider flex-1" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">or continue with</span>
            <div className="gradient-divider flex-1" />
          </div>

          {/* Switch to login */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="text-[#a855f7] hover:underline font-medium transition-colors hover:text-[#a855f7]/80"
              >
                Login
              </button>
            </p>
          </div>
        </motion.form>

        {/* Back */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => setCurrentPage('landing')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
