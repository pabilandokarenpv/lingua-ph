'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Users,
  Plus,
  Volume2,
  MessageCircle,
  ScrollText,
  AlertTriangle,
  Clipboard,
  Send,
  PenLine,
  X,
} from 'lucide-react'
import { WordCard } from '@/components/WordCard'
import { StoryCard } from '@/components/StoryCard'
import { PronunciationPractice } from '@/components/PronunciationPractice'
import { AIProgressCard } from '@/components/AIProgressCard'
import { SwadeshMode } from '@/components/SwadeshMode'
import {
  getLanguage,
  getAllLanguages,
  getWordsByLanguage,
  getStoriesByLanguage,
  getCommunityPosts,
  saveCommunityPost,
  confirmWord,
  flagWord,
} from '@/lib/db'
import { speakWord } from '@/lib/speechUtils'
import type { Language, WordEntry, Story, CommunityPost } from '@/types'

const TABS = [
  { id: 'words' as const, label: 'Words', icon: BookOpen },
  { id: 'stories' as const, label: 'Stories', icon: ScrollText },
  { id: 'community' as const, label: 'Community', icon: Users },
]

const CATEGORIES = [
  'All',
  'Greetings',
  'Family',
  'Food',
  'Nature',
  'Numbers',
  'Body',
  'Emotions',
  'Culture',
]

type TabId = (typeof TABS)[number]['id']

function statusBadgeClasses(status: Language['status']) {
  switch (status) {
    case 'critical':
      return 'border-red-500/25 bg-red-500/10 text-red-500'
    case 'growing':
      return 'border-yellow-500/25 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
    case 'active':
      return 'border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-500'
    default:
      return 'border-gray-200 dark:border-white/[0.06] bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50'
  }
}

function statusDotClass(status: Language['status']) {
  switch (status) {
    case 'critical':
      return 'bg-red-500'
    case 'growing':
      return 'bg-yellow-500'
    case 'active':
      return 'bg-green-500'
    default:
      return 'bg-gray-400 dark:bg-white/40'
  }
}

export default function DictionaryLangPage() {
  const params = useParams()
  const router = useRouter()
  const langId = typeof params.lang === 'string' ? params.lang : ''

  const [allLanguages, setAllLanguages] = useState<Language[]>([])
  const [language, setLanguage] = useState<Language | null>(null)
  const [words, setWords] = useState<WordEntry[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('words')
  const [activeCategory, setActiveCategory] = useState('All')
  const [practiceWord, setPracticeWord] = useState<WordEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSwadeshMode, setShowSwadeshMode] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostTranslation, setNewPostTranslation] = useState('')
  const [isPostingCommunity, setIsPostingCommunity] = useState(false)

  const loadData = useCallback(async () => {
    if (!langId) {
      setLanguage(null)
      setWords([])
      setStories([])
      setPosts([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const [allLangs, lang, langWords, langStories, langPosts] = await Promise.all([
        getAllLanguages(),
        getLanguage(langId),
        getWordsByLanguage(langId),
        getStoriesByLanguage(langId),
        getCommunityPosts(langId),
      ])
      setAllLanguages(allLangs)
      setLanguage(lang)
      setWords(langWords)
      setStories(langStories)
      setPosts(langPosts)
    } finally {
      setIsLoading(false)
    }
  }, [langId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLanguageChange = (newLangId: string) => {
    router.push(`/dictionary/${newLangId}`)
  }

  const handleConfirm = async (wordId: string) => {
    await confirmWord(wordId)
    setWords(await getWordsByLanguage(langId))
  }

  const handleFlag = async (wordId: string) => {
    await flagWord(wordId)
    setWords(await getWordsByLanguage(langId))
  }

  const handleCommunityPost = async () => {
    if (!newPostContent.trim() || !language) return
    setIsPostingCommunity(true)
    try {
      const newPost: CommunityPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        languageId: language.id,
        authorName: 'You',
        content: newPostContent.trim(),
        contentTranslation: newPostTranslation.trim() || '',
        type: 'text',
        likes: 0,
        publishedAt: new Date().toISOString(),
      }
      await saveCommunityPost(newPost)
      setPosts(await getCommunityPosts(langId))
      setNewPostContent('')
      setNewPostTranslation('')
    } finally {
      setIsPostingCommunity(false)
    }
  }

  const filteredWords =
    activeCategory === 'All' ? words : words.filter((w) => w.category === activeCategory)

  const handleSpeakLanguageName = () => {
    if (language?.name) speakWord(language.name, 'tl-PH')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-400 dark:text-white/50 tracking-wide">Lingua PH</p>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-brand border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (!language) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-6 py-8"
        >
          <p className="text-lg text-gray-900 dark:text-white font-semibold mb-1">Language not found</p>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
            This dictionary entry is missing or the link may be wrong.
          </p>
          <p className="text-xs text-gray-400 dark:text-white/30 mb-6">Lingua PH</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full rounded-xl bg-brand py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Back to home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-black/65 backdrop-blur-2xl backdrop-saturate-150">
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-600 dark:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="relative">
                <select
                  value={langId}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] py-2 pl-3 pr-8 text-[15px] font-semibold text-gray-900 dark:text-white outline-none transition-colors focus:border-brand/60"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(156,163,175,1)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                  }}
                  aria-label="Select language"
                >
                  {allLanguages.map((lang) => (
                    <option key={lang.id} value={lang.id} className="bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white text-sm">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {language.region}
                  <span className="text-gray-300 dark:text-white/30"> · </span>
                  {language.province}
                </p>
                <button
                  type="button"
                  onClick={handleSpeakLanguageName}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-brand transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                  aria-label={`Hear ${language.name}`}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadgeClasses(
                language.status
              )}`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(language.status)}`}
              />
              {language.status.charAt(0).toUpperCase() + language.status.slice(1)}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/50">
              <span><span className="font-semibold text-gray-900 dark:text-white">{language.wordCount}</span> words</span>
              <span><span className="font-semibold text-gray-900 dark:text-white">{language.contributors}</span> contributors</span>
            </div>
          </div>
        </div>

        <nav className="flex gap-1.5 px-5 pb-3" role="tablist" aria-label="Dictionary sections">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  selected
                    ? 'bg-brand text-white shadow-md'
                    : 'border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/[0.1] hover:text-gray-700 dark:hover:text-white/80'
                }`}
              >
                <Icon className="h-4 w-4 opacity-90" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="px-5 pt-5">
        {/* AI Progress Card */}
        <AIProgressCard wordCount={language.wordCount} />

        {/* Emergency Last Voice Mode prompt */}
        {(language.status === 'critical' || (language.speakerCount && language.speakerCount < 1000)) && (
          <Link
            href={`/last-voice?lang=${language.id}`}
            className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-600 dark:text-red-400 text-sm">Start Last Voice Session</p>
              <p className="text-xs text-gray-500 dark:text-white/50">Emergency documentation for endangered languages</p>
            </div>
          </Link>
        )}

        {/* Swadesh Mode prompt for undocumented languages */}
        {language.wordCount < 30 && (
          <button
            onClick={() => setShowSwadeshMode(true)}
            className="mb-4 w-full flex items-center gap-3 p-4 rounded-2xl bg-brand/10 border border-brand/20 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
              <Clipboard className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand text-sm">Begin Swadesh Documentation</p>
              <p className="text-xs text-gray-500 dark:text-white/50">
                Start with the 207 essential words that every language has. AI will guide you.
              </p>
            </div>
          </button>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'words' && (
            <motion.section
              key="words"
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map((cat) => {
                  const on = activeCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                        on
                          ? 'border-brand bg-brand text-white'
                          : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/[0.1] hover:text-gray-700 dark:hover:text-white/80'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3">
                {filteredWords.map((word, index) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    languageName={language.name}
                    index={index}
                    onPractice={() => setPracticeWord(word)}
                    onConfirm={() => handleConfirm(word.id)}
                    onFlag={() => handleFlag(word.id)}
                  />
                ))}
              </div>

              {filteredWords.length === 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] py-14 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-black/40">
                    <BookOpen className="h-8 w-8 text-gray-300 dark:text-white/30" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50">No words in this category yet</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/30">Add one from the contribute flow.</p>
                </div>
              )}
            </motion.section>
          )}

          {activeTab === 'stories' && (
            <motion.section
              key="stories"
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {stories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} />
              ))}
              {stories.length === 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] py-14 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-black/40">
                    <BookOpen className="h-8 w-8 text-gray-300 dark:text-white/30" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50">No stories yet</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/30">Stories from this community will show up here.</p>
                </div>
              )}
            </motion.section>
          )}

          {activeTab === 'community' && (
            <motion.section
              key="community"
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-3 relative"
            >
              {/* Posts list */}
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] py-14 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-black/40">
                    <MessageCircle className="h-8 w-8 text-gray-300 dark:text-white/30" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50">No posts yet</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/30">Be the first to share with the community!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#5AC8FA] text-sm font-bold text-white">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{post.authorName}</p>
                          <p className="text-xs text-gray-400 dark:text-white/30">
                            {new Date(post.publishedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-white/80">{post.content}</p>
                      {post.contentTranslation ? (
                        <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-white/50">{post.contentTranslation}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}

              {/* Floating write button */}
              {posts.length > 0 && (
                <button
                  onClick={() => setShowPostModal(true)}
                  className="fixed bottom-28 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                  aria-label="Write a post"
                >
                  <PenLine className="h-6 w-6" />
                </button>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <PronunciationPractice
        word={practiceWord?.word ?? ''}
        phonetic={practiceWord?.phonetic ?? ''}
        translation={practiceWord?.translation ?? ''}
        isOpen={!!practiceWord}
        onClose={() => setPracticeWord(null)}
      />

      {showSwadeshMode && (
        <SwadeshMode
          languageId={language.id}
          languageName={language.name}
          onClose={() => setShowSwadeshMode(false)}
        />
      )}

      {/* Community Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostModal(false)}
              className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 bottom-24 z-50 max-w-lg mx-auto rounded-2xl bg-white dark:bg-[#1c1c1e] p-5 shadow-2xl border border-gray-200 dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Share with {language.name}
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-white/60" />
                </button>
              </div>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={`Write something in ${language.name}...`}
                rows={4}
                autoFocus
                className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-black px-4 py-3 text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              />
              <input
                type="text"
                value={newPostTranslation}
                onChange={(e) => setNewPostTranslation(e.target.value)}
                placeholder="Translation (optional)"
                className="mt-3 w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-black px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <button
                onClick={async () => {
                  await handleCommunityPost()
                  setShowPostModal(false)
                }}
                disabled={!newPostContent.trim() || isPostingCommunity}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-40 transition-opacity"
              >
                {isPostingCommunity ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Post
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
