'use client'

import { motion } from 'framer-motion'
import { Brain, Sparkles, MessageCircle, BookOpen, Check } from 'lucide-react'

interface AIProgressCardProps {
  wordCount: number
  swadeshDocumented?: number
}

export function AIProgressCard({ wordCount, swadeshDocumented = 0 }: AIProgressCardProps) {
  let status: {
    icon: typeof Brain
    title: string
    description: string
    color: string
    progress?: number
  }

  if (wordCount < 10) {
    status = {
      icon: Brain,
      title: 'Recording phase',
      description: 'The AI is listening and building the phonetic fingerprint of this language. Contribute more words to unlock AI features.',
      color: 'text-gray-500 dark:text-white/50',
    }
  } else if (wordCount < 30) {
    status = {
      icon: Sparkles,
      title: 'Pattern detection active',
      description: `AI has identified phonetic patterns. ${Math.round((wordCount / 30) * 100)}% confidence in language family classification.`,
      color: 'text-amber-500',
      progress: Math.round((wordCount / 30) * 100),
    }
  } else if (wordCount < 50) {
    status = {
      icon: MessageCircle,
      title: 'Chatbot active',
      description: 'The AI chatbot can now answer basic questions about this language using documented vocabulary.',
      color: 'text-brand',
    }
  } else if (wordCount < 100) {
    status = {
      icon: BookOpen,
      title: 'Lessons generating',
      description: `AI has generated ${Math.floor(wordCount / 10)} lesson modules from the community's vocabulary.`,
      color: 'text-purple-500',
    }
  } else if (swadeshDocumented < 207) {
    status = {
      icon: Sparkles,
      title: 'Growing intelligence',
      description: `${swadeshDocumented} of 207 Swadesh core words documented. ${207 - swadeshDocumented} more words until full foundation is complete.`,
      color: 'text-green-500',
      progress: Math.round((swadeshDocumented / 207) * 100),
    }
  } else {
    status = {
      icon: Check,
      title: 'Full capability',
      description: 'All 207 Swadesh core words documented. This language has a complete AI foundation. The chatbot, lessons, and translation features are fully operational.',
      color: 'text-green-500',
    }
  }

  const Icon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center ${status.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">
              AI Status
            </span>
            <span className={`text-xs font-semibold ${status.color}`}>
              {status.title}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
            {status.description}
          </p>

          {status.progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-white/40 mb-1">
                <span>Progress</span>
                <span>{status.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    status.progress >= 100 ? 'bg-green-500' : 'bg-brand'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${status.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
