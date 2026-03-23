export async function chatWithOllama(
  messages: Array<{ role: string; content: string }>,
  vocabulary: Array<{ word: string; translation: string; language: string; partOfSpeech?: string; category?: string }>
): Promise<string> {
  const vocabContext = vocabulary
    .slice(0, 50) // limit context
    .map(v => `- "${v.word}" means "${v.translation}" in ${v.language}`)
    .join('\n')

  const systemPrompt = `You are Lingua PH — a warm, encouraging AI language companion that helps people learn Philippine indigenous languages.

You ONLY teach words and phrases that are in the community's validated vocabulary database below. Do not invent or guess words.

VALIDATED VOCABULARY:
${vocabContext}

Rules:
1. Only use words from the vocabulary above
2. If asked about a word not in the database, say "That word hasn't been documented yet. Would you like to help contribute it?"
3. Always include the word in the native language when teaching
4. Be warm, encouraging, and celebrate every small win
5. Keep responses concise — 2-4 sentences max
6. Suggest pronunciation practice when teaching a new word
7. If someone wants to contribute a word, guide them through: the word → its meaning → an example sentence → the language it belongs to
8. Do NOT use emojis in your responses`

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    })

    if (!response.ok) throw new Error('Ollama not available')
    const data = await response.json()
    return data.message?.content || "I'm having trouble connecting. Try again in a moment."
  } catch {
    // Fallback when Ollama is not running
    return generateFallbackResponse(messages[messages.length - 1]?.content || '', vocabulary)
  }
}

function generateFallbackResponse(
  userMessage: string,
  vocabulary: Array<{ word: string; translation: string; language: string; partOfSpeech?: string; category?: string }>
): string {
  const lower = userMessage.toLowerCase()
  
  // Search vocabulary for relevant word
  const match = vocabulary.find(v => 
    lower.includes(v.translation.toLowerCase()) || 
    lower.includes(v.word.toLowerCase())
  )

  if (match) {
    return `In ${match.language}, the word is "${match.word}" (${match.translation}). Try practicing its pronunciation by tapping the microphone.`
  }

  if (lower.includes('hello') || lower.includes('greet') || lower.includes('hi')) {
    const greeting = vocabulary.find(v => v.partOfSpeech === 'greeting' || v.category === 'Greetings')
    if (greeting) {
      return `Here's a greeting: "${greeting.word}" means "${greeting.translation}". Tap to hear how it's pronounced.`
    }
  }

  return `I'm currently in offline mode with limited vocabulary. Browse the dictionary to see all documented words, or contribute a new one.`
}
