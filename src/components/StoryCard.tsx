'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Clock, ChevronDown, User, Volume2, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { speakWord } from '@/lib/speechUtils'
import { archiveStory, unarchiveStory, isStoryArchived } from '@/lib/db'
import type { Story } from '@/types'

interface StoryCardProps {
  story: Story
  index?: number
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  origin: { label: 'Origin', color: '#af52de' },
  legend: { label: 'Legend', color: '#ff9f0a' },
  custom: { label: 'Tradition', color: '#34c759' },
  history: { label: 'History', color: '#0071e3' },
  oral_history: { label: 'Oral History', color: '#5ac8fa' },
}

export function StoryCard({ story, index = 0 }: StoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  useEffect(() => {
    isStoryArchived(story.id).then(setIsBookmarked)
  }, [story.id])

  const handleListen = () => {
    if (story.audioBlob) {
      const audio = new Audio(story.audioBlob)
      audio.play()
    } else {
      speakWord(story.content, 'tl-PH')
    }
  }

  const category = categoryLabels[story.category] || { label: story.category, color: '#8e8e93' }

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
        <div 
          className="absolute top-0 left-0 right-0 h-20 opacity-20 dark:opacity-30"
          style={{ 
            background: `linear-gradient(180deg, ${category.color}20 0%, transparent 100%)` 
          }}
        />
        
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-3">
            <span 
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider"
              style={{ 
                backgroundColor: `${category.color}15`,
                color: category.color 
              }}
            >
              {category.label}
            </span>
            {story.duration && (
              <div className="flex items-center gap-1 text-gray-400 dark:text-white/40 text-xs">
                <Clock className="w-3 h-3" />
                {story.duration}
              </div>
            )}
          </div>

          <h3 className="text-xl text-gray-900 dark:text-white font-semibold tracking-tight mb-1">
            {story.title}
          </h3>
          <p className="text-gray-500 dark:text-white/50 text-sm italic">{story.titleTranslation}</p>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleListen}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Listen
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isExpanded ? 'Hide' : 'Read'}
              <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
            </button>
            <button
              onClick={async () => {
                if (isBookmarked) {
                  await unarchiveStory(story.id)
                  setIsBookmarked(false)
                } else {
                  await archiveStory(story)
                  setIsBookmarked(true)
                }
              }}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-300',
                isBookmarked ? 'bg-orange-500/10 text-orange-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70'
              )}
              title={isBookmarked ? 'Remove from archive' : 'Save to archive'}
            >
              <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
            </button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/[0.06]">
                  <div className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
                    <p className="text-gray-700 dark:text-white/90 text-sm leading-relaxed">{story.content}</p>
                  </div>
                  
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="mt-3 text-brand text-sm hover:underline"
                  >
                    {showTranslation ? 'Hide translation' : 'Show translation'}
                  </button>
                  
                  {showTranslation && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 p-4 rounded-xl bg-brand/5 border border-brand/10"
                    >
                      <p className="text-gray-600 dark:text-white/60 text-sm">{story.contentTranslation}</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center text-[10px] font-bold text-white">
                <User className="w-3 h-3" />
              </div>
              <span className="text-gray-500 dark:text-white/50 text-xs">{story.narratedBy}</span>
            </div>
            <span className="text-gray-400 dark:text-white/30 text-xs">
              {new Date(story.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
