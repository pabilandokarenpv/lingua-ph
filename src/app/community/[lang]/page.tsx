'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Share2, Plus, Mic, FileText } from 'lucide-react'
import { getLanguage, getCommunityPosts, saveCommunityPost, getProfile } from '@/lib/db'
import type { Language, CommunityPost, UserProfile } from '@/types'

const postTypes = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'word_of_day', label: 'Word of Day', icon: FileText },
  { id: 'question', label: 'Question', icon: MessageCircle },
]

export default function CommunityPage() {
  const params = useParams()
  const router = useRouter()
  const langId = params.lang as string

  const [language, setLanguage] = useState<Language | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({
    content: '',
    translation: '',
    type: 'text' as CommunityPost['type'],
  })

  useEffect(() => {
    loadData()
  }, [langId])

  const loadData = async () => {
    setIsLoading(true)
    const [lang, langPosts, userProfile] = await Promise.all([
      getLanguage(langId),
      getCommunityPosts(langId),
      getProfile(),
    ])
    setLanguage(lang)
    setPosts(langPosts)
    setProfile(userProfile)
    setIsLoading(false)
  }

  const handleCreatePost = async () => {
    if (!profile || !newPost.content.trim()) return

    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      languageId: langId,
      authorName: profile.displayName,
      content: newPost.content,
      contentTranslation: newPost.translation,
      type: newPost.type,
      likes: 0,
      publishedAt: new Date().toISOString(),
    }

    await saveCommunityPost(post)
    setPosts([post, ...posts])
    setShowNewPost(false)
    setNewPost({ content: '', translation: '', type: 'text' })
  }

  const handleLike = async (postId: string) => {
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ))
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Mic className="w-4 h-4" />
      case 'word_of_day': return <FileText className="w-4 h-4" />
      case 'question': return <MessageCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'voice': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'word_of_day': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      case 'question': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      default: return 'bg-gray-500/10 text-gray-500 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!language) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Community not found</p>
        <button 
          onClick={() => router.push('/')}
          className="text-brand hover:underline"
        >
          Go back home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-black/95 backdrop-blur-lg border-b border-gray-200 dark:border-white/[0.06]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dictionary/${langId}`)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl text-gray-900 dark:text-white font-semibold">
                {language.name} Community
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{posts.length} posts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Be the first to start a conversation!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl p-4 border border-gray-200 dark:border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-blue-400 flex items-center justify-center text-white font-semibold">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{post.authorName}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPostTypeColor(post.type)}`}>
                  {getPostTypeIcon(post.type)}
                  {post.type.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-900 dark:text-white text-sm mb-2">{post.content}</p>
              {post.contentTranslation && (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-3">{post.contentTranslation}</p>
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${post.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-xs">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-brand transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">Reply</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-brand transition-colors ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <button
        onClick={() => setShowNewPost(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/20 hover:scale-105 transition-transform z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {showNewPost && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl w-full max-w-md mx-auto p-6 border-t border-gray-200 dark:border-white/[0.06]"
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-6" />
            
            <h2 className="text-xl text-gray-900 dark:text-white font-semibold mb-4">New Post</h2>

            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setNewPost({ ...newPost, type: type.id as CommunityPost['type'] })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    newPost.type === type.id
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>

            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Share something in the language..."
              className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/[0.06] rounded-xl py-3 px-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand resize-none mb-3"
              rows={3}
            />

            <input
              type="text"
              value={newPost.translation}
              onChange={(e) => setNewPost({ ...newPost, translation: e.target.value })}
              placeholder="Translation (optional)"
              className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/[0.06] rounded-xl py-3 px-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewPost(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.content.trim()}
                className="flex-1 py-3 rounded-xl bg-brand text-white font-medium disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
