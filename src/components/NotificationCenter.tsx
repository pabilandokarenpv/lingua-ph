'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckCircle, Bookmark, AlertTriangle, Trophy, Info, Trash2 } from 'lucide-react'
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  clearAllNotifications,
  type AppNotification 
} from '@/lib/db'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

const notificationIcons: Record<AppNotification['type'], { icon: typeof Bell; color: string }> = {
  translation_confirmed: { icon: CheckCircle, color: 'text-green-500' },
  story_saved: { icon: Bookmark, color: 'text-orange-500' },
  content_archived: { icon: AlertTriangle, color: 'text-yellow-500' },
  milestone_reached: { icon: Trophy, color: 'text-purple-500' },
  system: { icon: Info, color: 'text-brand' },
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const notifs = await getNotifications()
      setNotifications(notifs)
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    }
    setLoading(false)
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleClearAll() {
    await clearAllNotifications()
    setNotifications([])
  }

  async function handleNotificationClick(notification: AppNotification) {
    if (!notification.read) {
      await markNotificationRead(notification.id)
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      )
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-16 z-50 max-w-md mx-auto"
          >
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-xl max-h-[calc(100vh-180px)]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-white/50" />
                </button>
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/5">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand hover:underline"
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                </div>
              )}

              <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-white/20 mb-3" />
                    <p className="text-gray-500 dark:text-white/50">No notifications yet</p>
                    <p className="text-sm text-gray-400 dark:text-white/30 mt-1">
                      You'll be notified when someone interacts with your contributions
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {notifications.map((notification) => {
                      const { icon: Icon, color } = notificationIcons[notification.type]
                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
                            !notification.read && 'bg-brand/5'
                          )}
                        >
                          <div className={cn('p-2 rounded-xl bg-gray-100 dark:bg-white/10', color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                'text-sm text-gray-900 dark:text-white',
                                !notification.read && 'font-medium'
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
