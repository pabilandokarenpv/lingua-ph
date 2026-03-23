// Simple language detection based on common patterns and word matching
// This is a fallback when AI detection is not available

export function detectLanguageFromText(text: string): { language: string; confidence: number } {
  const lower = text.toLowerCase().trim()
  
  // Common language patterns
  const patterns: Record<string, string[]> = {
    'Manobo': ['danum', 'langit', 'maayong', 'buntag', 'amoy', 'inoy', 'humay', 'kan-on', 'suba', 'diwata'],
    'Tausug': ['marayaw', 'dagat', 'assalam', 'alaikum', 'sulu', 'bichara'],
    'Ivatan': ['aya', 'vakul', 'kamacha', 'batanes', 'panahon', 'voyavoy'],
    'Ibaloi': ['ambe', 'biing', 'benguet', 'kangdan', 'shontog'],
    'Waray': ['maupay', 'kamusta', 'samar', 'leyte', 'kumusta'],
    'Higaonon': ['tagbabai', 'bukidnon', 'misamis', 'hinigaonon'],
    'Kalagan': ['kalagan', 'davao', 'tagakalagan'],
    'Subanen': ['subanen', 'zamboanga', 'sobay'],
  }
  
  let bestMatch = { language: 'Unknown', confidence: 0 }
  
  for (const [lang, words] of Object.entries(patterns)) {
    const matches = words.filter(word => lower.includes(word)).length
    const confidence = (matches / words.length) * 100
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { language: lang, confidence: Math.round(confidence) }
    }
  }
  
  return bestMatch
}

export function getLanguageIdFromName(name: string): string | null {
  const mapping: Record<string, string> = {
    'manobo': 'manobo-davao',
    'tausug': 'tausug-sulu',
    'higaonon': 'higaonon-misamis',
    'ibaloi': 'ibaloi-benguet',
    'waray': 'waray-samar',
    'ivatan': 'ivatan-batanes',
    'kalagan': 'kalagan-davao',
    'subanen': 'subanen-zamboanga',
  }
  
  const lower = name.toLowerCase()
  return mapping[lower] || null
}
