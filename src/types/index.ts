export interface Language {
  id: string
  name: string
  region: string
  province: string
  speakerCount: number
  wordCount: number
  status: 'critical' | 'growing' | 'active'
  description: string
  coverColor: string
  contributors: number
  learners: number
}

export interface WordEntry {
  id: string
  languageId: string
  word: string
  phonetic: string
  translation: string
  translationFilipino: string
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'phrase' | 'greeting' | 'other'
  category: string
  exampleSentence?: string
  exampleTranslation?: string
  culturalNote?: string
  audioBlob?: string
  publishedBy?: string
  publishedAt: string
  confirmedCount: number
  flagCount: number
  status: 'unverified' | 'pending' | 'confirmed' | 'flagged'
}

export interface Story {
  id: string
  languageId: string
  title: string
  titleTranslation: string
  content: string
  contentTranslation: string
  audioBlob?: string
  category: 'origin' | 'legend' | 'custom' | 'history' | 'oral_history'
  narratedBy: string
  recordedBy: string
  publishedAt: string
  duration?: string
}

export interface UserProfile {
  displayName: string
  phoneNumber: string
  languagesContributing: string[]
  languagesLearning: string[]
  wordsRecorded: number
  wordsConfirmed: number
  storiesShared: number
  totalPlays: number
  learningProgress: Record<string, number>
  streak: number
  lastActiveDate: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  wordReference?: string
}

export interface CommunityPost {
  id: string
  languageId: string
  authorName: string
  content: string
  contentTranslation: string
  type: 'text' | 'voice' | 'word_of_day' | 'milestone' | 'question'
  audioBlob?: string
  likes: number
  publishedAt: string
}
