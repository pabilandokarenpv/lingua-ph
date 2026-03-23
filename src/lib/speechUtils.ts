// Text to speech — reads a word aloud
export function speakWord(text: string, lang: string = 'tl-PH'): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.8
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
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

// Play stored audio from base64
export function playStoredAudio(base64Audio: string): void {
  const audio = new Audio(base64Audio)
  audio.play()
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
