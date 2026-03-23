'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Volume2,
  RotateCcw,
  Check,
  MessageCircle,
  BookOpen,
  Zap,
  RefreshCw,
  Newspaper,
  ExternalLink,
} from 'lucide-react'
import {
  getAllLanguages,
  getWordsByLanguage,
  getChatHistory,
  saveChatMessage,
  getProfile,
  saveProfile,
} from '@/lib/db'
import { chatWithOllama } from '@/lib/ollama'
import { speakWord } from '@/lib/speechUtils'
import { ChatBubble } from '@/components/ChatBubble'
import type { Language, WordEntry, ChatMessage, UserProfile } from '@/types'

const quickPrompts = [
  { id: 'greetings', label: 'Greetings' },
  { id: 'food', label: 'Food words' },
  { id: 'howtosay', label: 'How to say...' },
  { id: 'word', label: 'Teach me' },
] as const

export default function LearnPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [words, setWords] = useState<WordEntry[]>([])
  const [queue, setQueue] = useState<WordEntry[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'flashcards' | 'news'>('chat')
  const [isOffline, setIsOffline] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [isFlipped, setIsFlipped] = useState(false)
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userSentMessageRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (messages.length > 1) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages.length])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [langs, userProfile] = await Promise.all([getAllLanguages(), getProfile()])
      if (cancelled) return
      setLanguages(langs)

      const best =
        langs.length > 0
          ? langs.reduce((max, lang) => (lang.wordCount > max.wordCount ? lang : max), langs[0])
          : null
      if (best) setSelectedLanguage(best.id)

      setProfile(userProfile)
      if (!userProfile) {
        const defaultProfile: UserProfile = {
          displayName: 'Guest User',
          phoneNumber: '',
          languagesContributing: [],
          languagesLearning: langs.length > 0 ? [langs[0].id] : [],
          wordsRecorded: 0,
          wordsConfirmed: 0,
          storiesShared: 0,
          totalPlays: 0,
          learningProgress: {},
          streak: 1,
          lastActiveDate: new Date().toISOString(),
        }
        await saveProfile(defaultProfile)
        if (!cancelled) setProfile(defaultProfile)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedLanguage) return
    let cancelled = false
    ;(async () => {
      const [langWords, chatHistory] = await Promise.all([
        getWordsByLanguage(selectedLanguage),
        getChatHistory(selectedLanguage),
      ])
      if (cancelled) return
      setWords(langWords)
      setQueue([...langWords])
      setLearnedWords(new Set())
      setIsFlipped(false)

      const langName =
        languages.find((l) => l.id === selectedLanguage)?.name ?? 'this language'
      setMessages(
        chatHistory.length > 0
          ? chatHistory
          : [
              {
                id: 'welcome',
                role: 'assistant',
                content: `Hi! I'm your Lingua PH companion for ${langName}. Ask me anything about words and phrases.`,
                timestamp: new Date().toISOString(),
              },
            ]
      )
    })()
    return () => {
      cancelled = true
    }
  }, [selectedLanguage, languages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const selectedLangMeta = languages.find((l) => l.id === selectedLanguage)
  const currentCard = queue[0]
  const totalWords = words.length
  const progressRatio = totalWords > 0 ? learnedWords.size / totalWords : 0

  const buildVocabPayload = () =>
    words.map((w) => ({
      word: w.word,
      translation: w.translation,
      language: selectedLangMeta?.name ?? '',
      partOfSpeech: w.partOfSpeech,
      category: w.category,
    }))

  const handleSendMessage = async (textOverride?: string) => {
    const raw = (textOverride ?? input).trim()
    if (!raw || !selectedLanguage) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      content: raw,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsOffline(false)
    userSentMessageRef.current = true

    try {
      await saveChatMessage(selectedLanguage, userMessage)
    } catch {
      setIsOffline(true)
      setIsLoading(false)
      const errMsg: ChatMessage = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        content:
          "Couldn't save your message locally. Check storage permissions and try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
      return
    }

    const historyForModel = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const response = await chatWithOllama(historyForModel, buildVocabPayload())
      const assistantMessage: ChatMessage = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      await saveChatMessage(selectedLanguage, assistantMessage)

      const offlineHint =
        response.includes('offline mode') ||
        response.includes("I'm currently in offline mode") ||
        response.includes('limited vocabulary')
      setIsOffline(offlineHint)
    } catch {
      setIsOffline(true)
      const fallbackMessage: ChatMessage = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        content:
          "I'm in offline mode. Browse the dictionary for documented words, or try again when the assistant is available.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, fallbackMessage])
      await saveChatMessage(selectedLanguage, fallbackMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (promptId: (typeof quickPrompts)[number]['id']) => {
    const map: Record<string, string> = {
      greetings: 'Teach me greetings in this language',
      food: 'What are common food words?',
      howtosay: 'How do I say hello and thank you?',
      word: 'Teach me an interesting word from the vocabulary',
    }
    const t = map[promptId]
    if (t) void handleSendMessage(t)
  }

  const handleGotIt = async () => {
    if (!currentCard || !selectedLanguage) return

    const newLearned = new Set(learnedWords)
    newLearned.add(currentCard.id)
    setLearnedWords(newLearned)

    if (profile) {
      const currentProgress = profile.learningProgress[selectedLanguage] ?? 0
      const updatedProfile: UserProfile = {
        ...profile,
        learningProgress: {
          ...profile.learningProgress,
          [selectedLanguage]: currentProgress + 1,
        },
      }
      await saveProfile(updatedProfile)
      setProfile(updatedProfile)
    }

    setQueue((q) => q.slice(1))
    setIsFlipped(false)
  }

  const handleReviewAgain = () => {
    if (queue.length <= 1) {
      setIsFlipped(false)
      return
    }
    setQueue((q) => {
      const [first, ...rest] = q
      return [...rest, first]
    })
    setIsFlipped(false)
  }

  const handleStartOverFlashcards = () => {
    setQueue([...words])
    setLearnedWords(new Set())
    setIsFlipped(false)
  }

  const handlePlayWord = () => {
    if (!currentCard) return
    speakWord(currentCard.word, 'tl-PH')
  }

  return (
    <div className="min-h-[100dvh] font-sans flex flex-col px-5 pt-6 pb-28">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="shrink-0 space-y-4 mb-4"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Lingua PH" className="w-10 h-10 rounded-xl" />
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 dark:text-white">Learn</h1>
        </div>

        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] py-3.5 pl-4 pr-11 text-[15px] text-gray-900 dark:text-white shadow-none outline-none transition-colors focus:border-brand/60"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(156,163,175,1)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
            aria-label="Learning language"
          >
            {languages.length === 0 ? (
              <option value="">Loading languages...</option>
            ) : (
              languages.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white">
                  {lang.name} ({lang.wordCount} words)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex rounded-2xl bg-gray-100 dark:bg-[#1c1c1e] p-1 border border-gray-200 dark:border-white/[0.06]">
          {(
            [
              { id: 'chat' as const, label: 'Chat', Icon: MessageCircle },
              { id: 'flashcards' as const, label: 'Cards', Icon: BookOpen },
              { id: 'news' as const, label: 'News', Icon: Newspaper },
            ] as const
          ).map(({ id, label, Icon }) => {
            const on = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-medium transition-colors ${
                  on ? 'text-white' : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="learn-tab-pill"
                    className="absolute inset-0 rounded-xl bg-brand shadow-lg shadow-brand/20"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.header>

      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden rounded-2xl border border-orange-300 dark:border-[#ff9f0a]/25 bg-orange-50 dark:bg-[#ff9f0a]/10"
          >
            <p className="flex items-center justify-center gap-2 px-3 py-2.5 text-center text-[13px] text-orange-600 dark:text-[#ff9f0a]">
              <Zap className="h-4 w-4 shrink-0" strokeWidth={2} />
              Offline or fallback replies — using saved vocabulary when possible.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.section
              key="chat"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <div className="space-y-3 overflow-y-auto pb-4 max-h-[calc(100vh-340px)] [-webkit-overflow-scrolling:touch]">
                {messages.map((msg, index) => (
                  <ChatBubble key={msg.id} role={msg.role} content={msg.content} index={index} />
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-bl-md border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {[0, 0.12, 0.24].map((delay, i) => (
                          <motion.span
                            key={i}
                            className="h-2 w-2 rounded-full bg-gray-300 dark:bg-white/35"
                            animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                            transition={{
                              duration: 0.55,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-px shrink-0" />

                {messages.length < 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-wrap gap-2 pt-2"
                  >
                    {quickPrompts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickPrompt(p.id)}
                        disabled={isLoading || !selectedLanguage}
                        className="rounded-full border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2 text-[12px] font-medium text-gray-500 dark:text-white/55 transition-colors hover:border-gray-300 dark:hover:border-white/[0.12] hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-gray-700 dark:hover:text-white/80 disabled:opacity-40"
                      >
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="fixed bottom-[85px] left-0 right-0 px-5 pb-3 bg-white dark:bg-[#0d0d0f] border-t border-gray-200 dark:border-white/[0.06] pt-3 z-40">
                <div className="flex gap-2 max-w-lg mx-auto">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void handleSendMessage()
                      }
                    }}
                    placeholder="Ask about a word or phrase..."
                    disabled={!selectedLanguage || isLoading}
                    className="min-w-0 flex-1 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] px-4 py-3.5 text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none transition-colors focus:border-brand/55 disabled:opacity-50"
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => void handleSendMessage()}
                    disabled={!input.trim() || !selectedLanguage || isLoading}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20 transition-opacity disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'flashcards' && (
            <motion.section
              key="flashcards"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {totalWords === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                  <p className="text-[15px] text-gray-500 dark:text-white/40">No words for this language yet.</p>
                  <p className="mt-2 text-[13px] text-gray-400 dark:text-white/25">Add entries in the dictionary to study them here.</p>
                </div>
              ) : queue.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-1 flex-col items-center justify-center px-4 text-center"
                >
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 dark:bg-[#30d158]/20 ring-1 ring-green-300 dark:ring-[#30d158]/35">
                    <Check className="h-10 w-10 text-green-600 dark:text-[#30d158]" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Deck complete</h2>
                  <p className="mt-1 max-w-[280px] text-[14px] leading-relaxed text-gray-500 dark:text-white/40">
                    You worked through this round ({totalWords} words). Progress is saved in your profile.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartOverFlashcards}
                    className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand/20"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={2} />
                    Start over
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-5 shrink-0">
                    <div className="mb-2 flex items-center justify-between text-[13px]">
                      <span className="text-gray-500 dark:text-white/40">Progress</span>
                      <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                        {learnedWords.size} / {totalWords}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.08]">
                      <motion.div
                        className="h-full rounded-full bg-brand"
                        initial={false}
                        animate={{ width: `${Math.min(100, progressRatio * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                    <motion.div
                      className="relative w-full max-w-[340px] cursor-pointer [perspective:1200px]"
                      onClick={() => setIsFlipped((f) => !f)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setIsFlipped((f) => !f)
                        }
                      }}
                      aria-label="Flip flashcard"
                    >
                      <motion.div
                        className="relative aspect-[4/5] w-full [transform-style:preserve-3d]"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-6 text-center [backface-visibility:hidden]"
                          style={{ WebkitBackfaceVisibility: 'hidden' }}
                        >
                          <span className="mb-3 text-[12px] font-medium uppercase tracking-wider text-gray-400 dark:text-white/35">
                            {selectedLangMeta?.name ?? 'Language'}
                          </span>
                          <h2 className="font-sans text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                            {currentCard?.word}
                          </h2>
                          {currentCard?.phonetic ? (
                            <p className="mt-2 text-lg text-gray-400 dark:text-white/35">{currentCard.phonetic}</p>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayWord()
                            }}
                            className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/25 transition-colors hover:bg-brand/20"
                            aria-label="Play pronunciation"
                          >
                            <Volume2 className="h-6 w-6" strokeWidth={2} />
                          </button>
                          <p className="mt-10 text-[12px] text-gray-400 dark:text-white/25">Tap to flip</p>
                        </div>

                        <div
                          className="absolute inset-0 flex flex-col rounded-3xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                          style={{ WebkitBackfaceVisibility: 'hidden' }}
                        >
                          <div className="min-h-0 flex-1 overflow-y-auto space-y-4">
                            <div>
                              <h3 className="font-sans text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                {currentCard?.translation}
                              </h3>
                              {currentCard?.translationFilipino ? (
                                <p className="mt-1 text-[14px] text-gray-500 dark:text-white/45">{currentCard.translationFilipino}</p>
                              ) : null}
                            </div>

                            {currentCard?.exampleSentence ? (
                              <div className="rounded-xl bg-white dark:bg-white/[0.03] p-3 border border-gray-100 dark:border-white/[0.04]">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1.5">Usage</p>
                                <p className="text-[14px] leading-relaxed text-gray-700 dark:text-white/85 italic">
                                  &ldquo;{currentCard.exampleSentence}&rdquo;
                                </p>
                                {currentCard.exampleTranslation ? (
                                  <p className="mt-1.5 text-[12px] text-gray-500 dark:text-white/40">{currentCard.exampleTranslation}</p>
                                ) : null}
                              </div>
                            ) : null}

                            {currentCard?.culturalNote ? (
                              <div className="rounded-xl bg-brand/5 dark:bg-brand/10 p-3 border border-brand/10 dark:border-brand/20">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand/70 dark:text-brand/80 mb-1.5">Cultural Context</p>
                                <p className="text-[13px] leading-relaxed text-gray-700 dark:text-white/80">
                                  {currentCard.culturalNote}
                                </p>
                              </div>
                            ) : null}

                            <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-white/30 pt-2">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05]">{currentCard?.partOfSpeech}</span>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05]">{currentCard?.category}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-white/25">Tap to flip</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  <div className="mt-5 flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsFlipped((f) => !f)}
                      className="w-full rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] py-3.5 text-[15px] font-semibold text-gray-600 dark:text-white/70 transition-colors hover:border-gray-300 dark:hover:border-white/[0.12] hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-gray-900 dark:hover:text-white"
                    >
                      Flip
                    </button>
                    <button
                      type="button"
                      onClick={handleReviewAgain}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1c1c1e] py-3.5 text-[15px] font-semibold text-gray-700 dark:text-white/80 transition-colors hover:border-gray-300 dark:hover:border-white/[0.14] hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    >
                      <RefreshCw className="h-4 w-4" strokeWidth={2} />
                      Review again
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGotIt()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 dark:bg-[#30d158] py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-95"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} />
                      Got it
                    </button>
                  </div>
                </>
              )}
            </motion.section>
          )}

          {activeTab === 'news' && (
            <motion.section
              key="news"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 overflow-y-auto pb-4"
            >
              <div className="mb-4">
                <p className="text-[13px] text-gray-500 dark:text-white/50">
                  Curated news and articles about Philippine indigenous languages and cultural preservation.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: 'DOST launches MinNa LProc NLP Laboratory for Mindanao languages',
                    source: 'Philippine News Agency',
                    date: 'Feb 2025',
                    url: 'https://www.pna.gov.ph/articles/1237812',
                    description: 'The Department of Science and Technology launches a Natural Language Processing laboratory to develop AI tools for six Mindanao indigenous languages.',
                  },
                  {
                    title: 'Map of Endangered Languages in the Philippines',
                    source: 'UP Diliman Linguistics',
                    date: '2024',
                    url: 'https://linguistics.upd.edu.ph/the-katig-collective/map-of-endangered-languages-in-the-philippines/',
                    description: 'The Katig Collective at UP Diliman documents endangered languages including Arta, Ratagnon, and other critically endangered Philippine languages.',
                  },
                  {
                    title: 'First Ayta Magbukun Language Camp held in Bataan',
                    source: 'Endangered Languages Project',
                    date: 'May 2025',
                    url: 'https://www.endangeredlanguages.com/',
                    description: 'The Endangered Languages Project organized the first language camp for Ayta Magbukun speakers in Bataan to document and revitalize the threatened language.',
                  },
                  {
                    title: 'Komisyon sa Wikang Filipino celebrates National Language Month',
                    source: 'KWF Official',
                    date: 'Aug 2024',
                    url: 'https://kwf.gov.ph/',
                    description: 'KWF promotes the preservation and development of Filipino and other Philippine languages during Buwan ng Wika.',
                  },
                  {
                    title: 'Indigenous Peoples Education Program gains momentum',
                    source: 'Philippine Star',
                    date: 'Jan 2025',
                    url: 'https://www.philstar.com/nation',
                    description: 'DepEd expands the Indigenous Peoples Education Program to include more mother tongue-based learning materials in indigenous communities.',
                  },
                  {
                    title: 'Higaonon Mobile Dictionary Project at MSU-IIT',
                    source: 'MSU-IIT Research',
                    date: '2025',
                    url: 'https://www.msuiit.edu.ph/',
                    description: 'Mindanao State University researchers develop participatory mobile dictionary for the Higaonon language with NCIP certification.',
                  },
                  {
                    title: 'Mother Tongue-Based Multilingual Education in the Philippines',
                    source: 'DepEd',
                    date: '2024',
                    url: 'https://www.deped.gov.ph/',
                    description: 'Understanding the MTB-MLE program and its impact on indigenous language education in Philippine schools.',
                  },
                  {
                    title: 'NCIP works to protect indigenous peoples\' rights and culture',
                    source: 'NCIP Official',
                    date: '2024',
                    url: 'https://ncip.gov.ph/',
                    description: 'The National Commission on Indigenous Peoples continues its mandate to protect and promote the rights of indigenous cultural communities.',
                  },
                  {
                    title: 'NightOwl AI builds 2-million word indigenous language database',
                    source: 'Manila Bulletin Tech',
                    date: '2024',
                    url: 'https://mb.com.ph/technology',
                    description: 'Filipino AI startup NightOwl AI, founded by Karay-a community member Anna Mae Yu Lamentillo, builds NLP tools for Philippine indigenous languages.',
                  },
                  {
                    title: 'Lumad schools preserve indigenous knowledge amid challenges',
                    source: 'Inquirer.net',
                    date: '2024',
                    url: 'https://newsinfo.inquirer.net/',
                    description: 'Community-led Lumad schools in Mindanao continue teaching indigenous languages and traditions despite ongoing difficulties.',
                  },
                  {
                    title: 'UNESCO Atlas of the World\'s Languages in Danger',
                    source: 'UNESCO',
                    date: '2024',
                    url: 'https://unesdoc.unesco.org/ark:/48223/pf0000187026',
                    description: 'Interactive resource documenting endangered languages worldwide, including several Philippine indigenous languages.',
                  },
                  {
                    title: 'SIL Philippines: 70 years of language documentation',
                    source: 'SIL International',
                    date: '2024',
                    url: 'https://philippines.sil.org/',
                    description: 'SIL has documented over 90 Philippine languages since 1953, creating dictionaries and linguistic resources.',
                  },
                ].map((article, i) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] p-4 transition-colors hover:border-brand/30 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug mb-1.5">
                          {article.title}
                        </h3>
                        <p className="text-[13px] text-gray-500 dark:text-white/50 line-clamp-2 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-white/30">
                          <span className="font-medium text-brand">{article.source}</span>
                          <span>•</span>
                          <span>{article.date}</span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-gray-400 dark:text-white/30 mt-0.5" />
                    </div>
                  </a>
                ))}
              </div>
              <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-white/30">
                Articles link to external sources. Lingua PH does not own this content.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
