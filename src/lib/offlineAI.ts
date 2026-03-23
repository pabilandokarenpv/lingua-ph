import Fuse from 'fuse.js'
import { getAllLanguages, getWordsByLanguage, getAllWords } from './db'
import type { Language, WordEntry } from '@/types'

interface Intent {
  type: 'translate' | 'define' | 'list' | 'stats' | 'languages' | 'search' | 'greeting' | 'help'
  params: Record<string, string>
}

const INTENT_PATTERNS: Array<{ pattern: RegExp; type: Intent['type']; extract?: string[] }> = [
  { pattern: /^(hi|hello|hey|kumusta|magandang|good\s*(morning|afternoon|evening))/i, type: 'greeting' },
  { pattern: /^(help|what can you do|how do i use)/i, type: 'help' },
  { pattern: /what is (.+) in (.+)/i, type: 'translate', extract: ['word', 'language'] },
  { pattern: /how do you say (.+) in (.+)/i, type: 'translate', extract: ['word', 'language'] },
  { pattern: /translate (.+) to (.+)/i, type: 'translate', extract: ['word', 'language'] },
  { pattern: /(.+) in (.+) language/i, type: 'translate', extract: ['word', 'language'] },
  { pattern: /meaning of (.+)/i, type: 'define', extract: ['word'] },
  { pattern: /what does (.+) mean/i, type: 'define', extract: ['word'] },
  { pattern: /define (.+)/i, type: 'define', extract: ['word'] },
  { pattern: /words in (.+)/i, type: 'list', extract: ['language'] },
  { pattern: /list (.+) words/i, type: 'list', extract: ['language'] },
  { pattern: /show me (.+) vocabulary/i, type: 'list', extract: ['language'] },
  { pattern: /how many (words|languages)/i, type: 'stats' },
  { pattern: /statistics|stats/i, type: 'stats' },
  { pattern: /what languages|which languages|available languages/i, type: 'languages' },
]

function parseIntent(query: string): Intent {
  const normalizedQuery = query.trim().toLowerCase()
  
  for (const { pattern, type, extract } of INTENT_PATTERNS) {
    const match = normalizedQuery.match(pattern)
    if (match) {
      const params: Record<string, string> = {}
      if (extract) {
        extract.forEach((key, i) => {
          if (match[i + 1]) {
            params[key] = match[i + 1].trim()
          }
        })
      }
      return { type, params }
    }
  }
  
  return { type: 'search', params: { query: normalizedQuery } }
}

async function findLanguageByName(name: string): Promise<Language | null> {
  const languages = await getAllLanguages()
  const normalizedName = name.toLowerCase().trim()
  
  const exactMatch = languages.find(l => 
    l.name.toLowerCase() === normalizedName ||
    l.id.toLowerCase().includes(normalizedName)
  )
  if (exactMatch) return exactMatch
  
  const partialMatch = languages.find(l =>
    l.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(l.name.toLowerCase())
  )
  return partialMatch || null
}

async function searchDictionary(query: string, languageId?: string): Promise<WordEntry[]> {
  let words: WordEntry[]
  
  if (languageId) {
    words = await getWordsByLanguage(languageId)
  } else {
    words = await getAllWords()
  }
  
  if (words.length === 0) return []
  
  const fuse = new Fuse(words, {
    keys: [
      { name: 'word', weight: 2 },
      { name: 'translation', weight: 1.5 },
      { name: 'translationFilipino', weight: 1.5 },
      { name: 'category', weight: 0.5 },
    ],
    threshold: 0.4,
    includeScore: true,
  })
  
  const results = fuse.search(query)
  return results.slice(0, 5).map(r => r.item)
}

export async function offlineChat(userMessage: string, selectedLanguageId?: string): Promise<string> {
  const intent = parseIntent(userMessage)
  const languages = await getAllLanguages()
  
  switch (intent.type) {
    case 'greeting': {
      return `Kumusta! I'm your Lingua PH assistant. I can help you learn Philippine indigenous languages using our dictionary. Try asking me:\n\n- "What is water in Ilocano?"\n- "Show me Tboli words"\n- "What languages are available?"\n\nWhat would you like to learn today?`
    }
    
    case 'help': {
      return `I can help you with:\n\n**Translations**\n- "What is mother in Tboli?"\n- "How do you say hello in Ilocano?"\n\n**Dictionary Search**\n- "Meaning of danum"\n- "Show me Cebuano words"\n\n**Information**\n- "What languages are available?"\n- "How many words are documented?"\n\nJust ask naturally and I'll search our dictionary!`
    }
    
    case 'translate': {
      const { word, language } = intent.params
      if (!word || !language) {
        return `I need both a word and a language. Try: "What is water in Ilocano?"`
      }
      
      const lang = await findLanguageByName(language)
      if (!lang) {
        const availableLangs = languages.slice(0, 5).map(l => l.name).join(', ')
        return `I couldn't find a language matching "${language}". Available languages include: ${availableLangs}...`
      }
      
      const results = await searchDictionary(word, lang.id)
      if (results.length === 0) {
        return `I couldn't find "${word}" in ${lang.name} yet. This word may not have been documented. You can help by contributing it in the Contribute section!`
      }
      
      const match = results[0]
      let response = `In **${lang.name}**, "${word}" is **"${match.word}"**`
      if (match.phonetic) response += ` (pronounced: ${match.phonetic})`
      response += `.\n\nTranslation: ${match.translation}`
      if (match.translationFilipino) response += ` / ${match.translationFilipino}`
      if (match.exampleSentence) {
        response += `\n\nExample: "${match.exampleSentence}"`
        if (match.exampleTranslation) response += `\n(${match.exampleTranslation})`
      }
      if (match.culturalNote) {
        response += `\n\nCultural note: ${match.culturalNote}`
      }
      
      return response
    }
    
    case 'define': {
      const { word } = intent.params
      if (!word) {
        return `What word would you like me to define?`
      }
      
      const results = await searchDictionary(word, selectedLanguageId)
      if (results.length === 0) {
        return `I couldn't find "${word}" in the dictionary. Try browsing the dictionary directly or contribute this word if you know it!`
      }
      
      const match = results[0]
      const lang = languages.find(l => l.id === match.languageId)
      let response = `**${match.word}** (${lang?.name || 'Unknown language'})\n\n`
      response += `Meaning: ${match.translation}`
      if (match.translationFilipino) response += ` / ${match.translationFilipino}`
      response += `\nCategory: ${match.category}`
      response += `\nPart of speech: ${match.partOfSpeech}`
      if (match.phonetic) response += `\nPronunciation: ${match.phonetic}`
      if (match.exampleSentence) {
        response += `\n\nExample: "${match.exampleSentence}"`
      }
      if (match.culturalNote) {
        response += `\n\nCultural note: ${match.culturalNote}`
      }
      
      return response
    }
    
    case 'list': {
      const { language } = intent.params
      if (!language) {
        return `Which language would you like to see words from? Try: "Show me Ilocano words"`
      }
      
      const lang = await findLanguageByName(language)
      if (!lang) {
        return `I couldn't find a language matching "${language}". Try checking the Dictionary section for available languages.`
      }
      
      const words = await getWordsByLanguage(lang.id)
      if (words.length === 0) {
        return `${lang.name} doesn't have any documented words yet. Be the first to contribute!`
      }
      
      const wordList = words.slice(0, 8).map(w => `- **${w.word}**: ${w.translation}`).join('\n')
      return `Here are some **${lang.name}** words:\n\n${wordList}\n\n${words.length > 8 ? `...and ${words.length - 8} more. Check the Dictionary for the full list!` : ''}`
    }
    
    case 'stats': {
      const totalWords = languages.reduce((sum, l) => sum + (l.wordCount || 0), 0)
      const totalContributors = languages.reduce((sum, l) => sum + (l.contributors || 0), 0)
      
      return `**Lingua PH Statistics**\n\n- ${languages.length} languages documented\n- ${totalWords} words preserved\n- ${totalContributors} contributors\n\nHelp us grow by contributing words and translations!`
    }
    
    case 'languages': {
      const langList = languages.slice(0, 10).map(l => `- **${l.name}** (${l.region}) - ${l.wordCount || 0} words`).join('\n')
      return `**Available Languages**\n\n${langList}\n\n${languages.length > 10 ? `...and ${languages.length - 10} more languages. Browse the Dictionary to see all!` : ''}`
    }
    
    case 'search':
    default: {
      const results = await searchDictionary(intent.params.query || userMessage, selectedLanguageId)
      
      if (results.length === 0) {
        return `I searched the dictionary but couldn't find anything matching "${userMessage}". Try:\n\n- "What is [word] in [language]?"\n- "Meaning of [word]"\n- "What languages are available?"\n\nOr browse the Dictionary directly!`
      }
      
      const matchList = results.map(r => {
        const lang = languages.find(l => l.id === r.languageId)
        return `- **${r.word}** (${lang?.name || 'Unknown'}): ${r.translation}`
      }).join('\n')
      
      return `I found these matches:\n\n${matchList}\n\nWant to know more about any of these? Just ask!`
    }
  }
}

export async function hybridChat(
  userMessage: string, 
  selectedLanguageId?: string
): Promise<{ response: string; isOffline: boolean }> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  
  if (!isOnline) {
    const response = await offlineChat(userMessage, selectedLanguageId)
    return { response, isOffline: true }
  }
  
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, languageId: selectedLanguageId }),
    })
    
    if (res.ok) {
      const data = await res.json()
      return { response: data.response, isOffline: false }
    }
    
    const offlineResponse = await offlineChat(userMessage, selectedLanguageId)
    return { response: offlineResponse, isOffline: true }
  } catch {
    const offlineResponse = await offlineChat(userMessage, selectedLanguageId)
    return { response: offlineResponse, isOffline: true }
  }
}
