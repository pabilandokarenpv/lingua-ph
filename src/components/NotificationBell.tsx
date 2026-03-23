'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { getUnreadNotificationCount } from '@/lib/db'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    loadUnreadCount()
  }, [])

  async function loadUnreadCount() {
    const count = await getUnreadNotificationCount()
    setUnreadCount(count)
  }

  return (
    <>
      <button
        onClick={() => setShowNotifications(true)}
        className="relative p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false)
          loadUnreadCount()
        }} 
      />
    </>
  )
}
