'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Square,
  Check,
  SkipForward,
  Pause,
  Play,
  ArrowLeft,
  Heart,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { getLanguage, saveWord } from '@/lib/db'
import type { Language, WordEntry } from '@/types'

const ROUNDS = [
  {
    id: 1,
    title: 'Objects in the room',
    instruction: 'Point at objects around you. Ask the elder to name each one.',
    prompts: ['cup', 'water', 'fire', 'food', 'door', 'window', 'sky', 'tree'],
  },
  {
    id: 2,
    title: 'Family words',
    instruction: 'Ask the elder how they say:',
    prompts: ['mother', 'father', 'child', 'grandmother', 'grandfather', 'sister', 'brother'],
  },
  {
    id: 3,
    title: 'Body parts',
    instruction: 'Point to body parts and ask for names:',
    prompts: ['head', 'hand', 'eye', 'ear', 'mouth', 'nose', 'heart', 'foot'],
  },
  {
    id: 4,
    title: 'Nature words',
    instruction: 'Ask about the world around:',
    prompts: ['water', 'fire', 'earth', 'sky', 'sun', 'moon', 'rain', 'river', 'mountain', 'tree'],
  },
  {
    id: 5,
    title: 'Numbers',
    instruction: 'Ask the elder to count:',
    prompts: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  },
  {
    id: 6,
    title: 'Basic actions',
    instruction: 'Ask about common actions:',
    prompts: ['eat', 'sleep', 'walk', 'speak', 'love', 'come', 'go', 'give', 'take', 'see'],
  },
  {
    id: 7,
    title: 'Free recording',
    instruction: 'Let the elder speak freely. Songs, stories, prayers, names of places, childhood memories. Record everything. Nothing is too small.',
    prompts: [],
  },
]

function LastVoiceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const langId = searchParams.get('lang') || ''

  const [language, setLanguage] = useState<Language | null>(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [roundComplete, setRoundComplete] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  useEffect(() => {
    if (langId) {
      getLanguage(langId).then(setLanguage)
    }
  }, [langId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, isPaused])

  const round = ROUNDS[currentRound]
  const prompt = round?.prompts[currentPrompt]
  const isFreeRecording = currentRound === 6

  const startRecording = useCallback(() => {
    setIsRecording(true)
    setRecordingTime(0)
    setTranscription('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'fil-PH'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r[0].transcript)
          .join('')
        setTranscription(transcript)
      }

      recognition.start()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any)._lastVoiceRecognition = recognition
    }
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = (window as any)._lastVoiceRecognition
    if (recognition) {
      recognition.stop()
    }
  }, [])

  const handleSaveAndNext = async () => {
    if (!langId || !transcription.trim()) return

    const word: WordEntry = {
      id: `${langId}-lv-${Date.now()}`,
      languageId: langId,
      word: transcription.trim(),
      phonetic: '',
      translation: prompt || 'Free recording',
      translationFilipino: '',
      partOfSpeech: 'noun',
      category: round?.title || 'Last Voice',
      culturalNote: 'Recorded during Last Voice emergency documentation session.',
      confirmedCount: 1,
      flagCount: 0,
      status: 'pending',
      publishedAt: new Date().toISOString(),
      publishedBy: 'Last Voice Mode',
    }

    await saveWord(word)
    setSavedWords((prev) => [...prev, word.id])

    setTranscription('')
    setRecordingTime(0)

    if (isFreeRecording) {
      return
    }

    if (currentPrompt < round.prompts.length - 1) {
      setCurrentPrompt((p) => p + 1)
    } else {
      setRoundComplete(true)
    }
  }

  const handleSkip = () => {
    setTranscription('')
    setRecordingTime(0)

    if (isFreeRecording) return

    if (currentPrompt < round.prompts.length - 1) {
      setCurrentPrompt((p) => p + 1)
    } else {
      setRoundComplete(true)
    }
  }

  const handleNextRound = () => {
    setRoundComplete(false)
    if (currentRound < ROUNDS.length - 1) {
      setCurrentRound((r) => r + 1)
      setCurrentPrompt(0)
    } else {
      setSessionComplete(true)
    }
  }

  if (!language) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand to-blue-400 flex items-center justify-center">
            <Heart className="w-12 h-12 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Session Complete</h2>
          <p className="text-gray-500 dark:text-white/60 text-lg mb-2">{savedWords.length} words preserved</p>
          <p className="text-gray-400 dark:text-white/40 text-sm mb-8">
            The elder&apos;s voice is now saved on this device. Every word matters.
          </p>
          <button
            onClick={() => router.push(`/dictionary/${langId}`)}
            className="w-full py-4 rounded-2xl bg-brand text-white font-semibold mb-3"
          >
            View what was captured
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 font-medium"
          >
            Return home
          </button>
        </motion.div>
      </div>
    )
  }

  if (roundComplete) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Round {currentRound + 1} complete</h3>
          <p className="text-gray-500 dark:text-white/50 mb-6">
            {savedWords.length} words recorded so far
          </p>
          <button
            onClick={handleNextRound}
            className="w-full py-4 rounded-2xl bg-brand text-white font-semibold flex items-center justify-center gap-2"
          >
            Continue to Round {currentRound + 2}
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white">
      <div className="px-5 py-6 pb-32">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-xs text-brand uppercase tracking-wider">Last Voice Mode</p>
            <p className="text-sm text-gray-500 dark:text-white/50">{language.name}</p>
          </div>
          <div className="w-10" />
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="relative h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-brand rounded-full transition-all duration-500"
              style={{ width: `${((currentRound + 1) / ROUNDS.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 dark:text-white/40 text-center">
            Round {currentRound + 1} of {ROUNDS.length} — {round?.title}
          </p>
        </motion.div>

        <div className="bg-gray-50 dark:bg-[#1c1c1e] rounded-3xl border border-gray-200 dark:border-white/[0.06] p-6 mb-6">
          <p className="text-gray-600 dark:text-white/60 text-sm mb-4">{round?.instruction}</p>

          {!isFreeRecording && prompt && (
            <motion.div
              key={prompt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand/10 rounded-2xl p-6 text-center border border-brand/20 mb-6"
            >
              <p className="text-3xl font-bold text-gray-900 dark:text-white capitalize">{prompt}</p>
              <p className="text-sm text-gray-400 dark:text-white/40 mt-2">
                Word {currentPrompt + 1} of {round.prompts.length}
              </p>
            </motion.div>
          )}

          <div className="flex flex-col items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 shadow-lg shadow-red-500/30'
                  : 'bg-brand shadow-md'
              }`}
            >
              {isRecording ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Square className="w-8 h-8 text-white" fill="white" />
                </motion.div>
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </motion.button>

            {isRecording && (
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-mono text-red-500 dark:text-red-400">
                  {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <p className="text-xs font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">
                Transcription
              </p>
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <p className="text-lg text-gray-900 dark:text-white">{transcription}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {transcription && (
            <>
              <button
                onClick={handleSaveAndNext}
                className="w-full py-4 rounded-2xl bg-green-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Save and next
              </button>
              <button
                onClick={() => {
                  setTranscription('')
                  setRecordingTime(0)
                }}
                className="w-full py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Record again
              </button>
            </>
          )}
          {!isFreeRecording && (
            <button
              onClick={handleSkip}
              className="w-full py-3 text-gray-400 dark:text-white/30 font-medium flex items-center justify-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip this word
            </button>
          )}
        </div>

        <div className="fixed bottom-24 left-0 right-0 px-5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-full py-4 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-500 dark:text-orange-400 font-medium flex items-center justify-center gap-2"
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5" />
                Resume session
              </>
            ) : (
              <>
                <Pause className="w-5 h-5" />
                Elder needs rest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LastVoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LastVoiceContent />
    </Suspense>
  )
}
