'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Atom,
  FlaskConical,
  Calculator,
  Leaf,
  BookOpen,
  Landmark,
  Globe,
  Monitor,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  GraduationCap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useStore, type SubjectData } from '@/store/useStore'

// Pre-computed subject data with icons and colors
const subjectsData: SubjectData[] = [
  {
    id: 'physics',
    name: 'Physics',
    icon: 'Atom',
    color: '#00f0ff',
    description: 'Forces, Motion, Light, Sound, Electricity and more',
    topics: [
      { id: 'p1', name: 'Force & Laws of Motion' },
      { id: 'p2', name: 'Light - Reflection & Refraction' },
      { id: 'p3', name: 'Sound' },
      { id: 'p4', name: 'Electricity & Magnetism' },
      { id: 'p5', name: 'Heat' },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'FlaskConical',
    color: '#a855f7',
    description: 'Elements, Compounds, Chemical Reactions, Periodic Table',
    topics: [
      { id: 'c1', name: 'Periodic Table & Elements' },
      { id: 'c2', name: 'Chemical Bonding' },
      { id: 'c3', name: 'Acids, Bases & Salts' },
      { id: 'c4', name: 'Organic Chemistry' },
      { id: 'c5', name: 'Metals & Non-metals' },
    ],
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'Calculator',
    color: '#ec4899',
    description: 'Algebra, Geometry, Trigonometry, Statistics & Probability',
    topics: [
      { id: 'm1', name: 'Quadratic Equations' },
      { id: 'm2', name: 'Trigonometry' },
      { id: 'm3', name: 'Coordinate Geometry' },
      { id: 'm4', name: 'Statistics & Probability' },
      { id: 'm5', name: 'Circle & Constructions' },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'Leaf',
    color: '#22c55e',
    description: 'Cell Biology, Genetics, Human Physiology, Ecology',
    topics: [
      { id: 'b1', name: 'Cell Structure & Function' },
      { id: 'b2', name: 'Human Digestive System' },
      { id: 'b3', name: 'Genetics & Evolution' },
      { id: 'b4', name: 'Photosynthesis' },
      { id: 'b5', name: 'Ecology & Environment' },
    ],
  },
  {
    id: 'english',
    name: 'English',
    icon: 'BookOpen',
    color: '#f59e0b',
    description: 'Literature, Grammar, Composition, Comprehension',
    topics: [
      { id: 'e1', name: 'Essay Writing' },
      { id: 'e2', name: 'Grammar & Usage' },
      { id: 'e3', name: 'Literature: Prose' },
      { id: 'e4', name: 'Literature: Poetry' },
      { id: 'e5', name: 'Comprehension Skills' },
    ],
  },
  {
    id: 'history',
    name: 'History',
    icon: 'Landmark',
    color: '#ef4444',
    description: 'Indian History, World Events, Revolutions & Movements',
    topics: [
      { id: 'h1', name: 'Indian National Movement' },
      { id: 'h2', name: 'World War I & II' },
      { id: 'h3', name: 'French Revolution' },
      { id: 'h4', name: 'Industrial Revolution' },
      { id: 'h5', name: 'Modern World History' },
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: 'Globe',
    color: '#06b6d4',
    description: 'Physical Geography, Climate, Resources, Maps',
    topics: [
      { id: 'g1', name: 'Climate & Weather' },
      { id: 'g2', name: 'Water Resources' },
      { id: 'g3', name: 'Soil & Agriculture' },
      { id: 'g4', name: 'Map Reading' },
      { id: 'g5', name: 'Natural Disasters' },
    ],
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    icon: 'Monitor',
    color: '#8b5cf6',
    description: 'Programming, Data Structures, Algorithms, Networking',
    topics: [
      { id: 'cs1', name: 'Programming Basics' },
      { id: 'cs2', name: 'Data Structures' },
      { id: 'cs3', name: 'Boolean Algebra' },
      { id: 'cs4', name: 'Networking Concepts' },
      { id: 'cs5', name: 'Database Concepts' },
    ],
  },
]

const iconMap: Record<string, React.ElementType> = {
  Atom,
  FlaskConical,
  Calculator,
  Leaf,
  BookOpen,
  Landmark,
  Globe,
  Monitor,
}

function EmptySubjectsState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20"
    >
      {/* Animated illustration */}
      <div className="relative w-28 h-28 mx-auto mb-6">
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-4 rounded-2xl bg-gradient-to-br from-[#a855f7]/10 to-[#ec4899]/10 flex items-center justify-center floating"
          style={{ boxShadow: '0 0 30px rgba(168,85,247,0.08)' }}
        >
          <GraduationCap className="w-10 h-10 text-[#a855f7]/60" />
        </motion.div>
        <motion.div
          className="absolute top-2 right-6 w-2 h-2 rounded-full bg-[#00f0ff]/40"
          animate={{ y: [0, -5, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-6 left-3 w-1.5 h-1.5 rounded-full bg-[#ec4899]/40"
          animate={{ y: [0, -4, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
      </div>

      <motion.h3
        className="text-xl font-semibold text-gray-300 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        No subjects found
      </motion.h3>
      <motion.p
        className="text-sm text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Try a different search term to find what you&apos;re looking for.
      </motion.p>
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass border border-white/5 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Search className="w-4 h-4" />
        <span>Browse all 8 ICSE subjects</span>
      </motion.div>
    </motion.div>
  )
}

export default function SubjectHub() {
  const { setCurrentPage, setSelectedSubject } = useStore()
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [subjects, setSubjects] = useState<SubjectData[]>([])

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch('/api/subjects')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setSubjects(data)
            return
          }
        }
      } catch {
        // Fallback to local data
      }
      setSubjects(subjectsData)
    }
    loadSubjects()
  }, [])

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubjectClick = (subject: SubjectData) => {
    setSelectedSubject(subject)
    setCurrentPage('subject-detail')
  }

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Background effects */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-[#00f0ff]/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-0 w-80 h-80 bg-[#a855f7]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-animated">Subjects</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Choose a subject to start learning
          </p>
        </motion.div>

        {/* Search — with animated icon */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`mb-6 max-w-md relative transition-all duration-300 ${searchFocused ? 'search-focused' : ''}`}
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: searchFocused ? 1.15 : 1,
                color: searchFocused ? '#00f0ff' : undefined,
              }}
              transition={{ duration: 0.2 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </motion.div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search subjects..."
              className="pl-10 h-11 bg-white/5 border-white/10 focus:border-[#00f0ff]/40 rounded-xl text-sm input-lift"
            />
          </div>
        </motion.div>

        {/* Subject Grid — 3D tilt on hover */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((subject, index) => {
            const Icon = iconMap[subject.icon] || BookOpen
            return (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSubjectClick(subject)}
                className="glass-card rounded-xl p-5 card-glow subject-card-glow text-left group relative overflow-hidden tilt-card"
              >
                {/* Hover gradient overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${subject.color}08, transparent)`,
                  }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: `${subject.color}12`,
                      boxShadow: `0 0 20px ${subject.color}08`,
                    }}
                    whileHover={{
                      scale: 1.1,
                      boxShadow: `0 0 30px ${subject.color}15`,
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon className="w-6 h-6" style={{ color: subject.color }} />
                  </motion.div>

                  {/* Name */}
                  <h3 className="font-semibold text-base mb-1.5 group-hover:text-white transition-colors">
                    {subject.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {subject.description}
                  </p>

                  {/* Topic count badge + Arrow */}
                  <div className="flex items-center justify-between">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="badge-pulse"
                    >
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-2.5 py-0.5 rounded-md font-medium"
                        style={{
                          backgroundColor: `${subject.color}15`,
                          color: subject.color,
                          borderColor: `${subject.color}25`,
                          borderWidth: '1px',
                        }}
                      >
                        {subject.topics?.length || 0} topics
                      </Badge>
                    </motion.div>
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                      style={{ color: subject.color }}
                    >
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <EmptySubjectsState />
        )}
      </div>
    </div>
  )
}
