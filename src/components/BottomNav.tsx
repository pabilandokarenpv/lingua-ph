'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Plus, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dictionary/manobo-davao', icon: BookOpen, label: 'Dictionary', matchPrefix: '/dictionary' },
  { href: '/contribute', icon: Plus, label: 'Add', isCenter: true },
  { href: '/learn', icon: MessageCircle, label: 'Learn' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[430px] mx-auto px-3 pb-2">
        <div className="glass-nav rounded-2xl border border-gray-200 dark:border-white/[0.06] px-2 py-1.5">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.matchPrefix && pathname?.startsWith(item.matchPrefix))

              if (item.isCenter) {
                return (
                  <Link key={item.href} href={item.href} className="relative -mt-6">
                    <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 bg-brand shadow-brand/30">
                      <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 py-2 px-3"
                >
                  <item.icon
                    className={`w-[22px] h-[22px] transition-colors duration-300 ${
                      isActive ? 'text-brand' : 'text-gray-400 dark:text-white/40'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className={`text-[10px] font-medium transition-colors duration-300 ${
                    isActive ? 'text-brand' : 'text-gray-400 dark:text-white/40'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
