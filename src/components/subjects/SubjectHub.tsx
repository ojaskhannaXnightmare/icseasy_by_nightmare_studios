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

export default function SubjectHub() {
  const { setCurrentPage, setSelectedSubject } = useStore()
  const [search, setSearch] = useState('')
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
            <span className="gradient-text">Subjects</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Choose a subject to start learning
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="pl-10 h-11 bg-white/5 border-white/10 focus:border-[#00f0ff]/40 rounded-xl text-sm"
            />
          </div>
        </motion.div>

        {/* Subject Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((subject, index) => {
            const Icon = iconMap[subject.icon] || BookOpen
            return (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                onClick={() => handleSubjectClick(subject)}
                className="glass rounded-xl p-5 card-glow subject-card-glow text-left group relative overflow-hidden"
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
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${subject.color}12`,
                      boxShadow: `0 0 20px ${subject.color}08`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: subject.color }} />
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-base mb-1.5 group-hover:text-white transition-colors">
                    {subject.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {subject.description}
                  </p>

                  {/* Topic count + Arrow */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${subject.color}12`,
                        color: subject.color,
                        borderColor: `${subject.color}20`,
                      }}
                    >
                      {subject.topics?.length || 0} topics
                    </Badge>
                    <ChevronRight
                      className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1"
                      style={{ color: subject.color }}
                    />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No subjects found</h3>
            <p className="text-sm text-muted-foreground">
              Try a different search term
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
