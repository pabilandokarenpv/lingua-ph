// Cache for Filipino voice
let cachedFilipinoVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

// Find the best Filipino/Tagalog voice available
function getFilipinoVoice(): SpeechSynthesisVoice | null {
  if (cachedFilipinoVoice) return cachedFilipinoVoice
  
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return null
  
  // Priority order for Filipino voices
  const filipinoPatterns = [
    /fil-PH/i,           // Filipino (Philippines)
    /tl-PH/i,            // Tagalog (Philippines)
    /Filipino/i,         // Any voice with "Filipino" in name
    /Tagalog/i,          // Any voice with "Tagalog" in name
    /Philippines/i,      // Any voice mentioning Philippines
  ]
  
  for (const pattern of filipinoPatterns) {
    const match = voices.find(v => 
      pattern.test(v.lang) || pattern.test(v.name)
    )
    if (match) {
      cachedFilipinoVoice = match
      return match
    }
  }
  
  // Fallback: Try to find any Asian voice that might sound closer
  const asianVoice = voices.find(v => 
    /id-ID|ms-MY|vi-VN/i.test(v.lang) // Indonesian, Malay, Vietnamese - similar phonetics
  )
  if (asianVoice) {
    cachedFilipinoVoice = asianVoice
    return asianVoice
  }
  
  return null
}

// Initialize voices (they load asynchronously in some browsers)
function initVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (voicesLoaded || speechSynthesis.getVoices().length > 0) {
      voicesLoaded = true
      resolve()
      return
    }
    
    speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true
      resolve()
    }
    
    // Timeout fallback
    setTimeout(() => {
      voicesLoaded = true
      resolve()
    }, 1000)
  })
}

// Text to speech — reads a word aloud with Filipino accent
export async function speakWord(text: string, lang: string = 'fil-PH'): Promise<void> {
  if (!('speechSynthesis' in window)) return
  
  // Wait for voices to load
  await initVoices()
  
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  
  // Try to get Filipino voice
  const filipinoVoice = getFilipinoVoice()
  
  if (filipinoVoice) {
    utterance.voice = filipinoVoice
    utterance.lang = filipinoVoice.lang
  } else {
    // Fallback to Filipino language code
    utterance.lang = lang
  }
  
  // Adjust for more natural Filipino pronunciation
  // Slower rate helps with syllable-timed languages like Filipino
  utterance.rate = 0.85
  // Slightly higher pitch is more natural for Filipino
  utterance.pitch = 1.05
  // Full volume
  utterance.volume = 1
  
  speechSynthesis.speak(utterance)
}

// Start recording with Web Speech API (returns transcript)
export function startSpeechRecognition(
  onTranscript: (text: string) => void,
  onEnd: () => void
): typeof SpeechRecognition.prototype | null {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = 'tl-PH' // Filipino as base, will capture indigenous phonemes too

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('')
    onTranscript(transcript)
  }

  recognition.onend = onEnd
  recognition.start()
  return recognition
}

// Get supported audio MIME type (iOS compatible)
function getSupportedMimeType(): string {
  const types = [
    'audio/mp4',
    'audio/aac', 
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ]
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return '' // Let browser choose default
}

// Record audio as blob for storage
export async function startAudioRecording(
  onStop: (audioBlob: Blob) => void
): Promise<MediaRecorder | null> {
  if (!navigator.mediaDevices) return null

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    const mimeType = getSupportedMimeType()
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
    const mediaRecorder = new MediaRecorder(stream, options)
    const audioChunks: BlobPart[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const actualMimeType = mediaRecorder.mimeType || 'audio/mp4'
      const audioBlob = new Blob(audioChunks, { type: actualMimeType })
      onStop(audioBlob)
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start(100) // Collect data every 100ms for better compatibility
    
    // Auto-stop after 2 minutes max
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') mediaRecorder.stop()
    }, 120000)

    return mediaRecorder
  } catch (error) {
    console.error('Error accessing microphone:', error)
    return null
  }
}

// Convert blob to base64 for storage
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Play stored audio from base64 (cross-platform compatible)
export async function playStoredAudio(base64Audio: string): Promise<void> {
  const audio = new Audio()
  audio.src = base64Audio
  audio.preload = 'auto'
  
  // iOS requires load() before play()
  audio.load()
  
  try {
    await audio.play()
  } catch (err) {
    console.error('Audio playback failed:', err)
  }
}

// Simple pronunciation similarity score (0-100)
export function comparePronunciation(original: string, attempt: string): number {
  const orig = original.toLowerCase().replace(/[^a-z]/g, '')
  const att = attempt.toLowerCase().replace(/[^a-z]/g, '')
  
  if (!orig || !att) return 0
  
  let matches = 0
  const shorter = Math.min(orig.length, att.length)
  
  for (let i = 0; i < shorter; i++) {
    if (orig[i] === att[i]) matches++
  }
  
  return Math.round((matches / Math.max(orig.length, att.length)) * 100)
}
