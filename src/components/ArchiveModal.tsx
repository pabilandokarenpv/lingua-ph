'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookMarked, ExternalLink, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getArchivedStories, unarchiveStory, getAllLanguages, type ArchivedStory } from '@/lib/db'
import type { Language } from '@/types'

interface ArchiveModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ArchiveModal({ isOpen, onClose }: ArchiveModalProps) {
  const [archives, setArchives] = useState<ArchivedStory[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  async function fetchData() {
    setLoading(true)
    try {
      const [archivedStories, langs] = await Promise.all([
        getArchivedStories(),
        getAllLanguages()
      ])
      setArchives(archivedStories)
      setLanguages(langs)
    } catch (e) {
      console.error('Failed to fetch archives:', e)
    }
    setLoading(false)
  }

  function getLanguageName(languageId: string): string {
    return languages.find(l => l.id === languageId)?.name || 'Unknown'
  }

  async function handleRemove(storyId: string) {
    await unarchiveStory(storyId)
    setArchives(prev => prev.filter(a => a.storyId !== storyId))
  }

  function handleGoToStory(archive: ArchivedStory) {
    onClose()
    router.push(`/dictionary/${archive.languageId}?tab=stories&story=${archive.storyId}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-brand" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">My Archive</h2>
                  <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium">
                    {archives.length}
                  </span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-white/50" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : archives.length === 0 ? (
                  <div className="text-center py-12">
                    <BookMarked className="w-12 h-12 mx-auto text-gray-300 dark:text-white/20 mb-3" />
                    <p className="text-gray-500 dark:text-white/50">No archived stories yet</p>
                    <p className="text-sm text-gray-400 dark:text-white/30 mt-1">
                      Save stories from the dictionary to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archives.map((archive) => (
                      <div
                        key={archive.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                      >
                        <button
                          onClick={() => handleGoToStory(archive)}
                          className="flex-1 text-left"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                            {archive.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                            {getLanguageName(archive.languageId)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                            Saved {new Date(archive.savedAt).toLocaleDateString()}
                          </p>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleGoToStory(archive)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            title="Go to story"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500 dark:text-white/50" />
                          </button>
                          <button
                            onClick={() => handleRemove(archive.storyId)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            title="Remove from archive"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
