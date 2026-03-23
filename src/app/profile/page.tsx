'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit2,
  Plus,
  X,
  Mic,
  FileText,
  Headphones,
  Flame,
  BadgeCheck,
  Trophy,
  Star,
  Lock,
  Sun,
  Moon,
  Monitor,
  Bell,
  Volume2,
  Trash2,
  Shield,
  Info,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { getProfile, saveProfile, getAllLanguages, getWordsByLanguage } from '@/lib/db'
import { useTheme } from '@/lib/theme'
import type { UserProfile, Language, WordEntry } from '@/types'

const TABS = [
  { id: 'profile' as const, label: 'Profile' },
  { id: 'settings' as const, label: 'Settings' },
  { id: 'privacy' as const, label: 'Privacy' },
  { id: 'about' as const, label: 'About' },
]

type TabId = (typeof TABS)[number]['id']

const partnerOrgs = [
  {
    name: 'NCIP',
    fullName: 'NCIP — National Commission on Indigenous Peoples',
    description: 'Community verification and FPIC compliance under IPRA (RA 8371). Verifies that community founders are legitimate representatives of their indigenous cultural community.',
  },
  {
    name: 'Agora Philippines',
    fullName: 'Agora Philippines',
    description: 'A civic technology organization promoting digital inclusion and community engagement in the Philippines. Partners with Lingua PH to ensure indigenous communities have access to language preservation tools and digital literacy programs.',
  },
  {
    name: 'KWF',
    fullName: 'KWF — Komisyon sa Wikang Filipino',
    description: "Official registry of 186 Philippine languages. Provides Lingua PH with the authoritative list of languages and their classification.",
  },
  {
    name: 'DepEd',
    fullName: 'DepEd — Mother Tongue-Based MLE Program',
    description: "Lingua PH directly addresses the materials gap in DepEd's Mother Tongue-Based Multilingual Education program. Community-validated vocabulary becomes classroom-ready material.",
  },
  {
    name: 'DOST-PCIEERD',
    fullName: 'DOST-PCIEERD — MinNa LProc Laboratory',
    description: "The Mindanao Natural Language Processing Laboratory (launched 2025) built machine translation systems for 6 Mindanao languages. Their NLP models power Lingua PH's AI translation suggestions.",
  },
  {
    name: 'NightOwl AI',
    fullName: 'NightOwl AI',
    description: 'Filipino AI startup with a 2-million-word indigenous language database. Founded by Anna Mae Yu Lamentillo, a Karay-a ethnolinguistic community member.',
  },
  {
    name: 'SIL Philippines',
    fullName: 'SIL Philippines',
    description: "Working since 1953, SIL has documented 94 of 186 Philippine languages. Lingua PH imports SIL's existing lexicon data directly.",
  },
  {
    name: 'MSU-IIT',
    fullName: 'MSU-IIT — Higaonon Mobile Dictionary Project',
    description: 'Published research in 2025 on a participatory mobile dictionary for the Higaonon language, conducted with NCIP certification.',
  },
  {
    name: 'National Museum',
    fullName: 'National Museum of the Philippines — Division of Ethnology',
    description: "Lingua PH's oral history recordings can be formally archived as part of the Philippine cultural heritage record through National Museum partnership.",
  },
  {
    name: 'UP Diliman',
    fullName: 'UP Diliman — Department of Linguistics',
    description: 'The Marayum online dictionary project and ongoing endangered language documentation programs provide academic validation for our methodology.',
  },
  {
    name: 'Endangered Languages Project',
    fullName: 'Endangered Languages Project',
    description: 'Global nonprofit that held the first Ayta Magbukun language camp in Bataan in May 2025. Connects Lingua PH to global best practices.',
  },
]

const PHILIPPINE_REGIONS = [
  'NCR - National Capital Region',
  'CAR - Cordillera Administrative Region',
  'Ilocos Region',
  'Cagayan Valley',
  'Central Luzon',
  'CALABARZON',
  'MIMAROPA',
  'Bicol Region',
  'Western Visayas',
  'Central Visayas',
  'Eastern Visayas',
  'Zamboanga Peninsula',
  'Northern Mindanao',
  'Davao Region',
  'SOCCSKSARGEN',
  'Caraga',
  'BARMM',
]

function achievementState(profile: UserProfile, contributorWordCount: number) {
  return [
    {
      id: 'first',
      name: 'First Contribution',
      unlocked:
        contributorWordCount > 0 || profile.wordsRecorded > 0 || profile.storiesShared > 0,
    },
    {
      id: 'streak7',
      name: '7 Day Streak',
      unlocked: profile.streak >= 7,
    },
    {
      id: 'top',
      name: 'Top Contributor',
      unlocked: profile.wordsRecorded >= 50 && profile.wordsConfirmed >= 20,
    },
    {
      id: 'expert',
      name: 'Language Expert',
      unlocked: profile.languagesContributing.length >= 3,
    },
  ] as const
}

function SettingsRow({ icon: Icon, label, children, destructive }: { icon: React.ElementType; label: string; children?: React.ReactNode; destructive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <Icon className={`h-[18px] w-[18px] ${destructive ? 'text-red-500' : 'text-gray-400 dark:text-white/40'}`} strokeWidth={1.8} />
        <span className={`text-[15px] ${destructive ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-white'}`}>{label}</span>
      </div>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [contributorWords, setContributorWords] = useState<WordEntry[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddLanguage, setShowAddLanguage] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showBugModal, setShowBugModal] = useState(false)
  const [showLicensesModal, setShowLicensesModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [dataSharing, setDataSharing] = useState<'device' | 'community' | 'research'>('device')
  const [autoPlay, setAutoPlay] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [isDiaspora, setIsDiaspora] = useState(false)
  const [diasporaRegion, setDiasporaRegion] = useState('')
  const [diasporaLanguage, setDiasporaLanguage] = useState('')

  const loadData = useCallback(async () => {
    const [userProfile, allLanguages] = await Promise.all([getProfile(), getAllLanguages()])

    if (!userProfile) {
      setContributorWords([])
      const defaultProfile: UserProfile = {
        displayName: 'Guest User',
        phoneNumber: '',
        languagesContributing: [],
        languagesLearning: [],
        wordsRecorded: 0,
        wordsConfirmed: 0,
        storiesShared: 0,
        totalPlays: 0,
        learningProgress: {},
        streak: 1,
        lastActiveDate: new Date().toISOString(),
      }
      await saveProfile(defaultProfile)
      setProfile(defaultProfile)
    } else {
      setProfile(userProfile)
      const allWords: WordEntry[] = []
      for (const langId of userProfile.languagesContributing) {
        const words = await getWordsByLanguage(langId)
        allWords.push(...words.filter((w) => w.publishedBy === userProfile.displayName))
      }
      setContributorWords(allWords)
    }

    setLanguages(allLanguages)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openEditModal = () => {
    if (!profile) return
    setEditName(profile.displayName)
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    const trimmed = editName.trim()
    if (!trimmed) return

    const updatedProfile: UserProfile = {
      ...profile,
      displayName: trimmed,
    }

    await saveProfile(updatedProfile)
    setProfile(updatedProfile)
    setShowEditModal(false)
  }

  const handleClearData = async () => {
    if (typeof window !== 'undefined') {
      const dbs = ['lingua-languages', 'lingua-words', 'lingua-stories', 'lingua-profile', 'lingua-chat', 'lingua-community']
      for (const db of dbs) {
        try {
          const localforage = (await import('localforage')).default
          const store = localforage.createInstance({ name: db })
          await store.clear()
        } catch { /* ignore */ }
      }
      window.location.reload()
    }
    setShowClearConfirm(false)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent"
        />
        <p className="text-sm text-gray-400 dark:text-white/40">Lingua PH</p>
      </div>
    )
  }

  const contributingLangs = languages.filter((l) => profile.languagesContributing.includes(l.id))
  const achievements = achievementState(profile, contributorWords.length)
  const availableToAdd = languages.filter((l) => !profile.languagesContributing.includes(l.id))

  return (
    <div className="min-h-screen px-5 pt-3 pb-28">
      {/* Tab bar */}
      <div
        className="mb-5 flex rounded-xl bg-gray-100 dark:bg-[#1c1c1e] p-1 border border-gray-200 dark:border-white/[0.06]"
        role="tablist"
      >
        {TABS.map((tab) => {
          const on = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors ${
                on ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/45'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Profile card */}
            <section className="mb-5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-blue-400 text-3xl font-bold text-white shadow-md">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-white">{profile.displayName}</h2>
                  <span className="mt-2 inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                    Contributor
                  </span>
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand transition-opacity hover:opacity-80"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </section>

            {/* Diaspora Connect */}
            <section className="mb-5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Diaspora Connect
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[15px] text-gray-900 dark:text-white font-medium">Are you Filipino diaspora?</p>
                  <p className="text-[13px] text-gray-500 dark:text-white/40">Help preserve languages from your heritage</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDiaspora}
                  onClick={() => setIsDiaspora(!isDiaspora)}
                  className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
                    isDiaspora ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ${
                      isDiaspora ? 'translate-x-[20px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isDiaspora && (
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1.5">
                      Heritage region
                    </label>
                    <select
                      value={diasporaRegion}
                      onChange={(e) => setDiasporaRegion(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-black text-gray-900 dark:text-white text-sm appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(156,163,175,1)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="">Select region...</option>
                      {PHILIPPINE_REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1.5">
                      Family language
                    </label>
                    <select
                      value={diasporaLanguage}
                      onChange={(e) => setDiasporaLanguage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-black text-gray-900 dark:text-white text-sm appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(156,163,175,1)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="">Select language...</option>
                      {languages.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[12px] text-gray-400 dark:text-white/30 leading-relaxed">
                    Even 5 words from memory helps the community. Record words you remember from family conversations.
                  </p>
                </div>
              )}
            </section>

            {/* Streak banner */}
            <section className="mb-5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05]">
                  <Flame className="h-5 w-5 text-orange-500" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile.streak} day streak
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/40">Keep contributing daily</p>
                </div>
              </div>
            </section>

            {/* Stats grid */}
            <section className="mb-6 grid grid-cols-2 gap-3">
              {[
                { icon: Mic, label: 'Words recorded', value: profile.wordsRecorded, color: 'text-brand' },
                { icon: BadgeCheck, label: 'Words confirmed', value: profile.wordsConfirmed, color: 'text-emerald-500' },
                { icon: FileText, label: 'Stories shared', value: profile.storiesShared, color: 'text-violet-500' },
                { icon: Headphones, label: 'Total plays', value: profile.totalPlays, color: 'text-amber-500' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-4">
                  <div className={`mb-2 flex items-center gap-2 ${stat.color}`}>
                    <stat.icon className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* My languages */}
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                My languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {contributingLangs.map((lang) => (
                  <span
                    key={lang.id}
                    className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-sm text-brand"
                  >
                    {lang.name}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddLanguage(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-1.5 text-sm text-gray-500 dark:text-white/50 transition-colors hover:border-gray-300 dark:hover:border-white/[0.12] hover:text-gray-700 dark:hover:text-white/70"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </section>

            {/* Achievements */}
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Achievements
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {achievements.map((a) => {
                  const Icon =
                    a.id === 'first'
                      ? Mic
                      : a.id === 'streak7'
                        ? Flame
                        : a.id === 'top'
                          ? Trophy
                          : Star
                  return (
                    <div
                      key={a.id}
                      className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center ${
                        a.unlocked
                          ? 'border-green-300 dark:border-emerald-500/30 bg-green-50 dark:bg-[#1c1c1e]'
                          : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03]'
                      }`}
                    >
                      {!a.unlocked && (
                        <div className="absolute right-2 top-2 rounded-full bg-gray-200/60 dark:bg-black/40 p-1">
                          <Lock className="h-3 w-3 text-gray-400 dark:text-white/35" />
                        </div>
                      )}
                      <Icon
                        className={`h-7 w-7 ${a.unlocked ? 'text-brand' : 'text-gray-300 dark:text-white/25'}`}
                        strokeWidth={1.75}
                      />
                      <span
                        className={`text-[11px] font-medium leading-tight ${
                          a.unlocked ? 'text-gray-700 dark:text-white/80' : 'text-gray-400 dark:text-white/35'
                        }`}
                      >
                        {a.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          </motion.div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Appearance */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">Appearance</h3>
              <p className="text-[13px] text-gray-500 dark:text-white/40 mb-4">Choose how Lingua PH looks on your device.</p>
              <div className="flex gap-2">
                {([
                  { value: 'light' as const, icon: Sun, label: 'Light' },
                  { value: 'dark' as const, icon: Moon, label: 'Dark' },
                  { value: 'system' as const, icon: Monitor, label: 'System' },
                ] as const).map((opt) => {
                  const on = theme === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={`flex flex-1 flex-col items-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-all ${
                        on
                          ? 'bg-brand text-white shadow-md'
                          : 'bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-white/60 hover:border-gray-300 dark:hover:border-white/[0.1]'
                      }`}
                    >
                      <opt.icon className="h-5 w-5" strokeWidth={1.8} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Preferences */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-5 divide-y divide-gray-200 dark:divide-white/[0.06]">
              <SettingsRow icon={Volume2} label="Auto-play pronunciation">
                <button
                  type="button"
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`relative h-[30px] w-[50px] rounded-full transition-colors ${autoPlay ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`}
                >
                  <motion.span
                    className="absolute top-[3px] left-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm"
                    animate={{ x: autoPlay ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </SettingsRow>
              <SettingsRow icon={Bell} label="Notifications">
                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  className={`relative h-[30px] w-[50px] rounded-full transition-colors ${notifications ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`}
                >
                  <motion.span
                    className="absolute top-[3px] left-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm"
                    animate={{ x: notifications ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </SettingsRow>
            </section>

            {/* Data */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-5 divide-y divide-gray-200 dark:divide-white/[0.06]">
              <SettingsRow icon={Trash2} label="Clear local data" destructive>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20"
                >
                  Clear
                </button>
              </SettingsRow>
            </section>

            <p className="text-center text-[12px] text-gray-400 dark:text-white/30">Lingua PH v1.0.0</p>
          </motion.div>
        )}

        {/* ===== PRIVACY TAB ===== */}
        {activeTab === 'privacy' && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Info card */}
            <section className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-brand shrink-0 mt-0.5" strokeWidth={1.8} />
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Your data stays on your device</h3>
                  <p className="text-[13px] leading-relaxed text-gray-600 dark:text-white/60">
                    Lingua PH stores all vocabulary, recordings, and progress locally using IndexedDB. Nothing is sent to external servers unless you explicitly share it.
                  </p>
                </div>
              </div>
            </section>

            {/* Data sharing */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-4">Data sharing preference</h3>
              <div className="space-y-2">
                {([
                  { value: 'device' as const, label: 'On-device only', desc: 'Data never leaves your device.' },
                  { value: 'community' as const, label: 'Community', desc: 'Share contributions with other learners.' },
                  { value: 'research' as const, label: 'Research with attribution', desc: 'Allow academic use with credit.' },
                ] as const).map((opt) => {
                  const on = dataSharing === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDataSharing(opt.value)}
                      className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-all ${
                        on
                          ? 'bg-brand/10 border border-brand/30'
                          : 'bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1]'
                      }`}
                    >
                      <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        on ? 'border-brand' : 'border-gray-300 dark:border-white/30'
                      }`}>
                        {on && <div className="h-2.5 w-2.5 rounded-full bg-brand" />}
                      </div>
                      <div>
                        <p className={`text-[14px] font-medium ${on ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>{opt.label}</p>
                        <p className="text-[12px] text-gray-500 dark:text-white/40 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Links */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-5 divide-y divide-gray-200 dark:divide-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="flex w-full items-center justify-between py-3.5 text-[15px] text-gray-900 dark:text-white text-left"
              >
                Terms of Service
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white/30" />
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="flex w-full items-center justify-between py-3.5 text-[15px] text-gray-900 dark:text-white text-left"
              >
                Privacy Policy
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white/30" />
              </button>
            </section>

            {/* Delete account */}
            <section className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" strokeWidth={1.8} />
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-red-600 dark:text-red-400 mb-1">Delete account</h3>
                  <p className="text-[13px] leading-relaxed text-gray-600 dark:text-white/50 mb-3">
                    This will permanently remove all your data, contributions, and progress from this device.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-xl bg-red-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Delete my account
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ===== ABOUT TAB ===== */}
        {activeTab === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* App info */}
            <section className="flex flex-col items-center text-center py-6">
              <img src="/logo.png" alt="Lingua PH" className="w-16 h-16 rounded-[18px] mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lingua PH</h2>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">Version 1.0.0</p>
              <p className="text-[13px] text-gray-500 dark:text-white/40 mt-3 max-w-[280px] leading-relaxed">
                Preserve and learn Philippine indigenous languages through community-powered documentation.
              </p>
            </section>

            {/* Built for */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5">
              <p className="text-[13px] leading-relaxed text-gray-600 dark:text-white/60">
                Built for indigenous communities across the Philippines. Lingua PH is a PWA that works offline, stores data locally, and uses AI to help preserve endangered languages for future generations.
              </p>
            </section>

            {/* Partners */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Partners</h3>
              <ul className="space-y-4">
                {partnerOrgs.map((org) => (
                  <li key={org.name} className="border-b border-gray-200 dark:border-white/[0.06] pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{org.fullName}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/45">{org.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Links */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-5 divide-y divide-gray-200 dark:divide-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="flex w-full items-center justify-between py-3.5 text-[15px] text-gray-900 dark:text-white text-left"
              >
                Contact us
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white/30" />
              </button>
              <button
                type="button"
                onClick={() => setShowBugModal(true)}
                className="flex w-full items-center justify-between py-3.5 text-[15px] text-gray-900 dark:text-white text-left"
              >
                Report a bug
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white/30" />
              </button>
              <button
                type="button"
                onClick={() => setShowLicensesModal(true)}
                className="flex w-full items-center justify-between py-3.5 text-[15px] text-gray-900 dark:text-white text-left"
              >
                Open source licenses
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white/30" />
              </button>
            </section>

            <p className="text-center text-[12px] text-gray-400 dark:text-white/30 pb-4">
              Made with care in the Philippines
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODALS ===== */}

      {/* Edit profile modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit profile</h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-white/40">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mb-5 w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-black py-3.5 px-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Display name"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] py-3.5 text-sm font-medium text-gray-600 dark:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!editName.trim()}
                  className="flex-1 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add language modal */}
      <AnimatePresence>
        {showAddLanguage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowAddLanguage(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="max-h-[min(70vh,520px)] w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add language</h2>
                <button
                  type="button"
                  onClick={() => setShowAddLanguage(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[min(50vh,360px)] overflow-y-auto px-4 py-3">
                {availableToAdd.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500 dark:text-white/40">All languages are already added.</p>
                ) : (
                  <ul className="space-y-1">
                    {availableToAdd.map((lang) => (
                      <li key={lang.id}>
                        <button
                          type="button"
                          onClick={async () => {
                            const updatedProfile: UserProfile = {
                              ...profile,
                              languagesContributing: [...profile.languagesContributing, lang.id],
                            }
                            await saveProfile(updatedProfile)
                            setProfile(updatedProfile)
                            setShowAddLanguage(false)
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-transparent bg-gray-50 dark:bg-white/[0.04] px-4 py-3.5 text-left text-sm text-gray-900 dark:text-white transition-colors hover:border-gray-200 dark:hover:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                        >
                          <span>{lang.name}</span>
                          <Plus className="h-4 w-4 shrink-0 text-brand" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-gray-200 dark:border-white/[0.06] p-4">
                <button
                  type="button"
                  onClick={() => setShowAddLanguage(false)}
                  className="w-full rounded-xl bg-gray-100 dark:bg-white/[0.06] py-3.5 text-sm font-medium text-gray-600 dark:text-white/70"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear data confirmation */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Clear all data?</h2>
              <p className="text-sm text-gray-500 dark:text-white/50 mb-5">
                This will remove all saved languages, words, stories, chat history, and profile data from this device. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] py-3 text-sm font-medium text-gray-600 dark:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleClearData()}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
                >
                  Clear data
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Delete account?</h2>
              <p className="text-sm text-gray-500 dark:text-white/50 mb-5">
                This will permanently delete your profile, all contributions, and progress. This cannot be reversed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] py-3 text-sm font-medium text-gray-600 dark:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleClearData()}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terms of Service</h2>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-600 dark:text-white/70 space-y-4">
                <p className="font-semibold text-gray-900 dark:text-white">Last Updated: March 2026</p>
                <p>Welcome to Lingua PH. By using our application, you agree to be bound by these Terms of Service.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">1. Acceptance of Terms</h3>
                <p>By accessing or using Lingua PH, you agree to comply with and be bound by these Terms. If you do not agree, please do not use the application.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">2. Use of Service</h3>
                <p>Lingua PH is designed to help preserve Philippine indigenous languages through community-driven documentation. You agree to use the service only for lawful purposes and in accordance with these Terms.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">3. User Contributions</h3>
                <p>When you contribute content (words, translations, recordings, stories), you grant Lingua PH a non-exclusive, royalty-free license to use, display, and distribute your contributions for language preservation purposes.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">4. Community Guidelines</h3>
                <p>Users must respect indigenous communities and their cultural heritage. Contributions must be accurate to the best of your knowledge. Offensive, discriminatory, or harmful content is prohibited.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">5. Intellectual Property</h3>
                <p>Indigenous language content belongs to the respective communities. Lingua PH facilitates preservation but does not claim ownership of community-contributed linguistic data.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">6. Disclaimer</h3>
                <p>Lingua PH is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of AI-generated translations or suggestions.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">7. Changes to Terms</h3>
                <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance of the new Terms.</p>
              </div>
              <div className="border-t border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Policy</h2>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-600 dark:text-white/70 space-y-4">
                <p className="font-semibold text-gray-900 dark:text-white">Last Updated: March 2026</p>
                <p>Lingua PH is committed to protecting your privacy. This policy explains how we handle your information.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">1. Data Storage</h3>
                <p>Lingua PH is designed as a privacy-first application. All your data (profile, contributions, learning progress) is stored locally on your device using IndexedDB. We do not require account creation or collect personal data on remote servers.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">2. Data You Provide</h3>
                <p>When you contribute words, translations, or recordings, this data is stored on your device. If you choose to share with the community, your display name may be associated with contributions.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">3. AI Processing</h3>
                <p>When using chat features, messages may be processed by AI models to provide responses. This processing is done in real-time and we do not store conversation history on external servers.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">4. Data Sharing Options</h3>
                <p>You control how your data is shared through the Privacy settings. Options include: device-only storage, community sharing, or research with attribution. You can change these settings at any time.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">5. Data Deletion</h3>
                <p>You can delete all your data at any time through the Profile settings. This action is irreversible and removes all locally stored information.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">6. Third-Party Services</h3>
                <p>Lingua PH may use third-party APIs for AI language processing. We do not share personally identifiable information with these services.</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">7. Contact</h3>
                <p>For privacy-related inquiries, please contact us through the app&apos;s Contact Us feature.</p>
              </div>
              <div className="border-t border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Us Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Us</h2>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray-600 dark:text-white/70">
                <p>We would love to hear from you! Reach out to us through any of these channels:</p>
                <div className="rounded-xl bg-gray-50 dark:bg-black/30 p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                    <p className="text-brand">support@linguaph.app</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Community Forum</p>
                    <p>Join discussions with other language preservers</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Social Media</p>
                    <p>Follow us for updates and community stories</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-white/40">We typically respond within 24-48 hours during business days.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report a Bug Modal */}
      <AnimatePresence>
        {showBugModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowBugModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report a Bug</h2>
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray-600 dark:text-white/70">
                <p>Found something that is not working right? Help us improve Lingua PH by reporting bugs.</p>
                <div className="rounded-xl bg-gray-50 dark:bg-black/30 p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">What to Include</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>Description of the issue</li>
                      <li>Steps to reproduce the bug</li>
                      <li>Device and browser information</li>
                      <li>Screenshots if possible</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Report via Email</p>
                    <p className="text-brand">bugs@linguaph.app</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-white/40">Thank you for helping us make Lingua PH better for everyone!</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBugModal(false)}
                className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open Source Licenses Modal */}
      <AnimatePresence>
        {showLicensesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/70 px-4 pb-24 pt-4 backdrop-blur-sm sm:items-center sm:pb-4"
            onClick={() => setShowLicensesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Open Source Licenses</h2>
                <button
                  type="button"
                  onClick={() => setShowLicensesModal(false)}
                  className="rounded-full p-2 text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-600 dark:text-white/70 space-y-4">
                <p>Lingua PH is built with the following open source libraries:</p>
                {[
                  { name: 'Next.js', license: 'MIT License', desc: 'React framework for production' },
                  { name: 'React', license: 'MIT License', desc: 'JavaScript library for building user interfaces' },
                  { name: 'Tailwind CSS', license: 'MIT License', desc: 'Utility-first CSS framework' },
                  { name: 'Framer Motion', license: 'MIT License', desc: 'Animation library for React' },
                  { name: 'LocalForage', license: 'Apache-2.0 License', desc: 'Offline storage library' },
                  { name: 'Lucide React', license: 'ISC License', desc: 'Icon library' },
                  { name: 'next-pwa', license: 'MIT License', desc: 'PWA plugin for Next.js' },
                ].map((lib) => (
                  <div key={lib.name} className="rounded-xl bg-gray-50 dark:bg-black/30 p-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{lib.name}</p>
                    <p className="text-xs text-brand">{lib.license}</p>
                    <p className="text-xs mt-1">{lib.desc}</p>
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-white/40 pt-2">
                  We are grateful to the open source community for making these tools available.
                </p>
              </div>
              <div className="border-t border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLicensesModal(false)}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
