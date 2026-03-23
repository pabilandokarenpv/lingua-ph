'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import localforage from 'localforage'

export interface User {
  id: string
  name: string
  email: string
  image?: string
  provider: 'google' | 'facebook' | 'email' | 'demo'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (provider: 'google' | 'facebook' | 'email' | 'demo', email?: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authStore = localforage.createInstance({ name: 'lingua-auth' })

const DEMO_USER: User = {
  id: 'demo-user-001',
  name: 'Demo User',
  email: 'demo@linguaph.app',
  image: undefined,
  provider: 'demo',
  createdAt: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const storedUser = await authStore.getItem<User>('current_user')
      if (storedUser) {
        setUser(storedUser)
      } else {
        await authStore.setItem('current_user', DEMO_USER)
        setUser(DEMO_USER)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      setUser(DEMO_USER)
    } finally {
      setIsLoading(false)
    }
  }

  async function login(provider: 'google' | 'facebook' | 'email' | 'demo', email?: string) {
    setIsLoading(true)
    try {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: email ? email.split('@')[0] : 'Demo User',
        email: email || 'demo@linguaph.app',
        provider,
        createdAt: new Date().toISOString(),
      }
      await authStore.setItem('current_user', newUser)
      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    await authStore.removeItem('current_user')
    await authStore.setItem('current_user', DEMO_USER)
    setUser(DEMO_USER)
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return
    const updatedUser = { ...user, ...updates }
    await authStore.setItem('current_user', updatedUser)
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
