'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { skinProfileApi } from '@/lib/api'
import type { SkinProfile } from '@/lib/types'

interface SkinProfileStore {
  profile: SkinProfile | null
  isLoaded: boolean
  fetchProfile: () => Promise<void>
  updateProfile: (data: SkinProfile) => void
  clearProfile: () => void
}

const SkinProfileContext = createContext<SkinProfileStore | null>(null)

export function SkinProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SkinProfile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const data = await skinProfileApi.get()
      setProfile(data)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const updateProfile = useCallback((data: SkinProfile) => {
    setProfile(data)
  }, [])

  const clearProfile = useCallback(() => {
    setProfile(null)
    setIsLoaded(false)
  }, [])

  return (
    <SkinProfileContext.Provider value={{ profile, isLoaded, fetchProfile, updateProfile, clearProfile }}>
      {children}
    </SkinProfileContext.Provider>
  )
}

export function useSkinProfileStore() {
  const context = useContext(SkinProfileContext)
  if (!context) {
    throw new Error('useSkinProfileStore must be used within SkinProfileProvider')
  }
  return context
}
