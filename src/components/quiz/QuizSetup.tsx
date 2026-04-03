'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight, Play, Trophy, Clock, Target,
  BookOpen, Atom, FlaskConical, Globe, Calculator,
  History, Code2, Languages, TrendingUp, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useStore, type SubjectData, type QuizAttemptData } from '@/store/useStore'
import { authFetch } from '@/lib/api'

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  'English': <Languages className="w-6 h-6" />,
  'Mathematics': <Calculator className="w-6 h-6" />,
  'Physics': <Atom className="w-6 h-6" />,
  'Chemistry': <FlaskConical className="w-6 h-6" />,
  'Biology': <BookOpen className="w-6 h-6" />,
  'History': <History className="w-6 h-6" />,
  'Geography': <Globe className="w-6 h-6" />,
  'Computer Science': <Code2 className="w-6 h-6" />,
}

const SUBJECT_COLORS: Record<string, string> = {
  'English': 'from-pink-500/20 to-pink-600/5 border-pink-500/20 text-pink-400 hover:border-pink-500/40',
  'Mathematics': 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40',
  'Physics': 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400 hover:border-purple-500/40',
  'Chemistry': 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400 hover:border-green-500/40',
  'Biology': 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40',
  'History': 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400 hover:border-amber-500/40',
  'Geography': 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400 hover:border-blue-500/40',
  'Computer Science': 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400 hover:border-violet-500/40',
}

const SUBJECT_ICONS_BG: Record<string, string> = {
  'English': 'bg-pink-500/10 group-hover:bg-pink-500/20',
  'Mathematics': 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
  'Physics': 'bg-purple-500/10 group-hover:bg-purple-500/20',
  'Chemistry': 'bg-green-500/10 group-hover:bg-green-500/20',
  'Biology': 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
  'History': 'bg-amber-500/10 group-hover:bg-amber-500/20',
  'Geography': 'bg-blue-500/10 group-hover:bg-blue-500/20',
  'Computer Science': 'bg-violet-500/10 group-hover:bg-violet-500/20',
}

const QUESTION_COUNTS = [5, 10, 15, 20]

export default function QuizSetup() {
  const { setCurrentPage, setQuizQuestions, selectedSubject, setSelectedSubject } = useStore()
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<QuizAttemptData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/subjects')
        if (res.ok) {
          const data = await res.json()
          setSubjects(data)
        }
      } catch { /* ignore */ }
      try {
        const res = await authFetch('/api/quiz/attempts')
        if (res.ok) {
          const data = await res.json()
          setAttempts(Array.isArray(data) ? data : [])
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchData()
  }, [])

  const topicList = useMemo(() => {
    if (selectedSubjectName && subjects.length > 0) {
      const subj = subjects.find(s => s.name === selectedSubjectName)
      return subj ? subj.topics : []
    }
    return []
  }, [selectedSubjectName, subjects])

  const startQuiz = async () => {
    if (!selectedSubjectName || !selectedTopic) return
    setStarting(true)

    try {
      const res = await authFetch('/api/quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          subject: selectedSubjectName,
          topic: selectedTopic,
          count: questionCount
        })
      })
      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions, selectedSubjectName, selectedTopic)
        setCurrentPage('quiz-active')
      }
    } catch { /* ignore */ }
    setStarting(false)
  }

  const getScoreColor = (score: number, total: number) => {
    const pct = (score / total) * 100
    if (pct >= 80) return 'text-green-400'
    if (pct >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-4 md:p-6 lg:p-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="p-2 rounded-lg glass hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
            <Target className="w-7 h-7" />
            Quiz Challenge
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Test your knowledge with AI-generated questions</p>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="mb-8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Choose a Subject
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {subjects.map((subject, index) => (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSubjectName(subject.name)}
                className={`group p-4 rounded-xl border bg-gradient-to-br transition-all duration-300 ${
                  selectedSubjectName === subject.name
                    ? SUBJECT_COLORS[subject.name]
                    : `from-white/5 to-transparent border-white/10 text-gray-400 hover:border-white/20 hover:text-white`
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  selectedSubjectName === subject.name
                    ? SUBJECT_ICONS_BG[subject.name]
                    : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  {SUBJECT_ICONS[subject.name] || <BookOpen className="w-6 h-6" />}
                </div>
                <p className="text-sm font-medium truncate">{subject.name}</p>
                <p className="text-xs opacity-60 mt-0.5">{subject.topics.length} topics</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Topic & Count Selection */}
      {selectedSubjectName && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 mb-8 neon-border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Select Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="glass bg-white/5 border-white/10 text-white h-11">
                  <SelectValue placeholder="Choose a topic..." />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10 bg-[#0f0f19]">
                  {topicList.map(topic => (
                    <SelectItem key={topic.id} value={topic.name} className="text-gray-300 focus:bg-white/5 focus:text-white">
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {QUESTION_COUNTS.map(count => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      questionCount === count
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={startQuiz}
            disabled={!selectedTopic || starting}
            className="btn-neon-solid gap-2 px-8 py-3 w-full md:w-auto text-base"
          >
            {starting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Quiz...</>
            ) : (
              <><Play className="w-5 h-5" /> Start Quiz</>
            )}
          </Button>
        </motion.div>
      )}

      {/* Previous Quiz Attempts */}
      {attempts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Previous Attempts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attempts.slice(0, 9).map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-4 card-glow"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-white/5 text-gray-400 border border-white/10 text-xs">{attempt.subject}</Badge>
                  <span className="text-xs text-gray-600">
                    {new Date(attempt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2 truncate">{attempt.topic}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getScoreColor(attempt.score, attempt.totalMarks)}`}>
                    {attempt.score}/{attempt.totalMarks}
                  </span>
                  <span className={`text-xs ${getScoreColor(attempt.score, attempt.totalMarks)}`}>
                    {Math.round((attempt.score / attempt.totalMarks) * 100)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
