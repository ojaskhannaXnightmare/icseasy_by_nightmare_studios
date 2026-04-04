'use client'

import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Search,
  Pencil,
  Atom,
  FlaskConical,
  Calculator,
  Leaf,
  Landmark,
  Globe,
  Monitor,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store/useStore'

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

export default function SubjectDetail() {
  const { selectedSubject, setCurrentPage, setSelectedTopic } = useStore()

  if (!selectedSubject) {
    return (
      <div className="min-h-screen lg:pl-[260px] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No subject selected</p>
          <Button
            variant="outline"
            onClick={() => setCurrentPage('subjects')}
            className="btn-neon"
          >
            Browse Subjects
          </Button>
        </div>
      </div>
    )
  }

  const Icon = iconMap[selectedSubject.icon] || BookOpen
  const color = selectedSubject.color

  const handleTopicAction = (topicName: string, action: 'study' | 'quiz' | 'research') => {
    setSelectedTopic(topicName)

    switch (action) {
      case 'study':
        setCurrentPage('notes')
        break
      case 'quiz':
        setCurrentPage('quiz-setup')
        break
      case 'research':
        setCurrentPage('research')
        break
    }
  }

  return (
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
      {/* Animated background glow orbs matching subject color */}
      <motion.div
        className="fixed top-10 right-10 w-[400px] h-[400px] rounded-full pointer-events-none floating-orb"
        style={{ backgroundColor: `${color}08` }}
        animate={{
          x: [0, 30, -20, 10, 0],
          y: [0, -20, 15, -10, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-20 left-20 w-[300px] h-[300px] rounded-full pointer-events-none floating-orb floating-delayed"
        style={{ backgroundColor: `${color}06` }}
        animate={{
          x: [0, -25, 15, -10, 0],
          y: [0, 20, -15, 10, 0],
          scale: [1, 0.95, 1.08, 1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed top-1/2 left-1/2 w-[200px] h-[200px] rounded-full pointer-events-none floating-orb"
        style={{ backgroundColor: `${color}05` }}
        animate={{
          x: [0, 15, -25, 20, 0],
          y: [0, -15, 25, -20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: -5 }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back button with smooth hover */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setCurrentPage('subjects')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 mb-6 group px-3 py-2 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-300" />
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">Back to Subjects</span>
          </button>
        </motion.div>

        {/* Subject Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden"
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${color}, transparent 70%)`,
            }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Icon */}
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${color}15`,
                boxShadow: `0 0 30px ${color}15`,
              }}
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className="w-8 h-8" style={{ color }} />
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <h1
                className="text-2xl sm:text-3xl font-bold mb-1"
                style={{ color }}
              >
                {selectedSubject.name}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {selectedSubject.description}
              </p>
            </div>

            {/* Badge */}
            <Badge
              className="shrink-0 text-sm px-3 py-1 rounded-lg badge-pulse"
              style={{
                backgroundColor: `${color}12`,
                color,
                borderColor: `${color}25`,
              }}
            >
              {selectedSubject.topics?.length || 0} Topics
            </Badge>
          </div>
        </motion.div>

        {/* Gradient divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="gradient-divider mb-8"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}40, ${color}20, transparent)`,
          }}
        />

        {/* Topics Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex items-center justify-between mb-5"
        >
          <h2 className="text-lg font-semibold">Topics</h2>
          <p className="text-sm text-muted-foreground">
            Select a topic to start learning
          </p>
        </motion.div>

        {/* Topics List */}
        <div className="space-y-3 stagger-children">
          {(selectedSubject.topics || []).map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.4 + index * 0.06 }}
              whileHover={{ scale: 1.01 }}
              className="glass-card rounded-xl p-4 sm:p-5 card-glow card-glow-purple group border-sweep"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Topic info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <motion.div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold icon-container-ring"
                    style={{
                      backgroundColor: `${color}10`,
                      color,
                    }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {index + 1}
                  </motion.div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base group-hover:text-white transition-colors truncate neon-underline-hover">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSubject.name}
                    </p>
                  </div>
                </div>

                {/* Action buttons with scale + glow hover */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTopicAction(topic.name, 'study')}
                    className="text-xs h-8 px-3 rounded-lg border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:scale-105 transition-all duration-200"
                  >
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Study
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTopicAction(topic.name, 'quiz')}
                    className="text-xs h-8 px-3 rounded-lg border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:scale-105 transition-all duration-200"
                    style={{
                      borderColor: `${color}25`,
                    }}
                  >
                    <Brain className="w-3 h-3 mr-1.5" />
                    Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTopicAction(topic.name, 'research')}
                    className="text-xs h-8 px-3 rounded-lg border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:scale-105 transition-all duration-200"
                  >
                    <Search className="w-3 h-3 mr-1.5" />
                    Research
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state with animation */}
        {(!selectedSubject.topics || selectedSubject.topics.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center py-16 glass-card rounded-xl"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">No topics available</h3>
            <p className="text-sm text-muted-foreground">
              Topics for this subject are being prepared
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
