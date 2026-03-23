'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Mic, CheckCircle, Flag, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { speakWord } from '@/lib/speechUtils'
import type { WordEntry } from '@/types'

interface WordCardProps {
  word: WordEntry
  languageName: string
  onPractice?: () => void
  onConfirm?: () => void
  onFlag?: () => void
  index?: number
}

const partOfSpeechColors: Record<string, { bg: string; text: string }> = {
  noun: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-[#2997ff]' },
  verb: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-[#34c759]' },
  adjective: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-[#ff9f0a]' },
  greeting: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-[#af52de]' },
  phrase: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-[#ff2d55]' },
  other: { bg: 'bg-gray-500/10 dark:bg-white/10', text: 'text-gray-600 dark:text-white/70' },
}

export function WordCard({ 
  word, 
  languageName,
  onPractice, 
  onConfirm, 
  onFlag,
  index = 0 
}: WordCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handlePlay = () => {
    if (word.audioBlob) {
      const audio = new Audio(word.audioBlob)
      audio.play()
    } else {
      speakWord(word.word, 'tl-PH')
    }
  }

  const posStyle = partOfSpeechColors[word.partOfSpeech] || partOfSpeechColors.other

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.06,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/[0.06] transition-all duration-500 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-lg dark:hover:shadow-xl">
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-2xl text-gray-900 dark:text-white font-semibold tracking-tight">
                {word.word}
              </h3>
              <p className="text-gray-500 dark:text-white/40 text-sm mt-0.5">{word.phonetic}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  'p-2 rounded-xl transition-all duration-300',
                  isLiked ? 'bg-pink-500/10 text-pink-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70'
                )}
              >
                <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
              </button>
              <button
                onClick={handlePlay}
                className="p-2 rounded-xl bg-brand/10 text-brand hover:bg-brand/20 transition-all duration-300"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <span className={cn(
            'inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider mb-3',
            posStyle.bg,
            posStyle.text
          )}>
            {word.partOfSpeech}
          </span>

          <div className="mb-3">
            <p className="text-gray-900 dark:text-white text-lg font-medium">{word.translation}</p>
            <p className="text-gray-500 dark:text-white/50 text-sm">{word.translationFilipino}</p>
          </div>

          {word.exampleSentence && (
            <div className="mb-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
              <p className="text-gray-700 dark:text-white/90 italic text-sm">&ldquo;{word.exampleSentence}&rdquo;</p>
              <p className="text-gray-500 dark:text-white/50 text-xs mt-1">{word.exampleTranslation}</p>
            </div>
          )}

          {word.culturalNote && (
            <div className="mb-4 p-3 rounded-xl bg-brand/5 border border-brand/10">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <p className="text-brand text-sm leading-relaxed">{word.culturalNote}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            {onPractice && (
              <button
                onClick={onPractice}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Practice
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 px-3 rounded-xl bg-green-500/10 text-green-600 dark:text-[#34c759] text-sm font-medium hover:bg-green-500/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm
              </button>
            )}
            {onFlag && (
              <button
                onClick={onFlag}
                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-300"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/[0.06]">
            {word.publishedBy ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-blue-400 flex items-center justify-center text-[10px] font-bold text-white">
                  {word.publishedBy.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-400 dark:text-white/40 text-xs">{word.publishedBy}</span>
              </div>
            ) : (
              <span className="text-gray-400 dark:text-white/40 text-xs">Community</span>
            )}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-400 dark:text-white/30">
                {new Date(word.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1 text-green-600 dark:text-[#34c759]">
                <CheckCircle className="w-3 h-3" />
                {word.confirmedCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
