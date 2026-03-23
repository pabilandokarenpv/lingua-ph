'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  TrendingUp,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle,
  MapPin,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { getAllLanguages } from '@/lib/db'
import type { Language } from '@/types'

type SortOption = 'urgent' | 'active' | 'alphabetical' | 'region'

const STATUS_CONFIG = {
  emergency: {
    label: 'Emergency',
    dot: 'bg-black dark:bg-white',
    bg: 'bg-black/10 dark:bg-white/10',
    text: 'text-black dark:text-white',
    description: 'Last known speaker',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    description: 'Under 50 words documented',
  },
  growing: {
    label: 'Vulnerable',
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-500',
    description: '50-200 words',
  },
  active: {
    label: 'Growing',
    dot: 'bg-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-500',
    description: '200-500 words',
  },
  thriving: {
    label: 'Thriving',
    dot: 'bg-brand',
    bg: 'bg-brand/10',
    text: 'text-brand',
    description: '500+ words',
  },
}

function getHealthStatus(lang: Language): keyof typeof STATUS_CONFIG {
  if (lang.speakerCount && lang.speakerCount < 100) return 'emergency'
  if (lang.wordCount < 50) return 'critical'
  if (lang.wordCount < 200) return 'growing'
  if (lang.wordCount < 500) return 'active'
  return 'thriving'
}

export default function HealthPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('urgent')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const all = await getAllLanguages()
    setLanguages(all)
    setLastUpdated(new Date())
    setLoading(false)
  }

  const sortedLanguages = [...languages].sort((a, b) => {
    switch (sortBy) {
      case 'urgent':
        const statusOrder = { emergency: 0, critical: 1, growing: 2, active: 3, thriving: 4 }
        return statusOrder[getHealthStatus(a)] - statusOrder[getHealthStatus(b)]
      case 'active':
        return b.contributors - a.contributors
      case 'alphabetical':
        return a.name.localeCompare(b.name)
      case 'region':
        return a.region.localeCompare(b.region)
      default:
        return 0
    }
  })

  const urgentLanguages = sortedLanguages.filter(
    (l) => getHealthStatus(l) === 'emergency' || getHealthStatus(l) === 'critical'
  )

  const stats = {
    languages: languages.length,
    words: languages.reduce((sum, l) => sum + l.wordCount, 0),
    contributors: languages.reduce((sum, l) => sum + l.contributors, 0),
    learners: languages.reduce((sum, l) => sum + l.learners, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-32">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-600 dark:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Language Health
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-white/50">
          Real-time status of {languages.length} documented languages
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-white/30">
          <RefreshCw className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {[
          { label: 'Languages', value: stats.languages, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Words', value: stats.words, icon: BookOpen, color: 'text-brand' },
          { label: 'Contributors', value: stats.contributors, icon: Users, color: 'text-purple-500' },
          { label: 'Learners', value: stats.learners, icon: GraduationCap, color: 'text-amber-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4"
          >
            <div className={`flex items-center gap-1.5 mb-1 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <motion.p
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {stat.value.toLocaleString()}
            </motion.p>
          </div>
        ))}
      </motion.div>

      {urgentLanguages.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Most Urgent
            </h2>
          </div>
          <div className="space-y-2">
            {urgentLanguages.slice(0, 3).map((lang) => {
              const status = getHealthStatus(lang)
              const config = STATUS_CONFIG[status]
              return (
                <Link
                  key={lang.id}
                  href={`/dictionary/${lang.id}`}
                  className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{lang.name}</p>
                    <p className="text-sm text-gray-500 dark:text-white/50">{lang.province}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-1">{lang.wordCount} words</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-white/30" />
                </Link>
              )
            })}
          </div>
        </motion.section>
      )}

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { id: 'urgent' as const, label: 'Most Urgent' },
          { id: 'active' as const, label: 'Most Active' },
          { id: 'alphabetical' as const, label: 'A-Z' },
          { id: 'region' as const, label: 'By Region' },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sortBy === opt.id
                ? 'bg-brand text-white'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sortedLanguages.map((lang, i) => {
          const status = getHealthStatus(lang)
          const config = STATUS_CONFIG[status]
          return (
            <motion.div
              key={lang.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/dictionary/${lang.id}`}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{lang.name}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text}`}>
                      <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                      {config.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40">
                    <MapPin className="w-3 h-3" />
                    {lang.region} · {lang.province}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{lang.wordCount}</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/30">words</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{lang.contributors}</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/30">contributors</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-white/30" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
