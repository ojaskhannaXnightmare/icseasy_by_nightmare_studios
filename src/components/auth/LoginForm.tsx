'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store/useStore'

export default function LoginForm() {
  const { setCurrentPage, setAuth } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.')
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
        className="absolute top-1/4 left-[15%] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)' }}
        animate={{ y: [0, 30, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[15%] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)' }}
        animate={{ y: [0, -25, 0], x: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 right-[30%] w-40 h-40 rounded-full pointer-events-none floating-orb"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)' }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
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
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(168,85,247,0.15)' }}
            animate={{ boxShadow: ['0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(168,85,247,0.15)', '0 0 50px rgba(0,240,255,0.35), 0 0 100px rgba(168,85,247,0.2)', '0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(168,85,247,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bot className="w-9 h-9 text-[#0a0a0f]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gradient-animated text-neon-glow-cyan">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to continue learning
          </p>
        </motion.div>

        {/* Form Card — frosted glass with stronger backdrop */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="glass-card card-glass-frost rounded-2xl p-6 sm:p-8"
          style={{ boxShadow: '0 0 40px rgba(0,240,255,0.04), 0 25px 60px rgba(0,0,0,0.4)' }}
        >
          <div className="space-y-5">
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
                  className="pl-10 h-11 bg-white/5 border-white/10 focus:border-[#00f0ff]/50 rounded-lg input-lift"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/5 border-white/10 focus:border-[#00f0ff]/50 rounded-lg input-lift"
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
              className={`w-full btn-neon-solid h-11 rounded-lg text-base ${!loading ? 'btn-pulse-glow' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </div>

          {/* Gradient divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="gradient-divider flex-1" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">or continue with</span>
            <div className="gradient-divider flex-1" />
          </div>

          {/* Switch to signup */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('signup')}
                className="text-[#00f0ff] hover:underline font-medium transition-colors hover:text-[#00f0ff]/80"
              >
                Sign Up
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
