'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookText,
  Search,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  X,
  Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type SubjectKey = 'physics' | 'chemistry' | 'mathematics' | 'biology'

interface Formula {
  id: string
  subject: SubjectKey
  category: string
  formula: string
  description: string
}

// ─── Subject Meta ────────────────────────────────────────────────────────────

const SUBJECT_META: Record<SubjectKey, { label: string; icon: React.ElementType; color: string; border: string; glow: string; bg: string; badge: string }> = {
  physics: {
    label: 'Physics',
    icon: Atom,
    color: 'text-[#00f0ff]',
    border: 'border-l-[#00f0ff]',
    glow: 'shadow-[0_0_12px_rgba(0,240,255,0.08)]',
    bg: 'bg-[#00f0ff]/5',
    badge: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20',
  },
  chemistry: {
    label: 'Chemistry',
    icon: FlaskConical,
    color: 'text-[#a855f7]',
    border: 'border-l-[#a855f7]',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.08)]',
    bg: 'bg-[#a855f7]/5',
    badge: 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20',
  },
  mathematics: {
    label: 'Mathematics',
    icon: Calculator,
    color: 'text-[#f472b6]',
    border: 'border-l-[#f472b6]',
    glow: 'shadow-[0_0_12px_rgba(244,114,182,0.08)]',
    bg: 'bg-[#f472b6]/5',
    badge: 'bg-[#f472b6]/10 text-[#f472b6] border-[#f472b6]/20',
  },
  biology: {
    label: 'Biology',
    icon: Leaf,
    color: 'text-[#4ade80]',
    border: 'border-l-[#4ade80]',
    glow: 'shadow-[0_0_12px_rgba(74,222,128,0.08)]',
    bg: 'bg-[#4ade80]/5',
    badge: 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20',
  },
}

// ─── Pre-built Formula Data ─────────────────────────────────────────────────

const FORMULAS: Formula[] = [
  // ── Physics: Mechanics ──
  { id: 'p1', subject: 'physics', category: 'Mechanics', formula: 'v = u + at', description: 'First equation of motion' },
  { id: 'p2', subject: 'physics', category: 'Mechanics', formula: 's = ut + ½at²', description: 'Second equation of motion (displacement)' },
  { id: 'p3', subject: 'physics', category: 'Mechanics', formula: 'v² = u² + 2as', description: 'Third equation of motion' },
  { id: 'p4', subject: 'physics', category: 'Mechanics', formula: 'F = ma', description: "Newton's second law of motion" },
  { id: 'p5', subject: 'physics', category: 'Mechanics', formula: 'W = Fd', description: 'Work done by a force' },
  { id: 'p6', subject: 'physics', category: 'Mechanics', formula: 'KE = ½mv²', description: 'Kinetic energy' },
  { id: 'p7', subject: 'physics', category: 'Mechanics', formula: 'PE = mgh', description: 'Gravitational potential energy' },
  { id: 'p8', subject: 'physics', category: 'Mechanics', formula: 'p = mv', description: 'Linear momentum' },
  { id: 'p9', subject: 'physics', category: 'Mechanics', formula: 'g = 9.8 m/s²', description: 'Acceleration due to gravity' },
  { id: 'p10', subject: 'physics', category: 'Mechanics', formula: 'G = 6.67×10⁻¹¹ Nm²/kg²', description: 'Universal gravitational constant' },

  // ── Physics: Electricity ──
  { id: 'p11', subject: 'physics', category: 'Electricity', formula: 'V = IR', description: "Ohm's law" },
  { id: 'p12', subject: 'physics', category: 'Electricity', formula: 'P = VI', description: 'Electrical power' },
  { id: 'p13', subject: 'physics', category: 'Electricity', formula: 'R = ρl/A', description: 'Resistance of a conductor' },
  { id: 'p14', subject: 'physics', category: 'Electricity', formula: 'Q = It', description: 'Electric charge' },
  { id: 'p15', subject: 'physics', category: 'Electricity', formula: 'E = QV', description: 'Electrical energy' },
  { id: 'p16', subject: 'physics', category: 'Electricity', formula: '1/Req = 1/R₁ + 1/R₂', description: 'Parallel resistance (two resistors)' },

  // ── Physics: Light ──
  { id: 'p17', subject: 'physics', category: 'Light', formula: 'n = c/v', description: 'Refractive index' },
  { id: 'p18', subject: 'physics', category: 'Light', formula: '1/f = 1/v − 1/u', description: 'Lens formula' },
  { id: 'p19', subject: 'physics', category: 'Light', formula: 'n = sin i / sin r', description: "Snell's law" },
  { id: 'p20', subject: 'physics', category: 'Light', formula: 'c = fλ', description: 'Wave equation (light)' },

  // ── Physics: Heat ──
  { id: 'p21', subject: 'physics', category: 'Heat', formula: 'Q = mcΔT', description: 'Specific heat capacity' },
  { id: 'p22', subject: 'physics', category: 'Heat', formula: 'Q = mL', description: 'Latent heat' },
  { id: 'p23', subject: 'physics', category: 'Heat', formula: 'Q = nCΔT', description: 'Heat capacity (molar)' },

  // ── Physics: Sound ──
  { id: 'p24', subject: 'physics', category: 'Sound', formula: 'v = fλ', description: 'Wave equation (sound)' },
  { id: 'p25', subject: 'physics', category: 'Sound', formula: 'Intensity ∝ 1/r²', description: 'Inverse square law (sound)' },

  // ── Chemistry: Mole Concept ──
  { id: 'c1', subject: 'chemistry', category: 'Mole Concept', formula: 'n = m/M', description: 'Moles from mass and molar mass' },
  { id: 'c2', subject: 'chemistry', category: 'Mole Concept', formula: 'n = N/Nₐ', description: 'Moles from number of particles' },
  { id: 'c3', subject: 'chemistry', category: 'Mole Concept', formula: 'Nₐ = 6.022×10²³', description: "Avogadro's number" },

  // ── Chemistry: Gas Laws ──
  { id: 'c4', subject: 'chemistry', category: 'Gas Laws', formula: 'PV = nRT', description: 'Ideal gas equation' },
  { id: 'c5', subject: 'chemistry', category: 'Gas Laws', formula: 'P₁V₁ = P₂V₂', description: "Boyle's law" },
  { id: 'c6', subject: 'chemistry', category: 'Gas Laws', formula: 'V/T = constant', description: "Charles's law" },

  // ── Chemistry: Solutions ──
  { id: 'c7', subject: 'chemistry', category: 'Solutions', formula: 'Molarity = moles/volume(L)', description: 'Molarity formula' },
  { id: 'c8', subject: 'chemistry', category: 'Solutions', formula: 'ppm = (mass solute/mass solution)×10⁶', description: 'Parts per million' },

  // ── Chemistry: Electrochemistry ──
  { id: 'c9', subject: 'chemistry', category: 'Electrochemistry', formula: 'E°cell = E°cathode − E°anode', description: 'Standard cell potential' },

  // ── Chemistry: pH ──
  { id: 'c10', subject: 'chemistry', category: 'pH', formula: 'pH = −log[H⁺]', description: 'pH formula' },
  { id: 'c11', subject: 'chemistry', category: 'pH', formula: 'pOH = −log[OH⁻]', description: 'pOH formula' },
  { id: 'c12', subject: 'chemistry', category: 'pH', formula: 'pH + pOH = 14', description: 'pH-pOH relationship' },

  // ── Chemistry: Thermochemistry ──
  { id: 'c13', subject: 'chemistry', category: 'Thermochemistry', formula: 'ΔH = ΣΔHf(products) − ΣΔHf(reactants)', description: "Hess's law" },

  // ── Chemistry: Stoichiometry ──
  { id: 'c14', subject: 'chemistry', category: 'Stoichiometry', formula: 'M₁V₁ = M₂V₂', description: 'Dilution formula' },
  { id: 'c15', subject: 'chemistry', category: 'Stoichiometry', formula: '% yield = (actual/theoretical) × 100', description: 'Percentage yield' },

  // ── Mathematics: Quadratic ──
  { id: 'm1', subject: 'mathematics', category: 'Quadratic Equations', formula: 'x = (−b ± √(b²−4ac)) / 2a', description: 'Quadratic formula' },
  { id: 'm2', subject: 'mathematics', category: 'Quadratic Equations', formula: 'D = b² − 4ac', description: 'Discriminant' },

  // ── Mathematics: Trigonometry ──
  { id: 'm3', subject: 'mathematics', category: 'Trigonometry', formula: 'sin²θ + cos²θ = 1', description: 'Pythagorean identity' },
  { id: 'm4', subject: 'mathematics', category: 'Trigonometry', formula: 'tanθ = sinθ/cosθ', description: 'Tangent identity' },
  { id: 'm5', subject: 'mathematics', category: 'Trigonometry', formula: '2sinθcosθ = sin2θ', description: 'Double angle formula (sine)' },
  { id: 'm6', subject: 'mathematics', category: 'Trigonometry', formula: '1 + tan²θ = sec²θ', description: 'Secant identity' },
  { id: 'm7', subject: 'mathematics', category: 'Trigonometry', formula: 'cos2θ = cos²θ − sin²θ', description: 'Double angle formula (cosine)' },

  // ── Mathematics: Coordinate Geometry ──
  { id: 'm8', subject: 'mathematics', category: 'Coordinate Geometry', formula: 'd = √((x₂−x₁)² + (y₂−y₁)²)', description: 'Distance between two points' },
  { id: 'm9', subject: 'mathematics', category: 'Coordinate Geometry', formula: 'midpoint = ((x₁+x₂)/2, (y₁+y₂)/2)', description: 'Midpoint formula' },

  // ── Mathematics: Arithmetic Progression ──
  { id: 'm10', subject: 'mathematics', category: 'Arithmetic Progression', formula: 'aₙ = a + (n−1)d', description: 'nth term of AP' },
  { id: 'm11', subject: 'mathematics', category: 'Arithmetic Progression', formula: 'Sₙ = n/2(2a + (n−1)d)', description: 'Sum of n terms of AP' },
  { id: 'm12', subject: 'mathematics', category: 'Arithmetic Progression', formula: 'Sₙ = n/2(a + l)', description: 'Sum of n terms (first + last)' },

  // ── Mathematics: Circle ──
  { id: 'm13', subject: 'mathematics', category: 'Circle', formula: '(x−h)² + (y−k)² = r²', description: 'Equation of a circle' },
  { id: 'm14', subject: 'mathematics', category: 'Circle', formula: 'Area = πr²', description: 'Area of a circle' },
  { id: 'm15', subject: 'mathematics', category: 'Circle', formula: 'Circumference = 2πr', description: 'Circumference of a circle' },

  // ── Mathematics: Statistics ──
  { id: 'm16', subject: 'mathematics', category: 'Statistics', formula: 'Mean = Σx/n', description: 'Arithmetic mean' },
  { id: 'm17', subject: 'mathematics', category: 'Statistics', formula: 'Variance = Σ(x−μ)²/n', description: 'Population variance' },
  { id: 'm18', subject: 'mathematics', category: 'Statistics', formula: 'σ = √(Variance)', description: 'Standard deviation' },

  // ── Mathematics: Matrix ──
  { id: 'm19', subject: 'mathematics', category: 'Matrix', formula: 'det = ad − bc', description: 'Determinant of 2×2 matrix' },

  // ── Biology: Cell Biology ──
  { id: 'b1', subject: 'biology', category: 'Cell Biology', formula: 'Cell Theory: All living things made of cells', description: 'Fundamental principle of biology' },
  { id: 'b2', subject: 'biology', category: 'Cell Biology', formula: 'Prokaryote: 0.1−5 μm', description: 'Prokaryotic cell size range' },
  { id: 'b3', subject: 'biology', category: 'Cell Biology', formula: 'Eukaryote: 10−100 μm', description: 'Eukaryotic cell size range' },
  { id: 'b4', subject: 'biology', category: 'Cell Biology', formula: 'Mitosis: Prophase → Metaphase → Anaphase → Telophase', description: 'Mitosis phases in order' },

  // ── Biology: Genetics ──
  { id: 'b5', subject: 'biology', category: 'Genetics', formula: 'Monohybrid ratio: 3 : 1', description: 'F2 generation phenotype ratio' },
  { id: 'b6', subject: 'biology', category: 'Genetics', formula: 'Dihybrid ratio: 9 : 3 : 3 : 1', description: 'F2 dihybrid cross ratio' },
  { id: 'b7', subject: 'biology', category: 'Genetics', formula: 'A=T, G=C', description: "Chargaff's rule (DNA base pairing)" },

  // ── Biology: Photosynthesis ──
  { id: 'b8', subject: 'biology', category: 'Photosynthesis', formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', description: 'Overall photosynthesis equation' },
  { id: 'b9', subject: 'biology', category: 'Photosynthesis', formula: 'Light Rxn + Calvin Cycle (Dark Rxn)', description: 'Two stages of photosynthesis' },

  // ── Biology: Ecology ──
  { id: 'b10', subject: 'biology', category: 'Ecology', formula: '10% Energy Transfer Law', description: 'Energy passed between trophic levels' },
  { id: 'b11', subject: 'biology', category: 'Ecology', formula: 'Producer → Primary → Secondary → Tertiary', description: 'Food chain energy flow' },

  // ── Biology: Human Body ──
  { id: 'b12', subject: 'biology', category: 'Human Body', formula: 'Blood Pressure: 120/80 mmHg (normal)', description: 'Normal systolic/diastolic pressure' },
  { id: 'b13', subject: 'biology', category: 'Human Body', formula: 'Heart Rate: 72 bpm (average)', description: 'Normal resting heart rate' },
  { id: 'b14', subject: 'biology', category: 'Human Body', formula: 'Body Temp: 37°C (98.6°F)', description: 'Normal human body temperature' },
  { id: 'b15', subject: 'biology', category: 'Human Body', formula: 'Blood pH: 7.35 − 7.45', description: 'Normal blood pH range' },
]

// ─── Subject tabs ────────────────────────────────────────────────────────────

const SUBJECT_TABS: { key: SubjectKey | 'all' | 'bookmarked'; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: BookText },
  { key: 'physics', label: 'Physics', icon: Atom },
  { key: 'chemistry', label: 'Chemistry', icon: FlaskConical },
  { key: 'mathematics', label: 'Maths', icon: Calculator },
  { key: 'biology', label: 'Biology', icon: Leaf },
  { key: 'bookmarked', label: 'Saved', icon: BookmarkCheck },
]

// ─── Pre-computed decorative positions (no Math.random) ─────────────────────

const DECORATIVE_ORBS = [
  { top: '5%', left: '10%', size: 200, color: 'rgba(0,240,255,0.04)' },
  { top: '20%', right: '5%', size: 160, color: 'rgba(168,85,247,0.04)' },
  { top: '60%', left: '3%', size: 140, color: 'rgba(244,114,182,0.03)' },
  { top: '80%', right: '8%', size: 180, color: 'rgba(74,222,128,0.03)' },
]

// ─── Stagger animation config ────────────────────────────────────────────────

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Bookmark helpers (localStorage) ────────────────────────────────────────

const STORAGE_KEY = 'icseasy-bookmarked-formulas'

function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveBookmarks(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function FormulaSheetsPage() {
  const [activeTab, setActiveTab] = useState<SubjectKey | 'all' | 'bookmarked'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Toggle bookmark
  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      saveBookmarks(next)
      return next
    })
  }, [])

  // Copy formula to clipboard
  const copyFormula = useCallback(async (formula: Formula) => {
    try {
      await navigator.clipboard.writeText(formula.formula)
      setCopiedId(formula.id)
      toast.success('Copied to clipboard!', {
        description: formula.formula,
        duration: 2000,
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [])

  // Filter formulas
  const filteredFormulas = FORMULAS.filter((f) => {
    // Subject filter
    if (activeTab !== 'all' && activeTab !== 'bookmarked' && f.subject !== activeTab) return false

    // Bookmarked filter
    if (activeTab === 'bookmarked' && !bookmarks.has(f.id)) return false

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        f.formula.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        SUBJECT_META[f.subject].label.toLowerCase().includes(q)
      )
    }

    return true
  })

  // Count formulas per subject
  const subjectCounts: Record<string, number> = {
    all: FORMULAS.length,
    physics: FORMULAS.filter((f) => f.subject === 'physics').length,
    chemistry: FORMULAS.filter((f) => f.subject === 'chemistry').length,
    mathematics: FORMULAS.filter((f) => f.subject === 'mathematics').length,
    biology: FORMULAS.filter((f) => f.subject === 'biology').length,
    bookmarked: bookmarks.size,
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen lg:pl-[260px] relative pb-24 lg:pb-0 pt-14 lg:pt-0">
        {/* Decorative background orbs */}
        {DECORATIVE_ORBS.map((orb, i) => (
          <div
            key={i}
            className="fixed pointer-events-none rounded-full blur-3xl"
            style={{
              top: orb.top,
              left: orb.left ? orb.left : undefined,
              right: orb.right ? orb.right : undefined,
              width: orb.size,
              height: orb.size,
              background: orb.color,
            }}
          />
        ))}

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#a855f7] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                <BookText className="w-5 h-5 text-[#0a0a0f]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Formula Sheets</h1>
                <p className="text-xs text-muted-foreground">Quick reference for all ICSE subjects</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mt-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search formulas, topics, or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-animated pl-10 h-11 glass-card bg-white/[0.03] border-white/10 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-[#00f0ff]/40 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Subject Tabs ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              {SUBJECT_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                const meta = tab.key !== 'all' && tab.key !== 'bookmarked'
                  ? SUBJECT_META[tab.key as SubjectKey]
                  : null

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                      isActive
                        ? meta
                          ? `${meta.bg} ${meta.color} ${meta.badge} border-current/20 shadow-[0_0_15px_rgba(0,0,0,0.1)]`
                          : 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,0,0,0.1)]'
                        : 'bg-white/[0.03] text-muted-foreground border-white/5 hover:bg-white/[0.06] hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-md',
                      isActive
                        ? 'bg-white/10'
                        : 'bg-white/5'
                    )}>
                      {subjectCounts[tab.key]}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* ── Formula Grid ────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${searchQuery}`}
              variants={STAGGER_CONTAINER}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredFormulas.map((formula) => (
                <FormulaCard
                  key={formula.id}
                  formula={formula}
                  isBookmarked={bookmarks.has(formula.id)}
                  isCopied={copiedId === formula.id}
                  onToggleBookmark={toggleBookmark}
                  onCopy={copyFormula}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* ── Empty State ─────────────────────────────────────────────── */}
          {filteredFormulas.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="orbital-enhanced mb-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  {activeTab === 'bookmarked' ? (
                    <BookmarkCheck className="w-7 h-7 text-muted-foreground/40" />
                  ) : (
                    <Search className="w-7 h-7 text-muted-foreground/40" />
                  )}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {activeTab === 'bookmarked' ? 'No bookmarked formulas' : 'No formulas found'}
              </h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs">
                {activeTab === 'bookmarked'
                  ? 'Bookmark formulas you want to review later. They\'ll appear here for quick access.'
                  : searchQuery
                    ? 'Try adjusting your search terms or browse a different subject.'
                    : 'No formulas available for this selection.'}
              </p>
              {(activeTab === 'bookmarked' || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'bookmarked') setActiveTab('all')
                    else setSearchQuery('')
                  }}
                  className="mt-4 border-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Browse all formulas
                </Button>
              )}
            </motion.div>
          )}

          {/* ── Footer Stats ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 pt-6 border-t border-white/5"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/50">
              <span className="flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-[#00f0ff]/40" />
                {subjectCounts.physics} Physics
              </span>
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-[#a855f7]/40" />
                {subjectCounts.chemistry} Chemistry
              </span>
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#f472b6]/40" />
                {subjectCounts.mathematics} Maths
              </span>
              <span className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#4ade80]/40" />
                {subjectCounts.biology} Biology
              </span>
              <span className="text-muted-foreground/30">
                • {FORMULAS.length} total formulas
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Formula Card ────────────────────────────────────────────────────────────

function FormulaCard({
  formula,
  isBookmarked,
  isCopied,
  onToggleBookmark,
  onCopy,
}: {
  formula: Formula
  isBookmarked: boolean
  isCopied: boolean
  onToggleBookmark: (id: string) => void
  onCopy: (f: Formula) => void
}) {
  const meta = SUBJECT_META[formula.subject]
  const SubjectIcon = meta.icon

  return (
    <motion.div
      variants={STAGGER_ITEM}
      layout
      className={cn(
        'group glass-card rounded-xl p-4 border-l-[3px] transition-all duration-300 hover:shadow-lg',
        meta.border,
        meta.glow,
        'hover:bg-white/[0.04]'
      )}
    >
      {/* Top row: category + actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', meta.bg)}>
            <SubjectIcon className={cn('w-3.5 h-3.5', meta.color)} />
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-2 py-0 rounded-md font-medium border',
              meta.badge
            )}
          >
            {formula.category}
          </Badge>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Copy button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCopy(formula)}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                  isCopied
                    ? 'bg-[#4ade80]/10 text-[#4ade80]'
                    : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5'
                )}
              >
                <AnimatePresence mode="wait">
                  {isCopied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-[#0a0a0f] border-white/10">
              {isCopied ? 'Copied!' : 'Copy formula'}
            </TooltipContent>
          </Tooltip>

          {/* Bookmark button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggleBookmark(formula.id)}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                  isBookmarked
                    ? 'bg-[#f472b6]/10 text-[#f472b6]'
                    : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5'
                )}
              >
                <AnimatePresence mode="wait">
                  {isBookmarked ? (
                    <motion.span
                      key="bookmarked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="bookmark"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-[#0a0a0f] border-white/10">
              {isBookmarked ? 'Remove bookmark' : 'Bookmark formula'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Formula text */}
      <div className={cn(
        'font-mono text-base sm:text-lg font-semibold tracking-wide mb-2 leading-relaxed break-words',
        meta.color
      )}>
        {formula.formula}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground/60 leading-relaxed">
        {formula.description}
      </p>

      {/* Bottom: subject label */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5">
        <span className={cn('text-[10px] font-medium', meta.color, 'opacity-60')}>
          {meta.label}
        </span>
        <span className="text-[10px] text-muted-foreground/30">•</span>
        <span className="text-[10px] text-muted-foreground/30">{formula.category}</span>
      </div>
    </motion.div>
  )
}
