'use client'

import { useEffect } from 'react'

export function VoicePreloader() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    
    // Trigger voice loading
    speechSynthesis.getVoices()
    
    // Some browsers need the onvoiceschanged event
    speechSynthesis.onvoiceschanged = () => {
      // Voices are now loaded - find Filipino voice for cache warming
      const voices = speechSynthesis.getVoices()
      const filipinoVoice = voices.find(v => 
        /fil|tl|Filipino|Tagalog|Philippines/i.test(v.lang) || 
        /fil|tl|Filipino|Tagalog|Philippines/i.test(v.name)
      )
      
      if (filipinoVoice) {
        console.log('Filipino voice available:', filipinoVoice.name)
      }
    }
  }, [])
  
  return null
}
