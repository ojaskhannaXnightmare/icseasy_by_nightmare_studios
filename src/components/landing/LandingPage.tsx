'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, BookOpen, Brain, Sparkles, ChevronRight, Zap, UserPlus, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'

// Pre-computed particle positions (no Math.random in render)
const particles = [
  { x: 10, y: 15, size: 2, opacity: 0.3 },
  { x: 25, y: 8, size: 3, opacity: 0.2 },
  { x: 45, y: 20, size: 2, opacity: 0.4 },
  { x: 60, y: 5, size: 1.5, opacity: 0.3 },
  { x: 78, y: 18, size: 2.5, opacity: 0.25 },
  { x: 90, y: 12, size: 2, opacity: 0.35 },
  { x: 15, y: 35, size: 1.5, opacity: 0.2 },
  { x: 35, y: 42, size: 3, opacity: 0.3 },
  { x: 55, y: 38, size: 2, opacity: 0.25 },
  { x: 72, y: 45, size: 2, opacity: 0.4 },
  { x: 88, y: 33, size: 1.5, opacity: 0.2 },
  { x: 5, y: 55, size: 2.5, opacity: 0.3 },
  { x: 22, y: 62, size: 2, opacity: 0.2 },
  { x: 42, y: 58, size: 3, opacity: 0.35 },
  { x: 63, y: 65, size: 1.5, opacity: 0.25 },
  { x: 82, y: 52, size: 2, opacity: 0.3 },
  { x: 95, y: 60, size: 2, opacity: 0.2 },
  { x: 12, y: 78, size: 2.5, opacity: 0.3 },
  { x: 33, y: 82, size: 2, opacity: 0.25 },
  { x: 53, y: 75, size: 3, opacity: 0.2 },
  { x: 70, y: 85, size: 1.5, opacity: 0.35 },
  { x: 85, y: 78, size: 2, opacity: 0.3 },
  { x: 48, y: 90, size: 2.5, opacity: 0.2 },
  { x: 18, y: 92, size: 2, opacity: 0.3 },
]

// Pre-computed star field for background (larger, brighter decorative stars)
const starField = [
  { x: 5, y: 3, size: 1, opacity: 0.4, duration: '6s', delay: '0s', color: '#00f0ff' },
  { x: 15, y: 12, size: 1.5, opacity: 0.25, duration: '8s', delay: '1s', color: '#a855f7' },
  { x: 30, y: 5, size: 1, opacity: 0.35, duration: '5s', delay: '2.5s', color: '#ec4899' },
  { x: 42, y: 18, size: 2, opacity: 0.15, duration: '10s', delay: '0.5s', color: '#00f0ff' },
  { x: 58, y: 8, size: 1, opacity: 0.4, duration: '7s', delay: '3s', color: '#a855f7' },
  { x: 68, y: 22, size: 1.5, opacity: 0.2, duration: '9s', delay: '1.5s', color: '#ec4899' },
  { x: 80, y: 3, size: 1, opacity: 0.35, duration: '6s', delay: '4s', color: '#00f0ff' },
  { x: 92, y: 15, size: 1.5, opacity: 0.3, duration: '8s', delay: '2s', color: '#a855f7' },
  { x: 3, y: 45, size: 1, opacity: 0.25, duration: '7s', delay: '0.8s', color: '#ec4899' },
  { x: 20, y: 50, size: 2, opacity: 0.15, duration: '11s', delay: '3.5s', color: '#00f0ff' },
  { x: 38, y: 40, size: 1, opacity: 0.4, duration: '5s', delay: '1.2s', color: '#a855f7' },
  { x: 55, y: 55, size: 1.5, opacity: 0.2, duration: '9s', delay: '2.8s', color: '#ec4899' },
  { x: 70, y: 42, size: 1, opacity: 0.35, duration: '6s', delay: '4.5s', color: '#00f0ff' },
  { x: 85, y: 48, size: 1.5, opacity: 0.25, duration: '8s', delay: '0.3s', color: '#a855f7' },
  { x: 95, y: 35, size: 1, opacity: 0.3, duration: '7s', delay: '3.2s', color: '#ec4899' },
  { x: 8, y: 72, size: 2, opacity: 0.15, duration: '10s', delay: '1.8s', color: '#00f0ff' },
  { x: 25, y: 80, size: 1, opacity: 0.4, duration: '6s', delay: '4.2s', color: '#a855f7' },
  { x: 45, y: 70, size: 1.5, opacity: 0.2, duration: '8s', delay: '2.3s', color: '#ec4899' },
  { x: 62, y: 85, size: 1, opacity: 0.35, duration: '5s', delay: '0.6s', color: '#00f0ff' },
  { x: 78, y: 75, size: 2, opacity: 0.15, duration: '11s', delay: '3.8s', color: '#a855f7' },
  { x: 90, y: 88, size: 1, opacity: 0.3, duration: '7s', delay: '1.5s', color: '#ec4899' },
  { x: 50, y: 95, size: 1.5, opacity: 0.25, duration: '9s', delay: '4.8s', color: '#00f0ff' },
]

const features = [
  {
    icon: Bot,
    title: 'AI Tutor',
    description: 'Get instant, personalized help from our AI tutor. Ask questions, get explanations, and deepen your understanding of any ICSE topic.',
    color: '#00f0ff',
    gradient: 'from-[#00f0ff]/20 to-transparent',
  },
  {
    icon: BookOpen,
    title: 'Smart Notes',
    description: 'AI-generated study notes tailored to the ICSE syllabus. Organized by subject and topic for efficient revision.',
    color: '#a855f7',
    gradient: 'from-[#a855f7]/20 to-transparent',
  },
  {
    icon: Brain,
    title: 'Quiz System',
    description: 'Test your knowledge with adaptive quizzes. Track your progress, identify weak areas, and improve your scores.',
    color: '#ec4899',
    gradient: 'from-[#ec4899]/20 to-transparent',
  },
]

const stats = [
  { target: 10000, suffix: '+', label: 'Students' },
  { target: 8, suffix: '', label: 'ICSE Subjects' },
  { target: 500, suffix: '+', label: 'Quiz Questions' },
  { target: 24, suffix: '/7', label: 'AI Available' },
]

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const step = Math.max(1, Math.floor(target / 40))
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) { clearInterval(timer); return target }
        return Math.min(prev + step, target)
      })
    }, 30)
    return () => clearInterval(timer)
  }, [target])
  return <>{count.toLocaleString()}{suffix}</>
}

// How It Works steps
const howItWorksSteps = [
  {
    step: 1,
    title: 'Sign Up Free',
    description: 'Create your account in seconds. No credit card required. Get instant access to all features.',
    icon: UserPlus,
  },
  {
    step: 2,
    title: 'Choose Your Subject',
    description: 'Pick from 8 ICSE subjects. Select specific topics or let AI guide your learning path.',
    icon: BookOpen,
  },
  {
    step: 3,
    title: 'Learn with AI',
    description: 'Get personalized tutoring, generate notes, take quizzes, and track your progress with AI.',
    icon: GraduationCap,
  },
]

// Testimonials
const testimonials = [
  {
    initials: 'AP',
    name: 'Ananya Patel',
    school: 'St. Xavier\'s School, Mumbai',
    rating: 5,
    text: 'ICSEasy completely transformed my study routine. The AI tutor explains concepts better than most textbooks. I went from 65% to 92% in Physics!',
    color: '#00f0ff',
  },
  {
    initials: 'RS',
    name: 'Rahul Sharma',
    school: 'La Martiniere College, Kolkata',
    rating: 5,
    text: 'The quiz feature is absolutely brilliant. It adapts to my weak areas and gives me targeted practice. My Biology scores improved by 30 marks.',
    color: '#a855f7',
  },
  {
    initials: 'MK',
    name: 'Meera Kapoor',
    school: 'Bishop Cotton School, Bangalore',
    rating: 5,
    text: 'I love how everything is organized by ICSE syllabus. The smart notes save me hours of revision time. Best study app for ICSE students!',
    color: '#ec4899',
  },
]

export default function LandingPage() {
  const { setCurrentPage } = useStore()
  const featuresRef = useRef<HTMLDivElement>(null)

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Pre-computed star field + particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Star field - subtle twinkling background */}
        {starField.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full star-field"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              '--star-opacity': star.opacity,
              '--star-duration': star.duration,
              '--star-delay': star.delay,
            } as React.CSSProperties}
          />
        ))}
        {/* Animated particles */}
        {particles.map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#a855f7' : '#ec4899',
              opacity: particle.opacity,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#0a0a0f]" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">ICSEasy</h1>
              <p className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase leading-none">
                Nightmare Studios
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
              onClick={() => setCurrentPage('login')}
            >
              Login
            </Button>
            <Button
              className="btn-neon-solid rounded-lg px-5"
              onClick={() => setCurrentPage('signup')}
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#a855f7]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-[#ec4899]/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-4xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass neon-border mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-xs text-muted-foreground">AI-Powered ICSE Learning</span>
            <Zap className="w-3.5 h-3.5 text-[#a855f7]" />
          </motion.div>

          {/* Title with typing cursor */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9]">
            <span className="gradient-text typing-cursor">ICSEasy</span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto"
          >
            AI-Powered Learning for ICSE Students
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="text-sm text-[#a855f7]/70 mb-10 tracking-wide uppercase"
          >
            by Nightmare Studios
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="btn-neon-solid rounded-xl px-8 py-6 text-base"
              onClick={() => setCurrentPage('signup')}
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="btn-neon rounded-xl px-8 py-6 text-base border-[#00f0ff]/20"
              onClick={scrollToFeatures}
            >
              Explore Features
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 max-w-2xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold neon-text-cyan">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-[#00f0ff]/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative z-10 py-24 px-4 section-transition">
        {/* Section gradient divider */}
        <div className="gradient-divider mb-16" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to ace your ICSE exams, powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="glass rounded-2xl p-6 card-glow feature-card-enhanced group relative overflow-hidden"
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${feature.color}15`,
                        boxShadow: `0 0 20px ${feature.color}15`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-4 section-transition">
        <div className="gradient-divider mb-16" />
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get started in three simple steps and supercharge your ICSE preparation
            </p>
          </motion.div>

          <div className="relative">
            {/* Dashed connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] border-t-2 border-dashed border-[#00f0ff]/20 z-0" />

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Step circle */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center neon-border border-[#00f0ff]/20">
                        <Icon className="w-7 h-7 text-[#00f0ff]" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#00f0ff] flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                        <span className="text-xs font-bold text-[#0a0a0f]">{step.step}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-24 px-4 section-transition">
        <div className="gradient-divider mb-16" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="gradient-text">Loved by Students</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See what ICSE students across India are saying about their experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.initials}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="glass rounded-2xl p-6 card-glow relative overflow-hidden"
              >
                {/* Glow accent */}
                <div
                  className="absolute top-0 left-0 w-24 h-24 rounded-full blur-[60px] pointer-events-none"
                  style={{ backgroundColor: `${testimonial.color}08` }}
                />

                <div className="relative z-10">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <span key={i} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: `${testimonial.color}15`,
                        color: testimonial.color,
                        boxShadow: `0 0 12px ${testimonial.color}10`,
                      }}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-[11px] text-muted-foreground">{testimonial.school}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4 section-transition">
        <div className="gradient-divider mb-16" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-10 sm:p-16 neon-border relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/5 via-transparent to-[#a855f7]/5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to <span className="gradient-text">Ace Your Exams</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of ICSE students who are already learning smarter with ICSEasy
              </p>
              <Button
                size="lg"
                className="btn-neon-solid rounded-xl px-10 py-6 text-base"
                onClick={() => setCurrentPage('signup')}
              >
                Start Learning Now
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-[#0a0a0f]" />
            </div>
            <span className="text-sm gradient-text font-semibold">ICSEasy</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2025 NIGHTMARE STUDIOS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
