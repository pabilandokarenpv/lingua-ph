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
const archiveStore = localforage.createInstance({ name: 'lingua-archive' })
const contributionStore = localforage.createInstance({ name: 'lingua-contributions' })
const notificationStore = localforage.createInstance({ name: 'lingua-notifications' })

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

// Archive (Saved Stories)
export interface ArchivedStory {
  id: string
  storyId: string
  languageId: string
  title: string
  savedAt: string
}

export async function getArchivedStories(): Promise<ArchivedStory[]> {
  const archived: ArchivedStory[] = []
  await archiveStore.iterate<ArchivedStory, void>((value) => {
    archived.push(value)
  })
  return archived.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export async function archiveStory(story: Story): Promise<void> {
  const archived: ArchivedStory = {
    id: `archive-${story.id}`,
    storyId: story.id,
    languageId: story.languageId,
    title: story.title,
    savedAt: new Date().toISOString(),
  }
  await archiveStore.setItem(archived.id, archived)
}

export async function unarchiveStory(storyId: string): Promise<void> {
  await archiveStore.removeItem(`archive-${storyId}`)
}

export async function isStoryArchived(storyId: string): Promise<boolean> {
  const item = await archiveStore.getItem(`archive-${storyId}`)
  return !!item
}

// User Contributions
export interface UserContribution {
  id: string
  type: 'word' | 'story'
  itemId: string
  languageId: string
  title: string
  status: 'published' | 'draft' | 'archived'
  confirmCount: number
  flagCount: number
  createdAt: string
  updatedAt: string
}

export async function getUserContributions(): Promise<UserContribution[]> {
  const contributions: UserContribution[] = []
  await contributionStore.iterate<UserContribution, void>((value) => {
    contributions.push(value)
  })
  return contributions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function saveUserContribution(contribution: UserContribution): Promise<void> {
  await contributionStore.setItem(contribution.id, contribution)
}

export async function updateContributionStatus(
  contributionId: string, 
  status: 'published' | 'draft' | 'archived'
): Promise<void> {
  const contribution = await contributionStore.getItem<UserContribution>(contributionId)
  if (contribution) {
    contribution.status = status
    contribution.updatedAt = new Date().toISOString()
    await contributionStore.setItem(contributionId, contribution)
  }
}

// User interactions tracking (for confirm/flag once per word)
export interface UserInteraction {
  wordId: string
  action: 'confirm' | 'flag'
  timestamp: string
}

export async function getUserInteractions(): Promise<Record<string, UserInteraction>> {
  const interactions = await profileStore.getItem<Record<string, UserInteraction>>('user_interactions')
  return interactions || {}
}

export async function saveUserInteraction(wordId: string, action: 'confirm' | 'flag'): Promise<void> {
  const interactions = await getUserInteractions()
  interactions[wordId] = { wordId, action, timestamp: new Date().toISOString() }
  await profileStore.setItem('user_interactions', interactions)
}

export async function hasUserInteracted(wordId: string): Promise<{ hasInteracted: boolean; action?: 'confirm' | 'flag' }> {
  const interactions = await getUserInteractions()
  const interaction = interactions[wordId]
  return { hasInteracted: !!interaction, action: interaction?.action }
}

// Notifications
export interface AppNotification {
  id: string
  type: 'translation_confirmed' | 'story_saved' | 'content_archived' | 'milestone_reached' | 'system'
  title: string
  body: string
  read: boolean
  createdAt: string
  data?: Record<string, string>
}

export async function getNotifications(): Promise<AppNotification[]> {
  const notifications: AppNotification[] = []
  await notificationStore.iterate<AppNotification, void>((value) => {
    notifications.push(value)
  })
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addNotification(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  const newNotification: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  await notificationStore.setItem(newNotification.id, newNotification)
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const notification = await notificationStore.getItem<AppNotification>(notificationId)
  if (notification) {
    notification.read = true
    await notificationStore.setItem(notificationId, notification)
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await notificationStore.iterate<AppNotification, void>(async (value, key) => {
    if (!value.read) {
      value.read = true
      await notificationStore.setItem(key, value)
    }
  })
}

export async function getUnreadNotificationCount(): Promise<number> {
  let count = 0
  await notificationStore.iterate<AppNotification, void>((value) => {
    if (!value.read) count++
  })
  return count
}

export async function clearAllNotifications(): Promise<void> {
  await notificationStore.clear()
}

// Notification Settings
export interface NotificationSettings {
  translationConfirmed: boolean
  storySaved: boolean
  contentArchived: boolean
  milestoneReached: boolean
  systemUpdates: boolean
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  translationConfirmed: true,
  storySaved: true,
  contentArchived: true,
  milestoneReached: true,
  systemUpdates: true,
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const settings = await profileStore.getItem<NotificationSettings>('notification_settings')
  return settings || DEFAULT_NOTIFICATION_SETTINGS
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await profileStore.setItem('notification_settings', settings)
}
