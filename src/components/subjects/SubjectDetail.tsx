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
    <div className="min-h-screen lg:pl-[260px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Background glow */}
      <div
        className="fixed top-0 right-0 w-96 h-96 rounded-full blur-[150px] pointer-events-none"
        style={{ backgroundColor: `${color}05` }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setCurrentPage('subjects')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Subjects
          </button>
        </motion.div>

        {/* Subject Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden"
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
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${color}15`,
                boxShadow: `0 0 30px ${color}15`,
              }}
            >
              <Icon className="w-8 h-8" style={{ color }} />
            </div>

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
              className="shrink-0 text-sm px-3 py-1 rounded-lg"
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

        {/* Topics Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center justify-between mb-5"
        >
          <h2 className="text-lg font-semibold">Topics</h2>
          <p className="text-sm text-muted-foreground">
            Select a topic to start learning
          </p>
        </motion.div>

        {/* Topics List */}
        <div className="space-y-3">
          {(selectedSubject.topics || []).map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 + index * 0.06 }}
              className="glass rounded-xl p-4 sm:p-5 card-glow group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Topic info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      backgroundColor: `${color}10`,
                      color,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base group-hover:text-white transition-colors truncate">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSubject.name}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTopicAction(topic.name, 'study')}
                    className="text-xs h-8 px-3 rounded-lg border-white/10 hover:bg-white/5 hover:border-white/20"
                  >
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Study
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTopicAction(topic.name, 'quiz')}
                    className="text-xs h-8 px-3 rounded-lg border-white/10 hover:bg-white/5 hover:border-white/20"
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
                    className="text-xs h-8 px-3 rounded-lg border-white/10 hover:bg-white/5 hover:border-white/20"
                  >
                    <Search className="w-3 h-3 mr-1.5" />
                    Research
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {(!selectedSubject.topics || selectedSubject.topics.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 glass rounded-xl"
          >
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
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
