'use client'

import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import { speakWord } from '@/lib/speechUtils'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  index?: number
}

export function ChatBubble({ role, content, index = 0 }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`max-w-[80%] rounded-2xl px-4 py-3.5 shadow-sm ${
          isUser 
            ? 'bg-brand text-white rounded-br-md' 
            : 'bg-gray-100 dark:bg-[#1c1c1e] text-gray-800 dark:text-white border border-gray-200 dark:border-white/[0.06] rounded-bl-md'
        }`}
      >
        <p className="text-[15px] leading-relaxed">{content}</p>
        
        {!isUser && (
          <button
            onClick={() => speakWord(content, 'tl-PH')}
            className="mt-2 p-1.5 rounded-lg bg-gray-200/60 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
