import localforage from 'localforage'
import { SEED_LANGUAGES, SEED_WORDS, SEED_STORIES, SEED_COMMUNITY_POSTS } from './seedData'
import type { Language, WordEntry, Story, UserProfile, ChatMessage, CommunityPost } from '@/types'

// Initialize separate stores
const languageStore = localforage.createInstance({ name: 'lingua-languages' })
const wordStore = localforage.createInstance({ name: 'lingua-words' })
const storyStore = localforage.createInstance({ name: 'lingua-stories' })
const profileStore = localforage.createInstance({ name: 'lingua-profile' })
const chatStore = localforage.createInstance({ name: 'lingua-chat' })
const communityStore = localforage.createInstance({ name: 'lingua-community' })

// Database version - increment this to force re-seed
const DB_VERSION = 2

// Seed data - always merge new items with existing data
export async function initializeDatabase() {
  // Check version and clear old data if outdated
  const currentVersion = await languageStore.getItem<number>('db_version')
  if (currentVersion !== DB_VERSION) {
    // Clear all stores and re-seed
    await languageStore.clear()
    await wordStore.clear()
    await storyStore.clear()
    await communityStore.clear()
  }
  
  // Always add or update languages from seed data
  for (const lang of SEED_LANGUAGES) {
    await languageStore.setItem(lang.id, lang)
  }
  
  // Always add words from seed data
  for (const word of SEED_WORDS) {
    await wordStore.setItem(word.id, word)
  }
  
  // Always add stories from seed data
  for (const story of SEED_STORIES) {
    await storyStore.setItem(story.id, story)
  }
  
  // Always add community posts from seed data
  for (const post of SEED_COMMUNITY_POSTS) {
    await communityStore.setItem(post.id, post)
  }
  
  // Set version to mark as initialized
  await languageStore.setItem('db_version', DB_VERSION)
}

// Languages
export async function getAllLanguages(): Promise<Language[]> {
  const languages: Language[] = []
  await languageStore.iterate<Language, void>((value, key) => {
    if (key !== 'initialized' && typeof value === 'object' && value.id) {
      languages.push(value)
    }
  })
  return languages
}

export async function getLanguage(id: string): Promise<Language | null> {
  return await languageStore.getItem<Language>(id)
}

export async function saveLanguage(language: Language): Promise<void> {
  await languageStore.setItem(language.id, language)
}

// Words
export async function getWordsByLanguage(languageId: string): Promise<WordEntry[]> {
  const words: WordEntry[] = []
  await wordStore.iterate<WordEntry, void>((value) => {
    if (value.languageId === languageId) words.push(value)
  })
  return words.sort((a, b) => b.confirmedCount - a.confirmedCount)
}

export async function getAllWords(): Promise<WordEntry[]> {
  const words: WordEntry[] = []
  await wordStore.iterate<WordEntry, void>((value, key) => {
    if (!key.startsWith('_')) words.push(value)
  })
  return words
}

export async function saveWord(word: WordEntry): Promise<void> {
  await wordStore.setItem(word.id, word)
  // Update language word count
  const lang = await getLanguage(word.languageId)
  if (lang) {
    lang.wordCount = (lang.wordCount || 0) + 1
    await saveLanguage(lang)
  }
}

export async function confirmWord(wordId: string): Promise<void> {
  const word = await wordStore.getItem<WordEntry>(wordId)
  if (word) {
    word.confirmedCount += 1
    if (word.confirmedCount >= 3) word.status = 'confirmed'
    await wordStore.setItem(wordId, word)
  }
}

export async function flagWord(wordId: string): Promise<void> {
  const word = await wordStore.getItem<WordEntry>(wordId)
  if (word) {
    word.flagCount += 1
    if (word.flagCount >= 3) word.status = 'flagged'
    await wordStore.setItem(wordId, word)
  }
}

// Stories
export async function getStoriesByLanguage(languageId: string): Promise<Story[]> {
  const stories: Story[] = []
  await storyStore.iterate<Story, void>((value) => {
    if (value.languageId === languageId) stories.push(value)
  })
  return stories
}

export async function saveStory(story: Story): Promise<void> {
  await storyStore.setItem(story.id, story)
}

// User Profile
export async function getProfile(): Promise<UserProfile | null> {
  return await profileStore.getItem<UserProfile>('user')
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await profileStore.setItem('user', profile)
}

// Chat History
export async function getChatHistory(languageId: string): Promise<ChatMessage[]> {
  const history = await chatStore.getItem<ChatMessage[]>(`chat-${languageId}`)
  return history || []
}

export async function saveChatMessage(languageId: string, message: ChatMessage): Promise<void> {
  const history = await getChatHistory(languageId)
  history.push(message)
  // Keep last 100 messages only
  const trimmed = history.slice(-100)
  await chatStore.setItem(`chat-${languageId}`, trimmed)
}

// Community Posts
export async function getCommunityPosts(languageId: string): Promise<CommunityPost[]> {
  const posts: CommunityPost[] = []
  await communityStore.iterate<CommunityPost, void>((value) => {
    if (value.languageId === languageId) posts.push(value)
  })
  return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function saveCommunityPost(post: CommunityPost): Promise<void> {
  await communityStore.setItem(post.id, post)
}
