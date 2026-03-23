'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, ExternalLink, Share2, ChevronRight } from 'lucide-react'

interface NewsAlertProps {
  headline: string
  source: string
  date: string
  summary: string
  languageName: string
  languageId: string
  region: string
  wordCount: number
  contributors: number
}

export function NewsAlert({
  headline,
  source,
  date,
  summary,
  languageName,
  languageId,
  region,
  wordCount,
  contributors,
}: NewsAlertProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Language Emergency: ${languageName}`,
        text: summary,
        url: window.location.origin + `/dictionary/${languageId}`,
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black dark:bg-white text-white dark:text-black rounded-2xl overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10 dark:border-black/10">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Language Emergency Alert
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-white/60 dark:text-black/60 mb-2">
          <ExternalLink className="w-3 h-3" />
          <span>From: {source} — {date}</span>
        </div>

        <p className="text-sm leading-relaxed mb-4">{summary}</p>

        <div className="bg-white/10 dark:bg-black/10 rounded-xl p-3 mb-4">
          <p className="font-semibold text-lg">{languageName}</p>
          <p className="text-xs text-white/60 dark:text-black/60">{region}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/50 dark:text-black/50">
            <span>{wordCount} words documented</span>
            <span>{contributors} contributors</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dictionary/${languageId}`}
            className="flex-1 py-3 rounded-xl bg-white dark:bg-black text-black dark:text-white text-sm font-semibold text-center"
          >
            View language
          </Link>
          <Link
            href={`/volunteer?lang=${languageId}`}
            className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-semibold text-center"
          >
            I can help
          </Link>
          <button
            onClick={handleShare}
            className="w-12 flex items-center justify-center rounded-xl bg-white/10 dark:bg-black/10"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
