'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  MapPin,
  Languages,
  Plane,
  UserPlus,
  Heart,
  Check,
  ChevronRight,
} from 'lucide-react'
import { getAllLanguages, getLanguage } from '@/lib/db'
import type { Language } from '@/types'

const HELP_OPTIONS = [
  {
    id: 'speaker',
    icon: Languages,
    title: 'I know this language',
    description: 'Add yourself as a contributor to help document vocabulary',
  },
  {
    id: 'translator',
    icon: Check,
    title: 'I can validate translations',
    description: 'Help verify that contributed words are accurate',
  },
  {
    id: 'travel',
    icon: Plane,
    title: 'I can travel to this community',
    description: 'Join field documentation efforts in the region',
  },
  {
    id: 'referral',
    icon: UserPlus,
    title: 'I know someone who speaks it',
    description: 'Refer a speaker to help with documentation',
  },
]

function VolunteerContent() {
  const searchParams = useSearchParams()
  const langId = searchParams.get('lang')

  const [language, setLanguage] = useState<Language | null>(null)
  const [allLanguages, setAllLanguages] = useState<Language[]>([])
  const [selectedHelp, setSelectedHelp] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [referralName, setReferralName] = useState('')
  const [referralContact, setReferralContact] = useState('')

  useEffect(() => {
    getAllLanguages().then(setAllLanguages)
    if (langId) {
      getLanguage(langId).then(setLanguage)
    }
  }, [langId])

  const urgentLanguages = allLanguages
    .filter((l) => l.status === 'critical' || l.speakerCount < 1000)
    .slice(0, 5)

  const toggleHelp = (id: string) => {
    setSelectedHelp((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <Heart className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank you for volunteering
          </h2>
          <p className="text-gray-500 dark:text-white/50 mb-6">
            We&apos;ll notify you when there are opportunities to help
            {language ? ` document ${language.name}` : ''}.
          </p>
          <Link
            href={language ? `/dictionary/${language.id}` : '/'}
            className="block w-full py-4 rounded-2xl bg-brand text-white font-semibold"
          >
            {language ? `Go to ${language.name} dictionary` : 'Return home'}
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-32">
      <header className="mb-6">
        <Link
          href={language ? `/dictionary/${language.id}` : '/'}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Volunteer to Help
        </h1>
        <p className="text-sm text-gray-500 dark:text-white/50">
          {language
            ? `Help preserve ${language.name} before it's too late`
            : 'Join our community of language preservation volunteers'}
        </p>
      </header>

      {language && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{language.name}</p>
              <p className="text-sm text-gray-500 dark:text-white/50 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {language.province}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {language.wordCount} words documented · {language.contributors} contributors
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-4">
          How can you help?
        </h2>
        <div className="space-y-3">
          {HELP_OPTIONS.map((option, i) => {
            const isSelected = selectedHelp.includes(option.id)
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleHelp(option.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-brand/10 border-brand/30'
                    : 'bg-gray-50 dark:bg-[#1c1c1e] border-gray-200 dark:border-white/[0.06]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-brand/20 text-brand' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/40'
                    }`}
                  >
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isSelected ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                      {option.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'bg-brand border-brand' : 'border-gray-300 dark:border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>

      {selectedHelp.includes('referral') && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-4">
            Referral Details
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              value={referralName}
              onChange={(e) => setReferralName(e.target.value)}
              placeholder="Speaker's name"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white"
            />
            <input
              type="text"
              value={referralContact}
              onChange={(e) => setReferralContact(e.target.value)}
              placeholder="Their contact info (optional)"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white"
            />
          </div>
        </motion.section>
      )}

      {!language && urgentLanguages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-4">
            Languages needing urgent help
          </h2>
          <div className="space-y-2">
            {urgentLanguages.map((lang) => (
              <Link
                key={lang.id}
                href={`/volunteer?lang=${lang.id}`}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.06]"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{lang.name}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40">{lang.province}</p>
                </div>
                <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full">
                  {lang.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-white/30" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedHelp.length === 0}
        className="w-full py-4 rounded-2xl bg-brand text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit volunteer interest
      </button>
    </div>
  )
}

export default function VolunteerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VolunteerContent />
    </Suspense>
  )
}
