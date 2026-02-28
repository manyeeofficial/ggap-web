'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { memberApi } from '@/lib/api'
import type { Member } from '@/lib/types'

interface MemberStore {
  member: Member | null
  isLoaded: boolean
  fetchMember: () => Promise<void>
  updateMember: (data: Member) => void
  clearMember: () => void
}

const MemberContext = createContext<MemberStore | null>(null)

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchMember = useCallback(async () => {
    try {
      const data = await memberApi.getMe()
      setMember(data)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const updateMember = useCallback((data: Member) => {
    setMember(data)
  }, [])

  const clearMember = useCallback(() => {
    setMember(null)
    setIsLoaded(false)
  }, [])

  return (
    <MemberContext.Provider value={{ member, isLoaded, fetchMember, updateMember, clearMember }}>
      {children}
    </MemberContext.Provider>
  )
}

export function useMemberStore() {
  const context = useContext(MemberContext)
  if (!context) {
    throw new Error('useMemberStore must be used within MemberProvider')
  }
  return context
}
