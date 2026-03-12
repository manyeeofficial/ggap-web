'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import axios from 'axios'
import { deleteCookies } from '@/lib/api/client'

const PUBLIC_PATHS = ['/', '/onboarding', '/login', '/forgot-password', '/register', '/mypage/apple-callback', '/auth/naver', '/auth/kakao', '/terms', '/privacy']

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp('(?:^|; )' + escapedName + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function getDomainStr(): string {
  if (typeof window === 'undefined') return ''
  return window.location.hostname.endsWith('ggap.ai') ? '; domain=.ggap.ai' : ''
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax${getDomainStr()}`
}

// 30초 여유를 두어 만료 임박 시에도 갱신
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now() + 30 * 1000
  } catch {
    return true
  }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  const isPublicPage = PUBLIC_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  )

  useEffect(() => {
    if (isPublicPage) {
      setAuthorized(true)
      return
    }

    const accessToken = getCookie('Authorization')
    if (accessToken && !isTokenExpired(accessToken)) {
      setAuthorized(true)
      return
    }

    // accessToken이 없거나 만료된 경우 refreshToken으로 재발급 시도
    const refreshToken = getCookie('Refresh-token')
    if (!refreshToken) {
      router.replace('/login')
      return
    }

    axios
      .post(`${BASE_URL}/member/refresh-token`, null, {
        headers: { 'Refresh-Token': refreshToken },
        withCredentials: true,
      })
      .then((response) => {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data
        if (newAccessToken) setCookie('Authorization', newAccessToken, 900)
        if (newRefreshToken) setCookie('Refresh-token', newRefreshToken, 1209600)
        setAuthorized(true)
      })
      .catch(() => {
        deleteCookies()
        router.replace('/login')
      })
  }, [pathname])

  if (isPublicPage) {
    return <>{children}</>
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
