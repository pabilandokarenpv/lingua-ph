'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Mic, RotateCcw, ArrowRight, Volume2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { speakWord, startSpeechRecognition, comparePronunciation } from '@/lib/speechUtils'

interface PronunciationPracticeProps {
  word: string
  phonetic: string
  translation: string
  isOpen: boolean
  onClose: () => void
}

export function PronunciationPractice({ 
  word, 
  phonetic, 
  translation,
  isOpen, 
  onClose 
}: PronunciationPracticeProps) {
  const [step, setStep] = useState<'listen' | 'practice' | 'result'>('listen')
  const [isRecording, setIsRecording] = useState(false)
  const [attemptText, setAttemptText] = useState('')
  const [score, setScore] = useState(0)
  const recognitionRef = useRef<any>(null)

  const handleListen = () => {
    speakWord(word, 'tl-PH')
  }

  const handleStartPractice = () => {
    setStep('practice')
    setIsRecording(true)
    setAttemptText('')
    
    recognitionRef.current = startSpeechRecognition(
      (text) => {
        setAttemptText(text)
      },
      () => {
        setIsRecording(false)
        if (attemptText) {
          const similarity = comparePronunciation(word, attemptText)
          setScore(similarity)
          setStep('result')
        }
      }
    )
  }

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleTryAgain = () => {
    setStep('listen')
    setAttemptText('')
    setScore(0)
  }

  const getFeedbackMessage = () => {
    if (score >= 80) return "Excellent! You sound like a native speaker!"
    if (score >= 60) return "Great try! Listen again and practice more."
    return "Keep practicing! You'll get it."
  }

  const getScoreColor = () => {
    if (score >= 80) return '#34c759'
    if (score >= 60) return '#ff9f0a'
    return '#ff3b30'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d0d0f] rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto border-t border-gray-200 dark:border-white/[0.08]"
          >
            <div className="p-6 pb-28">
              <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl text-gray-900 dark:text-white font-semibold">Practice</h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-white/60" />
                </button>
              </div>

              <div className="text-center mb-8">
                <motion.p 
                  key={word}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl text-gray-900 dark:text-white font-semibold mb-2"
                >
                  {word}
                </motion.p>
                <p className="text-gray-400 dark:text-white/40 text-lg">{phonetic}</p>
                <p className="text-brand mt-2">{translation}</p>
              </div>

              <AnimatePresence mode="wait">
                {step === 'listen' && (
                  <motion.div
                    key="listen"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={handleListen}
                      className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-brand" />
                      </div>
                      Hear the word
                    </button>

                    <button
                      onClick={handleStartPractice}
                      className="w-full py-3 px-4 rounded-xl bg-brand hover:opacity-90 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-brand/15"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      Start Practice
                    </button>
                  </motion.div>
                )}

                {step === 'practice' && (
                  <motion.div
                    key="practice"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="flex items-center gap-1 h-12">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-red-500 rounded-full"
                          animate={{ height: [16, 40, 16] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>

                    <p className="text-gray-500 dark:text-white/50 text-xs">
                      {isRecording ? 'Recording... Tap to stop' : 'Processing...'}
                    </p>

                    <button
                      onClick={handleStopRecording}
                      disabled={!isRecording}
                      className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center disabled:opacity-50 shadow-lg shadow-red-500/25"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {step === 'result' && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border-[3px]"
                        style={{ borderColor: getScoreColor() }}
                      >
                        <span 
                          className="text-2xl font-bold"
                          style={{ color: getScoreColor() }}
                        >
                          {score}%
                        </span>
                      </motion.div>
                      <p className="text-gray-900 dark:text-white font-medium text-sm">{getFeedbackMessage()}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-gray-400 dark:text-white/40 text-[10px] mb-1 uppercase tracking-wide">Original</p>
                        <p className="text-gray-900 dark:text-white font-medium text-sm">{word}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-gray-400 dark:text-white/40 text-[10px] mb-1 uppercase tracking-wide">Your attempt</p>
                        <p className="font-medium text-sm" style={{ color: getScoreColor() }}>
                          {attemptText || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleTryAgain}
                        className="flex-1 py-3 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 px-3 rounded-xl bg-brand hover:opacity-90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Next
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
