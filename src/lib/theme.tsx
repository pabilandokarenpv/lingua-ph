'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  resolved: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemPreference()
  return theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('lingua-ph-theme') as Theme | null
    const initial = stored ?? 'light'
    setThemeState(initial)
    setResolved(resolve(initial))
  }, [])

  useEffect(() => {
    const r = resolve(theme)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
    localStorage.setItem('lingua-ph-theme', theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = resolve('system')
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const r = resolve(prev)
      return r === 'light' ? 'dark' : 'light'
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
