import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const subjectsData = [
  {
    name: 'Physics',
    icon: 'Atom',
    color: '#00f0ff',
    description: 'Explore the fundamental laws governing the universe, from mechanics to electromagnetism.',
    topics: [
      'Force & Laws of Motion',
      'Light - Reflection & Refraction',
      'Sound',
      'Electricity & Magnetism',
      'Heat',
      'Nuclear Physics',
      'Work Energy & Power',
      'Gravitation',
      'Current Electricity',
      'Magnetic Effects of Current',
    ],
  },
  {
    name: 'Chemistry',
    icon: 'FlaskConical',
    color: '#a855f7',
    description: 'Discover the composition, structure, and reactions of matter at the molecular level.',
    topics: [
      'Periodic Table & Elements',
      'Chemical Bonding',
      'Acids Bases & Salts',
      'Organic Chemistry',
      'Metals & Non-metals',
      'Stoichiometry',
      'Electrochemistry',
      'Chemical Kinetics',
      'Solutions',
      'Surface Chemistry',
    ],
  },
  {
    name: 'Mathematics',
    icon: 'Calculator',
    color: '#ec4899',
    description: 'Build strong problem-solving skills with algebra, trigonometry, calculus, and statistics.',
    topics: [
      'Quadratic Equations',
      'Trigonometry',
      'Coordinate Geometry',
      'Statistics & Probability',
      'Circle & Constructions',
      'Matrices & Determinants',
      'Limits & Derivatives',
      'Arithmetic Progressions',
      'Linear Inequations',
      'Commercial Mathematics',
    ],
  },
  {
    name: 'Biology',
    icon: 'Leaf',
    color: '#22c55e',
    description: 'Study living organisms, their structure, functions, growth, and interactions with the environment.',
    topics: [
      'Cell Structure & Function',
      'Human Digestive System',
      'Genetics & Evolution',
      'Photosynthesis',
      'Ecology & Environment',
      'Human Respiratory System',
      'Excretory System',
      'Nervous System',
      'Reproduction in Plants',
      'Microorganisms',
    ],
  },
  {
    name: 'English',
    icon: 'BookOpen',
    color: '#f59e0b',
    description: 'Master the English language through literature, grammar, writing, and comprehension skills.',
    topics: [
      'Essay Writing',
      'Grammar & Usage',
      'Literature: Prose',
      'Literature: Poetry',
      'Comprehension Skills',
      'Letter Writing',
      'Story Writing',
      'Shakespeare: Merchant of Venice',
      'Julius Caesar',
      'ISC Poetry Collection',
    ],
  },
  {
    name: 'History',
    icon: 'Landmark',
    color: '#ef4444',
    description: 'Journey through time to understand civilizations, revolutions, and events that shaped the modern world.',
    topics: [
      'Indian National Movement',
      'World War I & II',
      'French Revolution',
      'Industrial Revolution',
      'Modern World History',
      'The American Revolution',
      'Unification of Germany & Italy',
      'The Cold War',
      'The Renaissance',
      'Colonization & Imperialism',
    ],
  },
  {
    name: 'Geography',
    icon: 'Globe',
    color: '#06b6d4',
    description: 'Understand Earth\'s physical features, climate systems, resources, and human-environment interactions.',
    topics: [
      'Climate & Weather',
      'Water Resources',
      'Soil & Agriculture',
      'Map Reading',
      'Natural Disasters',
      'Population Dynamics',
      'Minerals & Energy Resources',
      'Transport & Communication',
      'Indian Climate',
      'Environmental Issues',
    ],
  },
  {
    name: 'Computer Science',
    icon: 'Monitor',
    color: '#8b5cf6',
    description: 'Learn programming, data structures, algorithms, and the fundamentals of computing systems.',
    topics: [
      'Programming Basics',
      'Data Structures',
      'Boolean Algebra',
      'Networking Concepts',
      'Database Concepts',
      'Operating System Basics',
      'Software Engineering',
      'Internet & Web',
      'HTML & CSS Basics',
      'Flowcharts & Algorithms',
    ],
  },
]

export async function GET() {
  try {
    const existingCount = await db.subject.count()

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Already seeded',
        subjects: existingCount,
        topics: await db.topic.count(),
      })
    }

    for (const subject of subjectsData) {
      const created = await db.subject.create({
        data: {
          name: subject.name,
          icon: subject.icon,
          color: subject.color,
          description: subject.description,
          topics: {
            create: subject.topics.map((topicName) => ({
              name: topicName,
            })),
          },
        },
        include: { topics: true },
      })

      console.log(`Created ${created.name} with ${created.topics.length} topics`)
    }

    const totalSubjects = await db.subject.count()
    const totalTopics = await db.topic.count()

    return NextResponse.json({
      message: 'Seeded successfully',
      subjects: totalSubjects,
      topics: totalTopics,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
