'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, TrendingUp, Users, BookOpen, MapPin, ChevronRight, MoreHorizontal, Heart, Activity } from 'lucide-react'
import Link from 'next/link'
import { initializeDatabase, getAllLanguages, saveLanguage } from '@/lib/db'
import type { Language } from '@/types'

const filters = ['All', 'Luzon', 'Visayas', 'Mindanao', 'Critical', 'Active']

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-500 dark:text-red-400' },
  growing: { dot: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' },
  active: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
}

export default function HomePage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [filtered, setFiltered] = useState<Language[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)
  const [form, setForm] = useState({ name: '', region: '', province: '' })

  useEffect(() => {
    (async () => {
      await initializeDatabase()
      const all = await getAllLanguages()
      setLanguages(all)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    let result = languages
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q) || l.province.toLowerCase().includes(q))
    }
    if (filter === 'Critical') result = result.filter(l => l.status === 'critical')
    else if (filter === 'Active') result = result.filter(l => l.status === 'active')
    else if (['Luzon', 'Visayas', 'Mindanao'].includes(filter)) result = result.filter(l => l.region === filter)
    setFiltered(result)
  }, [languages, search, filter])

  const handleAdd = async () => {
    if (!form.name || !form.region || !form.province) return
    const lang: Language = {
      id: `${form.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: form.name, region: form.region, province: form.province,
      speakerCount: 0, wordCount: 0, status: 'critical',
      description: `Community documentation of ${form.name}.`,
      coverColor: '#0A84FF', contributors: 1, learners: 0,
    }
    await saveLanguage(lang)
    setLanguages(prev => [...prev, lang])
    setShowModal(false)
    setForm({ name: '', region: '', province: '' })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <img src="/logo.png" alt="Lingua PH" className="w-9 h-9 rounded-xl" />
          <h1 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-white">Lingua PH</h1>
        </div>
        <p className="text-gray-500 dark:text-white/40 text-[13px] ml-[46px]">Preserve indigenous languages</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Languages', value: languages.length, icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
          { label: 'Words', value: languages.reduce((s, l) => s + l.wordCount, 0), icon: BookOpen, color: 'text-brand' },
          { label: 'Users', value: languages.reduce((s, l) => s + l.contributors, 0), icon: Users, color: 'text-purple-600 dark:text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className={`flex items-center gap-1.5 mb-1.5 ${s.color}`}>
              <s.icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none">{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-white/30" />
        <input
          type="text"
          placeholder="Search languages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-11"
        />
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`chip whitespace-nowrap ${filter === f ? 'chip-active' : 'chip-inactive'}`}>
            {f}
          </button>
        ))}
      </motion.div>

      {/* Language Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((lang, i) => {
          const s = statusColors[lang.status]
          return (
            <motion.div
              key={lang.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
            >
              <Link href={`/dictionary/${lang.id}`} className="block card p-4 h-full">
                <h3 className="text-[18px] text-gray-900 dark:text-white font-semibold leading-tight">{lang.name}</h3>
                <div className="flex items-center gap-1 text-gray-400 dark:text-white/40 text-[11px] mt-1 mb-3">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{lang.province}</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.text} mb-3`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {lang.status}
                </div>

                <div className="flex items-center gap-3 text-[12px]">
                  <span className="text-gray-500 dark:text-white/50"><span className="text-gray-900 dark:text-white font-semibold">{lang.wordCount}</span> words</span>
                  <span className="text-gray-500 dark:text-white/50"><span className="text-gray-900 dark:text-white font-semibold">{lang.contributors}</span> people</span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
                  <div className="flex -space-x-1.5">
                    {[...Array(Math.min(3, lang.contributors))].map((_, j) => (
                      <div key={j} className="w-5 h-5 rounded-full bg-gradient-to-br from-brand to-blue-400 border-[1.5px] border-white dark:border-surface-2 flex items-center justify-center text-[7px] font-bold text-white">
                        {String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-white/30">{lang.learners} learners</span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-white/30 text-[15px]">No languages found</p>
        </div>
      )}

      {/* Floating Action Button with Menu */}
      <div className="fixed bottom-24 right-5 z-40">
        <div className="relative">
          {showFloatingMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 right-0 bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden min-w-[200px]"
            >
              <button
                onClick={() => { setShowModal(true); setShowFloatingMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                <Plus className="w-5 h-5 text-brand" />
                Add new language
              </button>
              <Link
                href="/health"
                onClick={() => setShowFloatingMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors border-t border-gray-100 dark:border-white/[0.04]"
              >
                <Activity className="w-5 h-5 text-green-500" />
                View language health map
              </Link>
            </motion.div>
          )}
          <button
            onClick={() => setShowFloatingMenu(!showFloatingMenu)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-xl shadow-brand/25 transition-all hover:scale-105 active:scale-95"
            aria-label="Actions menu"
          >
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Overlay to close menu */}
      {showFloatingMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowFloatingMenu(false)} />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-2 rounded-3xl p-6 w-full max-w-sm border border-gray-200 dark:border-white/[0.08] shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-[22px] text-gray-900 dark:text-white font-semibold mb-5">Add Language</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Language name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
              <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} className="input-field appearance-none">
                <option value="">Select region</option>
                <option value="Luzon">Luzon</option>
                <option value="Visayas">Visayas</option>
                <option value="Mindanao">Mindanao</option>
              </select>
              <input type="text" placeholder="Province" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} className="input-field" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name || !form.region || !form.province} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
