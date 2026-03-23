'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const goOnline = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] glass border-b border-yellow-400/20 dark:border-yellow-500/20">
      <div className="max-w-[430px] mx-auto px-4 py-2.5 flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Offline</span>
        <span className="text-gray-500 dark:text-white/40 text-sm">— showing saved content</span>
      </div>
    </div>
  )
}
