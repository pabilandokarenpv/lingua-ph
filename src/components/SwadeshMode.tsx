'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Square,
  Check,
  SkipForward,
  ChevronRight,
  RefreshCw,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { SWADESH_LIST, SWADESH_CATEGORIES, type SwadeshWord } from '@/lib/swadeshList'
import { saveWord } from '@/lib/db'
import type { WordEntry } from '@/types'

interface SwadeshModeProps {
  languageId: string
  languageName: string
  onClose: () => void
  documentedSwadeshIds?: string[]
}

export function SwadeshMode({
  languageId,
  languageName,
  onClose,
  documentedSwadeshIds = [],
}: SwadeshModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [showMilestone, setShowMilestone] = useState<number | null>(null)

  const undocumentedWords = SWADESH_LIST.filter(
    (w) => !documentedSwadeshIds.includes(w.id)
  ).sort((a, b) => a.priority - b.priority)

  const currentWord = undocumentedWords[currentIndex]
  const progress = savedCount
  const totalRemaining = undocumentedWords.length

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

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
      ;(window as any)._swadeshRecognition = recognition
    }
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = (window as any)._swadeshRecognition
    if (recognition) {
      recognition.stop()
    }
  }, [])

  const handleSaveAndNext = async () => {
    if (!currentWord || !transcription.trim()) return

    const word: WordEntry = {
      id: `${languageId}-sw-${currentWord.id}-${Date.now()}`,
      languageId,
      word: transcription.trim(),
      phonetic: '',
      translation: currentWord.english,
      translationFilipino: currentWord.filipino,
      partOfSpeech: 'noun',
      category: SWADESH_CATEGORIES.find((c) => c.id === currentWord.category)?.label || 'General',
      confirmedCount: 1,
      flagCount: 0,
      status: 'pending',
      publishedAt: new Date().toISOString(),
      publishedBy: 'Swadesh Documentation',
    }

    await saveWord(word)
    const newCount = savedCount + 1
    setSavedCount(newCount)

    if (newCount === 10 || newCount === 30 || newCount === 50 || newCount === 100 || newCount === 207) {
      setShowMilestone(newCount)
      setTimeout(() => setShowMilestone(null), 3000)
    }

    setTranscription('')
    setRecordingTime(0)
    if (currentIndex < undocumentedWords.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handleSkip = () => {
    setTranscription('')
    setRecordingTime(0)
    if (currentIndex < undocumentedWords.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handleRecordAgain = () => {
    setTranscription('')
    setRecordingTime(0)
  }

  if (!currentWord) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Foundation Complete</h2>
          <p className="text-gray-500 dark:text-white/50 mb-6">
            All 207 Swadesh core words documented for {languageName}.
            This language has a complete AI foundation.
          </p>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-brand text-white font-semibold"
          >
            Return to Dictionary
          </button>
        </motion.div>
      </div>
    )
  }

  const categoryLabel = SWADESH_CATEGORIES.find((c) => c.id === currentWord.category)?.label || ''

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black overflow-y-auto">
      <div className="min-h-screen px-5 py-6 pb-32">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70"
          >
            Exit
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Swadesh Mode</span>
          </div>
          <div className="w-10" />
        </header>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-white/50">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{progress} / 207</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand rounded-full"
              initial={false}
              animate={{ width: `${(progress / 207) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mb-8"
        >
          <p className="text-xs font-medium text-brand uppercase tracking-wider mb-2">
            {categoryLabel}
          </p>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {currentWord.english}
          </h2>
          <p className="text-lg text-gray-500 dark:text-white/50">{currentWord.filipino}</p>
        </motion.div>

        <div className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-6 mb-6">
          <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
            Ask the elder: &ldquo;What is your word for <span className="text-brand font-medium">{currentWord.english}</span>?&rdquo;
          </p>

          <div className="flex flex-col items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 shadow-lg shadow-red-500/30'
                  : 'bg-brand shadow-lg shadow-brand/30'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" fill="white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </motion.button>

            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-500">
                  {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                </span>
              </motion.div>
            )}

            <p className="text-xs text-gray-400 dark:text-white/30">
              {isRecording ? 'Tap to stop' : 'Tap to record'}
            </p>
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
              <div className="bg-brand/10 dark:bg-brand/20 rounded-xl p-4 border border-brand/20">
                <p className="text-lg font-medium text-gray-900 dark:text-white">{transcription}</p>
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
                onClick={handleRecordAgain}
                className="w-full py-4 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#1c1c1e] text-gray-700 dark:text-white/80 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Record again
              </button>
            </>
          )}
          <button
            onClick={handleSkip}
            className="w-full py-4 rounded-2xl text-gray-400 dark:text-white/40 font-medium flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip this word
          </button>
        </div>

        <AnimatePresence>
          {showMilestone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 mx-6 text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {showMilestone} words captured
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {showMilestone >= 207
                    ? 'Foundation complete. This language is no longer zero-resource.'
                    : showMilestone >= 100
                    ? 'Almost there. The AI can now provide full assistance.'
                    : showMilestone >= 50
                    ? 'Lingua PH has generated the first lesson modules.'
                    : showMilestone >= 30
                    ? 'The AI chatbot can now answer basic questions.'
                    : 'AI has identified phonetic patterns in this language.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
