'use client'

import { Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RecordButtonProps {
  isRecording: boolean
  onClick: () => void
  recordingTime?: string
  size?: 'sm' | 'md' | 'lg'
}

export function RecordButton({ 
  isRecording, 
  onClick, 
  recordingTime,
  size = 'lg' 
}: RecordButtonProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500/30"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500/20"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
        </>
      )}

      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl',
          sizeClasses[size],
          isRecording 
            ? 'bg-red-500 shadow-red-500/30' 
            : 'bg-gradient-to-br from-gray-100 dark:from-[#1c1c1e] to-gray-50 dark:to-[#141416] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
        )}
      >
        <Mic className={cn(
          'w-8 h-8 transition-all duration-300',
          isRecording ? 'text-white' : 'text-red-500'
        )} />
      </motion.button>

      {isRecording && recordingTime && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 font-mono text-sm font-semibold tracking-wider"
        >
          {recordingTime}
        </motion.span>
      )}

      {isRecording && (
        <div className="flex items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-red-500 rounded-full"
              animate={{
                height: [12, 32, 12],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
