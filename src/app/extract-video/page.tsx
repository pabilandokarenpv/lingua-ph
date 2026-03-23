'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Link as LinkIcon,
  Upload,
  Play,
  Check,
  X,
  Edit3,
  Plus,
  Loader2,
  Film,
} from 'lucide-react'
import { getAllLanguages, saveWord } from '@/lib/db'
import type { Language, WordEntry } from '@/types'

interface ExtractedWord {
  id: string
  word: string
  suggestedTranslation: string
  occurrences: number
  timestamp: string
  confidence: number
  status: 'pending' | 'accepted' | 'rejected' | 'edited'
}

const MOCK_RESULTS: ExtractedWord[] = [
  {
    id: '1',
    word: 'danum',
    suggestedTranslation: 'water / tubig',
    occurrences: 4,
    timestamp: '2:34',
    confidence: 0.89,
    status: 'pending',
  },
  {
    id: '2',
    word: 'apoy',
    suggestedTranslation: 'fire / apoy',
    occurrences: 2,
    timestamp: '5:12',
    confidence: 0.92,
    status: 'pending',
  },
  {
    id: '3',
    word: 'langit',
    suggestedTranslation: 'sky / langit',
    occurrences: 3,
    timestamp: '8:45',
    confidence: 0.85,
    status: 'pending',
  },
]

export default function ExtractVideoPage() {
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [languages, setLanguages] = useState<Language[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [results, setResults] = useState<ExtractedWord[]>([])
  const [showResults, setShowResults] = useState(false)
  const [editingWord, setEditingWord] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    getAllLanguages().then(setLanguages)
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
      if (validTypes.includes(file.type)) {
        setUploadedFile(file)
      } else {
        alert('Please upload a valid video file (MP4, MOV, AVI, or WebM)')
      }
    }
  }

  const handleExtract = async () => {
    if (activeTab === 'youtube' && !youtubeUrl) return
    if (activeTab === 'upload' && !uploadedFile) return
    if (!selectedLanguage) return

    setIsProcessing(true)
    setProcessingStep(1)

    await new Promise((r) => setTimeout(r, 1500))
    setProcessingStep(2)

    await new Promise((r) => setTimeout(r, 2000))
    setProcessingStep(3)

    await new Promise((r) => setTimeout(r, 1500))
    setProcessingStep(4)

    await new Promise((r) => setTimeout(r, 1000))

    setResults(MOCK_RESULTS)
    setIsProcessing(false)
    setShowResults(true)
  }

  const handleAccept = (id: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'accepted' as const } : r))
    )
  }

  const handleReject = (id: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r))
    )
  }

  const handleEdit = (id: string) => {
    const word = results.find((r) => r.id === id)
    if (word) {
      setEditingWord(id)
      setEditValue(word.suggestedTranslation)
    }
  }

  const handleSaveEdit = (id: string) => {
    setResults((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, suggestedTranslation: editValue, status: 'edited' as const } : r
      )
    )
    setEditingWord(null)
    setEditValue('')
  }

  const handleAddAllToDictionary = async () => {
    const accepted = results.filter((r) => r.status === 'accepted' || r.status === 'edited')

    for (const word of accepted) {
      const entry: WordEntry = {
        id: `${selectedLanguage}-video-${Date.now()}-${word.id}`,
        languageId: selectedLanguage,
        word: word.word,
        phonetic: '',
        translation: word.suggestedTranslation.split('/')[0].trim(),
        translationFilipino: word.suggestedTranslation.split('/')[1]?.trim() || '',
        partOfSpeech: 'noun',
        category: 'Video Extract',
        culturalNote: `Extracted from video at timestamp ${word.timestamp}. Appeared ${word.occurrences} times.`,
        confirmedCount: 0,
        flagCount: 0,
        status: 'pending',
        publishedAt: new Date().toISOString(),
        publishedBy: 'Video Extraction',
      }
      await saveWord(entry)
    }

    setResults([])
    setShowResults(false)
    setYoutubeUrl('')
  }

  const processingSteps = [
    { step: 1, label: 'Audio extracted' },
    { step: 2, label: 'Transcribing speech...' },
    { step: 3, label: 'Identifying vocabulary...' },
    { step: 4, label: 'Finding translation pairs...' },
  ]

  return (
    <div className="min-h-screen px-5 pt-6 pb-32">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/contribute"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-600 dark:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Extract from Video
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-white/50">
          Upload an interview, documentary, or cultural video.
          AI will identify vocabulary automatically.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Processing video...</p>
            </div>
            <div className="space-y-3">
              {processingSteps.map((s) => (
                <div
                  key={s.step}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                    processingStep >= s.step
                      ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20'
                      : 'bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/[0.06]'
                  }`}
                >
                  {processingStep > s.step ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : processingStep === s.step ? (
                    <Loader2 className="w-5 h-5 text-brand animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-white/20" />
                  )}
                  <span
                    className={`text-sm ${
                      processingStep >= s.step
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-white/40'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : showResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-white/50">
                AI found {results.length} potential vocabulary entries
              </p>
              <button
                onClick={() => {
                  setShowResults(false)
                  setResults([])
                }}
                className="text-sm text-gray-400 dark:text-white/40"
              >
                Start over
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {results.map((word) => (
                <motion.div
                  key={word.id}
                  layout
                  className={`p-4 rounded-2xl border transition-all ${
                    word.status === 'accepted' || word.status === 'edited'
                      ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                      : word.status === 'rejected'
                      ? 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/[0.06] opacity-50'
                      : 'bg-gray-50 dark:bg-[#1c1c1e] border-gray-200 dark:border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{word.word}</p>
                      <p className="text-xs text-gray-400 dark:text-white/40">
                        Appears {word.occurrences} times · Timestamp {word.timestamp}
                      </p>
                    </div>
                    <span className="text-xs text-brand bg-brand/10 px-2 py-1 rounded-full">
                      {Math.round(word.confidence * 100)}% confidence
                    </span>
                  </div>

                  {editingWord === word.id ? (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-black text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveEdit(word.id)}
                        className="px-3 py-2 rounded-xl bg-brand text-white text-sm font-medium"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-3">
                      AI suggests: <span className="font-medium">{word.suggestedTranslation}</span>
                    </p>
                  )}

                  {word.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(word.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500 text-white text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Add
                      </button>
                      <button
                        onClick={() => handleEdit(word.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(word.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-gray-400 dark:text-white/40 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {results.some((r) => r.status === 'accepted' || r.status === 'edited') && (
              <button
                onClick={handleAddAllToDictionary}
                className="w-full py-4 rounded-2xl bg-brand text-white font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add {results.filter((r) => r.status === 'accepted' || r.status === 'edited').length} to dictionary
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex rounded-xl bg-gray-100 dark:bg-[#1c1c1e] p-1 border border-gray-200 dark:border-white/[0.06] mb-6">
              {[
                { id: 'youtube' as const, label: 'YouTube Link', icon: LinkIcon },
                { id: 'upload' as const, label: 'Upload Video', icon: Upload },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-white/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'youtube' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2 block">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl p-4 border border-gray-200 dark:border-white/[0.06]">
                  <p className="text-xs font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">
                    Good sources
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-white/50 space-y-1">
                    <li>• News interviews about indigenous communities</li>
                    <li>• Cultural documentaries</li>
                    <li>• Community events recorded on YouTube</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="border-2 border-dashed border-gray-200 dark:border-white/[0.1] rounded-2xl p-8 text-center">
                {uploadedFile ? (
                  <>
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mb-4">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <Film className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-white/20" />
                    <p className="text-sm text-gray-500 dark:text-white/50 mb-2">
                      Drag and drop video file here
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mb-4">
                      MP4, MOV, AVI, WebM (max 500MB)
                    </p>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/70 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors">
                        Browse files
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2 block">
                Which language is spoken in this video?
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(156,163,175,1)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                }}
              >
                <option value="">Select language...</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExtract}
              disabled={!youtubeUrl || !selectedLanguage}
              className="w-full mt-6 py-4 rounded-2xl bg-brand text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Extract from video
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
