'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MessageSquare,
  CheckCircle,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Film,
  PenLine,
  Plus,
} from 'lucide-react'
import { RecordButton } from '@/components/RecordButton'
import { getAllLanguages, saveWord, getProfile, saveProfile } from '@/lib/db'
import { startAudioRecording, startSpeechRecognition, blobToBase64 } from '@/lib/speechUtils'
import type { Language, WordEntry, UserProfile } from '@/types'

const CATEGORIES = [
  'Greetings',
  'Family',
  'Food',
  'Nature',
  'Numbers',
  'Body',
  'Emotions',
  'Culture',
  'Expressions',
  'Other',
] as const

const SELECT_CHEVRON_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(156,163,175,1)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 16px center',
}

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const chatAssistantCopy = {
  word: () =>
    'Welcome to Lingua PH. What word or phrase would you like to add to the dictionary?',
  meaning: (w: string) =>
    `What does "${w}" mean? Share a short definition or gloss (any language you use is fine).`,
  example: (w: string) =>
    `Great. Can you give an example sentence that uses "${w}"?`,
  translation: () =>
    'What does that example sentence mean? Add a translation or paraphrase.',
  language: () =>
    'Almost done. Which language is this from? Type the language name as shown in Lingua PH, or its code.',
  done: (word: string, langName: string) =>
    `All set. "${word}" is ready for the ${langName} dictionary. Review the card below and publish when you are happy.`,
  languageUnknown: (names: string) =>
    `I could not match that language. Try one of these: ${names}`,
}

function ContributePageContent() {
  const searchParams = useSearchParams()
  const preselectedLang = searchParams.get('lang')

  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'chat'>('text')
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>(preselectedLang ?? '')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState('')
  const [wordDetails, setWordDetails] = useState({
    word: '',
    translationFilipino: '',
    translationEnglish: '',
    category: 'Greetings' as string,
    customCategory: '',
    culturalNote: '',
  })
  const [showSuccess, setShowSuccess] = useState(false)

  const [textForm, setTextForm] = useState({
    word: '',
    translationFilipino: '',
    translationEnglish: '',
    category: 'Greetings',
    customCategory: '',
    culturalNote: '',
    exampleSentence: '',
    exampleTranslation: '',
  })
  const [textRecording, setTextRecording] = useState<Blob | null>(null)
  const [isRecordingPronunciation, setIsRecordingPronunciation] = useState(false)
  const [textShowSuccess, setTextShowSuccess] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playbackUrlRef = useRef<string | null>(null)

  type ChatStep = 'word' | 'meaning' | 'example' | 'translation' | 'language' | 'done'

  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([{ role: 'assistant', content: chatAssistantCopy.word() }])
  const [chatInput, setChatInput] = useState('')
  const [chatStep, setChatStep] = useState<ChatStep>('word')
  const [chatWord, setChatWord] = useState<Partial<WordEntry>>({})
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessages.length > 1) {
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [chatMessages])

  const loadData = useCallback(async () => {
    const [langs, userProfile] = await Promise.all([getAllLanguages(), getProfile()])
    setLanguages(langs)
    setProfile(userProfile)
    if (!userProfile) {
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
      setProfile(defaultProfile)
      await saveProfile(defaultProfile)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!preselectedLang) return
    setSelectedLanguage(preselectedLang)
  }, [preselectedLang])

  useEffect(() => {
    if (!isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const showSuccessToast = useCallback(() => {
    setShowSuccess(true)
    window.setTimeout(() => setShowSuccess(false), 2600)
  }, [])

  const bumpProfileAfterWord = useCallback(
    async (languageId: string) => {
      if (!profile) return
      const updated: UserProfile = {
        ...profile,
        wordsRecorded: profile.wordsRecorded + 1,
        languagesContributing: [...new Set([...profile.languagesContributing, languageId])],
      }
      await saveProfile(updated)
      setProfile(updated)
    },
    [profile]
  )

  const handleStartRecording = async () => {
    setIsRecording(true)
    setRecordingTime(0)
    setAudioBlob(null)
    setTranscription('')

    const recorder = await startAudioRecording((blob) => {
      setAudioBlob(blob)
      setIsRecording(false)
    })
    if (recorder) mediaRecorderRef.current = recorder

    const recognition = startSpeechRecognition(
      (text) => setTranscription(text),
      () => {
        recognitionRef.current = null
      }
    )
    recognitionRef.current = recognition
  }

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const handlePlayback = () => {
    if (!audioBlob) return
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current)
      playbackUrlRef.current = null
    }
    const url = URL.createObjectURL(audioBlob)
    playbackUrlRef.current = url
    const audio = new Audio(url)
    audio.play()
    audio.onended = () => {
      if (playbackUrlRef.current === url) {
        URL.revokeObjectURL(url)
        playbackUrlRef.current = null
      }
    }
  }

  const handleReRecord = () => {
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current)
      playbackUrlRef.current = null
    }
    setAudioBlob(null)
    setTranscription('')
    setRecordingTime(0)
  }

  const resetVoiceForm = () => {
    setAudioBlob(null)
    setTranscription('')
    setWordDetails({
      word: '',
      translationFilipino: '',
      translationEnglish: '',
      category: 'Greetings',
      customCategory: '',
      culturalNote: '',
    })
    setRecordingTime(0)
  }

  const handleVoicePublish = async () => {
    const resolvedWord = (wordDetails.word || transcription).trim()
    if (!selectedLanguage || !resolvedWord || !wordDetails.translationFilipino.trim() || !wordDetails.translationEnglish.trim()) return

    const entry: WordEntry = {
      id: `${selectedLanguage}-${Date.now()}`,
      languageId: selectedLanguage,
      word: resolvedWord,
      phonetic: '',
      translation: wordDetails.translationEnglish.trim(),
      translationFilipino: wordDetails.translationFilipino.trim(),
      partOfSpeech: 'other',
      category: wordDetails.category === 'Other' && wordDetails.customCategory ? wordDetails.customCategory : wordDetails.category,
      culturalNote: wordDetails.culturalNote.trim() || undefined,
      audioBlob: audioBlob ? await blobToBase64(audioBlob) : undefined,
      publishedBy: profile?.displayName ?? '@guest',
      publishedAt: new Date().toISOString(),
      confirmedCount: 0,
      flagCount: 0,
      status: 'unverified',
    }

    await saveWord(entry)
    await bumpProfileAfterWord(selectedLanguage)
    showSuccessToast()
    resetVoiceForm()
  }

  const handleChatSubmit = async () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: text }])

    window.setTimeout(() => {
      let reply = ''
      const next = { ...chatWord }

      switch (chatStep) {
        case 'word':
          next.word = text
          setChatWord(next)
          reply = chatAssistantCopy.meaning(text)
          setChatStep('meaning')
          break
        case 'meaning':
          next.translation = text
          setChatWord(next)
          reply = chatAssistantCopy.example(next.word ?? '')
          setChatStep('example')
          break
        case 'example':
          next.exampleSentence = text
          setChatWord(next)
          reply = chatAssistantCopy.translation()
          setChatStep('translation')
          break
        case 'translation':
          next.exampleTranslation = text
          setChatWord(next)
          reply = chatAssistantCopy.language()
          setChatStep('language')
          break
        case 'language': {
          const match = languages.find(
            (l) =>
              l.name.toLowerCase() === text.toLowerCase() ||
              l.id.toLowerCase() === text.toLowerCase() ||
              l.id.toLowerCase().includes(text.toLowerCase())
          )
          if (match) {
            next.languageId = match.id
            setChatWord(next)
            reply = chatAssistantCopy.done(next.word ?? '', match.name)
            setChatStep('done')
          } else {
            const names = languages.map((l) => l.name).join(', ')
            reply = chatAssistantCopy.languageUnknown(names)
          }
          break
        }
        default:
          break
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    }, 500)
  }

  const handleChatPublish = async () => {
    if (!chatWord.word?.trim() || !chatWord.translation?.trim() || !chatWord.languageId) return

    const entry: WordEntry = {
      id: `${chatWord.languageId}-${Date.now()}`,
      languageId: chatWord.languageId,
      word: chatWord.word.trim(),
      phonetic: '',
      translation: chatWord.translation.trim(),
      translationFilipino: '',
      partOfSpeech: 'other',
      category: 'Other',
      exampleSentence: chatWord.exampleSentence?.trim() || undefined,
      exampleTranslation: chatWord.exampleTranslation?.trim() || undefined,
      publishedBy: profile?.displayName ?? '@guest',
      publishedAt: new Date().toISOString(),
      confirmedCount: 0,
      flagCount: 0,
      status: 'unverified',
    }

    await saveWord(entry)
    await bumpProfileAfterWord(chatWord.languageId)
    showSuccessToast()

    setChatMessages([{ role: 'assistant', content: chatAssistantCopy.word() }])
    setChatStep('word')
    setChatWord({})
  }

  const wordFieldValue =
    wordDetails.word || (transcription ? transcription : '')

  const inputClasses = "w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-[#1c1c1e] py-3.5 px-4 text-[15px] text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-white/25 focus:border-brand focus:ring-1 focus:ring-brand"

  return (
    <div className="min-h-screen px-5 pt-6 pb-32">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="Lingua PH" className="w-10 h-10 rounded-xl" />
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 dark:text-white">Contribute</h1>
        </div>
        <p className="text-[14px] leading-relaxed text-gray-500 dark:text-white/40">
          Add a word by text, voice, chat, or extract from video.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 flex rounded-2xl bg-gray-100 dark:bg-[#1c1c1e] p-1 ring-1 ring-gray-200 dark:ring-white/[0.06]"
        role="tablist"
        aria-label="Contribution mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'text'}
          onClick={() => setActiveTab('text')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 px-1.5 text-[12px] font-medium transition-colors ${
            activeTab === 'text'
              ? 'bg-brand text-white shadow-lg shadow-brand/20'
              : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70'
          }`}
        >
          <PenLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Text
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'voice'}
          onClick={() => setActiveTab('voice')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 px-1.5 text-[12px] font-medium transition-colors ${
            activeTab === 'voice'
              ? 'bg-brand text-white shadow-lg shadow-brand/20'
              : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70'
          }`}
        >
          <Mic className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Voice
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 px-1.5 text-[12px] font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-brand text-white shadow-lg shadow-brand/20'
              : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Chat
        </button>
        <Link
          href="/extract-video"
          role="tab"
          className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 px-1.5 text-[12px] font-medium text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
        >
          <Film className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Video
        </Link>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'text' && (
          <motion.section
            key="text"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
            aria-label="Text contribution"
          >
            <div className="rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] p-4 ring-1 ring-gray-200 dark:ring-white/[0.06]">
              <label htmlFor="text-language" className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                Language
              </label>
              <select
                id="text-language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={inputClasses}
              >
                <option value="">Select language</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] p-4 ring-1 ring-gray-200 dark:ring-white/[0.06] space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  Word in indigenous language *
                </label>
                <input
                  type="text"
                  value={textForm.word}
                  onChange={(e) => setTextForm({ ...textForm, word: e.target.value })}
                  placeholder="e.g. Danum"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  Filipino translation *
                </label>
                <input
                  type="text"
                  value={textForm.translationFilipino}
                  onChange={(e) => setTextForm({ ...textForm, translationFilipino: e.target.value })}
                  placeholder="e.g. Tubig"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  English translation *
                </label>
                <input
                  type="text"
                  value={textForm.translationEnglish}
                  onChange={(e) => setTextForm({ ...textForm, translationEnglish: e.target.value })}
                  placeholder="e.g. Water"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  Category
                </label>
                <select
                  value={textForm.category}
                  onChange={(e) => setTextForm({ ...textForm, category: e.target.value, customCategory: '' })}
                  className={inputClasses}
                >
                  {['Greetings', 'Nature', 'Family', 'Food', 'Body', 'Animals', 'Numbers', 'Actions', 'Culture', 'Expressions', 'Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {textForm.category === 'Other' && (
                  <input
                    type="text"
                    value={textForm.customCategory}
                    onChange={(e) => setTextForm({ ...textForm, customCategory: e.target.value })}
                    placeholder="Specify category (optional)"
                    className={`${inputClasses} mt-2`}
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  Example sentence (optional)
                </label>
                <input
                  type="text"
                  value={textForm.exampleSentence}
                  onChange={(e) => setTextForm({ ...textForm, exampleSentence: e.target.value })}
                  placeholder="e.g. Mainom ta danum."
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  Example translation (optional)
                </label>
                <input
                  type="text"
                  value={textForm.exampleTranslation}
                  onChange={(e) => setTextForm({ ...textForm, exampleTranslation: e.target.value })}
                  placeholder="e.g. Let us drink water."
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                  Cultural note (optional)
                </label>
                <textarea
                  value={textForm.culturalNote}
                  onChange={(e) => setTextForm({ ...textForm, culturalNote: e.target.value })}
                  placeholder="Share any cultural context..."
                  rows={2}
                  className={`${inputClasses} resize-none`}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] p-4 ring-1 ring-gray-200 dark:ring-white/[0.06]">
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-white/40">
                Pronunciation recording (optional)
              </label>
              <p className="text-[11px] text-gray-400 dark:text-white/30 mb-3">
                Add a voice recording so learners can hear how to pronounce the word.
              </p>
              {textRecording ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Recording saved
                  </div>
                  <button
                    type="button"
                    onClick={() => setTextRecording(null)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (isRecordingPronunciation) {
                      mediaRecorderRef.current?.stop()
                      setIsRecordingPronunciation(false)
                    } else {
                      setIsRecordingPronunciation(true)
                      const recorder = await startAudioRecording((blob) => {
                        setTextRecording(blob)
                        setIsRecordingPronunciation(false)
                      })
                      mediaRecorderRef.current = recorder
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    isRecordingPronunciation
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-dashed border-gray-300 dark:border-white/[0.1] text-gray-500 dark:text-white/50 hover:border-brand hover:text-brand'
                  }`}
                >
                  {isRecordingPronunciation ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Recording... Tap to stop
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mic className="w-4 h-4" />
                      Add pronunciation
                    </span>
                  )}
                </button>
              )}
            </div>

            {textShowSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-green-50 dark:bg-green-500/10 p-6 text-center border border-green-200 dark:border-green-500/20"
              >
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Word added!</p>
                <p className="text-sm text-gray-500 dark:text-white/50 mb-4">Thank you for contributing.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTextShowSuccess(false)
                    setTextForm({ word: '', translationFilipino: '', translationEnglish: '', category: 'Greetings', customCategory: '', culturalNote: '', exampleSentence: '', exampleTranslation: '' })
                    setTextRecording(null)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-medium"
                >
                  Add another word
                </button>
              </motion.div>
            ) : (
              <button
                type="button"
                disabled={!selectedLanguage || !textForm.word || !textForm.translationFilipino || !textForm.translationEnglish}
                onClick={async () => {
                  if (!selectedLanguage || !textForm.word || !textForm.translationFilipino || !textForm.translationEnglish) return
                  const newWord: WordEntry = {
                    id: `text-${Date.now()}`,
                    languageId: selectedLanguage,
                    word: textForm.word,
                    phonetic: '',
                    translation: textForm.translationEnglish,
                    translationFilipino: textForm.translationFilipino,
                    partOfSpeech: 'noun',
                    category: textForm.category,
                    exampleSentence: textForm.exampleSentence || undefined,
                    exampleTranslation: textForm.exampleTranslation || undefined,
                    culturalNote: textForm.culturalNote || undefined,
                    audioBlob: textRecording ? await blobToBase64(textRecording) : undefined,
                    publishedAt: new Date().toISOString().split('T')[0],
                    confirmedCount: 0,
                    flagCount: 0,
                    status: 'unverified',
                  }
                  await saveWord(newWord)
                  if (profile) {
                    await saveProfile({ ...profile, wordsRecorded: profile.wordsRecorded + 1 })
                  }
                  setTextShowSuccess(true)
                }}
                className="w-full py-4 rounded-2xl bg-brand text-white font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Submit word
              </button>
            )}
          </motion.section>
        )}

        {activeTab === 'voice' && (
          <motion.section
            key="voice"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            aria-label="Voice contribution"
          >
            <div className="rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] p-5 ring-1 ring-gray-200 dark:ring-white/[0.06]">
              <label htmlFor="voice-language" className="mb-2 block text-sm text-gray-500 dark:text-white/40">
                Language
              </label>
              <select
                id="voice-language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={inputClasses + " appearance-none pr-10"}
                style={SELECT_CHEVRON_STYLE}
              >
                <option value="">Choose a language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLanguage ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <p className="mb-6 text-center text-sm text-gray-500 dark:text-white/40">
                  Tap the button to record pronunciation
                </p>
                <RecordButton
                  isRecording={isRecording}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  recordingTime={formatRecordingTime(recordingTime)}
                  size="lg"
                />

                {audioBlob && !isRecording ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3"
                  >
                    <button
                      type="button"
                      onClick={handlePlayback}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1c1c1e] py-3.5 text-sm font-medium text-gray-700 dark:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white"
                    >
                      <Play className="h-4 w-4" aria-hidden />
                      Play back
                    </button>
                    <button
                      type="button"
                      onClick={handleReRecord}
                      className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium text-gray-400 dark:text-white/35 transition-colors hover:text-gray-600 dark:hover:text-white/55"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      Re-record
                    </button>
                  </motion.div>
                ) : null}

                {audioBlob && !isRecording ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 w-full space-y-5"
                  >
                    <div className="rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] p-5 ring-1 ring-gray-200 dark:ring-white/[0.06] space-y-5">
                      <div>
                        <label htmlFor="voice-word" className="mb-2 block text-sm text-gray-500 dark:text-white/40">
                          Word or phrase
                        </label>
                        <input
                          id="voice-word"
                          type="text"
                          value={wordFieldValue}
                          onChange={(e) =>
                            setWordDetails((d) => ({ ...d, word: e.target.value }))
                          }
                          placeholder="e.g. mabuti"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="voice-translation-filipino"
                          className="mb-2 block text-sm text-gray-500 dark:text-white/40"
                        >
                          Filipino translation *
                        </label>
                        <input
                          id="voice-translation-filipino"
                          type="text"
                          value={wordDetails.translationFilipino}
                          onChange={(e) =>
                            setWordDetails((d) => ({ ...d, translationFilipino: e.target.value }))
                          }
                          placeholder="e.g. Tubig"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="voice-translation-english"
                          className="mb-2 block text-sm text-gray-500 dark:text-white/40"
                        >
                          English translation *
                        </label>
                        <input
                          id="voice-translation-english"
                          type="text"
                          value={wordDetails.translationEnglish}
                          onChange={(e) =>
                            setWordDetails((d) => ({ ...d, translationEnglish: e.target.value }))
                          }
                          placeholder="e.g. Water"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label htmlFor="voice-category" className="mb-2 block text-sm text-gray-500 dark:text-white/40">
                          Category
                        </label>
                        <select
                          id="voice-category"
                          value={wordDetails.category}
                          onChange={(e) =>
                            setWordDetails((d) => ({ ...d, category: e.target.value, customCategory: '' }))
                          }
                          className={inputClasses + " appearance-none pr-10"}
                          style={SELECT_CHEVRON_STYLE}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {wordDetails.category === 'Other' && (
                          <input
                            type="text"
                            value={wordDetails.customCategory}
                            onChange={(e) =>
                              setWordDetails((d) => ({ ...d, customCategory: e.target.value }))
                            }
                            placeholder="Specify category (optional)"
                            className={inputClasses + " mt-2"}
                          />
                        )}
                      </div>
                      <div>
                        <label htmlFor="voice-note" className="mb-2 block text-sm text-gray-500 dark:text-white/40">
                          Cultural note
                        </label>
                        <textarea
                          id="voice-note"
                          rows={3}
                          value={wordDetails.culturalNote}
                          onChange={(e) =>
                            setWordDetails((d) => ({ ...d, culturalNote: e.target.value }))
                          }
                          placeholder="Optional context, usage, or story"
                          className={inputClasses + " resize-none"}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleVoicePublish()}
                      disabled={
                        !(wordDetails.word || transcription).trim() ||
                        !wordDetails.translationFilipino.trim() ||
                        !wordDetails.translationEnglish.trim()
                      }
                      className="w-full rounded-xl bg-brand py-4 text-[15px] font-semibold text-white shadow-lg shadow-brand/15 transition-opacity disabled:opacity-40"
                    >
                      Publish to dictionary
                    </button>
                  </motion.div>
                ) : null}
              </motion.div>
            ) : (
              <p className="text-center text-sm text-gray-400 dark:text-white/35">
                Pick a language to unlock recording and details.
              </p>
            )}
          </motion.section>
        )}

        {activeTab === 'chat' && (
          <motion.section
            key="chat"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="relative"
            aria-label="Chat-guided contribution"
          >
            <div className="space-y-3 overflow-y-auto pb-20 max-h-[calc(100vh-320px)]">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={`${i}-${msg.content.slice(0, 24)}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-md bg-brand text-white'
                        : 'rounded-bl-md border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1c1c1e] text-gray-700 dark:text-white/90'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {chatStep === 'done' &&
              chatWord.word &&
              chatWord.translation &&
              chatWord.languageId ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1c1c1e] p-5 ring-1 ring-gray-100 dark:ring-white/[0.04]"
                >
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-white/45">
                    <Sparkles className="h-4 w-4 text-yellow-500 dark:text-[#FFD60A]" aria-hidden />
                    <span>Preview</span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{chatWord.word}</p>
                  <p className="mt-1 text-[15px] text-gray-500 dark:text-white/55">{chatWord.translation}</p>
                  {chatWord.exampleSentence ? (
                    <p className="mt-3 text-sm italic text-gray-500 dark:text-white/40">
                      &ldquo;{chatWord.exampleSentence}&rdquo;
                    </p>
                  ) : null}
                  {chatWord.exampleTranslation ? (
                    <p className="mt-1 text-sm text-gray-400 dark:text-white/35">{chatWord.exampleTranslation}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-gray-400 dark:text-white/30">
                    Language:{' '}
                    {languages.find((l) => l.id === chatWord.languageId)?.name ?? chatWord.languageId}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleChatPublish()}
                    className="mt-5 w-full rounded-xl bg-brand py-4 text-[15px] font-semibold text-white shadow-lg shadow-brand/15"
                  >
                    Publish word
                  </button>
                </motion.div>
              ) : null}
              <div ref={chatMessagesEndRef} className="h-px shrink-0" />
            </div>

            {chatStep !== 'done' ? (
              <div className="fixed bottom-[85px] left-0 right-0 px-5 pb-3 bg-white dark:bg-[#0d0d0f] border-t border-gray-200 dark:border-white/[0.08] pt-3 z-40">
                <div className="flex gap-2 max-w-lg mx-auto">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handleChatSubmit()
                      }
                    }}
                    placeholder="Type your answer..."
                    className="min-w-0 flex-1 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1c1c1e] py-3.5 px-4 text-[15px] text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-white/25 focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => void handleChatSubmit()}
                    disabled={!chatInput.trim()}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : null}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess ? (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-center gap-3 rounded-2xl bg-green-500 dark:bg-[#30D158] px-5 py-4 text-white shadow-xl shadow-black/20 dark:shadow-black/40"
            role="status"
          >
            <CheckCircle className="h-6 w-6 shrink-0" aria-hidden />
            <span className="text-[15px] font-medium">Published to Lingua PH.</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function ContributePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <ContributePageContent />
    </Suspense>
  )
}
