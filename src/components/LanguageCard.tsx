'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, BookOpen, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

interface LanguageCardProps {
  language: Language
  index?: number
}

const statusConfig = {
  critical: { 
    color: '#ff3b30', 
    label: 'Critical',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
  growing: { 
    color: '#ff9f0a', 
    label: 'Growing',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  active: { 
    color: '#34c759', 
    label: 'Active',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
}

export function LanguageCard({ language, index = 0 }: LanguageCardProps) {
  const status = statusConfig[language.status]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Link 
        href={`/dictionary/${language.id}`}
        className="group block"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/[0.08] transition-all duration-500 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-black/50 hover:-translate-y-1">
          <div 
            className="absolute top-0 left-0 right-0 h-1 opacity-60"
            style={{ 
              background: `linear-gradient(90deg, ${language.coverColor} 0%, transparent 100%)` 
            }}
          />
          
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ 
              background: `radial-gradient(600px circle at 50% 0%, ${language.coverColor}08, transparent 40%)` 
            }}
          />
          
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl text-gray-900 dark:text-white font-semibold tracking-tight">
                  {language.name}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-white/50 text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  {language.region} · {language.province}
                </div>
              </div>
              <div 
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
                  status.bgColor,
                  status.borderColor
                )}
                style={{ color: status.color }}
              >
                {status.label}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-brand/5 dark:bg-white/5 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-brand" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold">{language.wordCount}</p>
                  <p className="text-gray-400 dark:text-white/40 text-[10px]">words</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-green-500/5 dark:bg-white/5 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold">{language.contributors}</p>
                  <p className="text-gray-400 dark:text-white/40 text-[10px]">contributors</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, language.contributors))].map((_, i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-blue-400 border-2 border-white dark:border-[#1c1c1e] flex items-center justify-center text-[8px] font-bold text-white"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {language.contributors > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 border-2 border-white dark:border-[#1c1c1e] flex items-center justify-center text-[8px] font-medium text-gray-500 dark:text-white/70">
                    +{language.contributors - 3}
                  </div>
                )}
              </div>
              <p className="text-gray-400 dark:text-white/40 text-xs">
                {language.learners.toLocaleString()} learners
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
