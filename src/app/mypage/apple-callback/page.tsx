'use client'

import { Suspense } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=None; Secure`
}

function AppleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchMember } = useMemberStore()
  const [isProcessing, setIsProcessing] = useState(true)
  const processedSessionRef = useRef<string | null>(null)

  useEffect(() => {
    const handleAppleCallback = async () => {
      try {
        const sessionId = searchParams.get('session')
        const error = searchParams.get('error')

        if (sessionId && processedSessionRef.current === sessionId) {
          return
        }

        if (sessionId) {
          processedSessionRef.current = sessionId
        }

        if (error) {
          toast.error(decodeURIComponent(error))
          router.push('/login')
          return
        }

        if (!sessionId) {
          toast.error('Apple 인증 세션이 없습니다.')
          router.push('/login')
          return
        }

        const sessionData = await memberApi.getAppleAuthSession(sessionId)

        window.history.replaceState({}, '', window.location.pathname)

        if (!sessionData.requiresPhoneNumber && sessionData.accessToken && sessionData.refreshToken) {
          // 기존 회원 로그인 성공
          setCookie('Authorization', sessionData.accessToken, 900)
          setCookie('Refresh-token', sessionData.refreshToken, 1209600)

          await fetchMember()
          toast.success('Apple 로그인 성공')
          router.push('/')
          return
        }

        if (sessionData.requiresPhoneNumber && sessionData.tempToken && sessionData.email) {
          // 신규 회원 — 전화번호 입력 필요
          const signupUrl = `/login?apple_temp_token=${encodeURIComponent(sessionData.tempToken)}&apple_email=${encodeURIComponent(sessionData.email)}`
          router.push(signupUrl)
          return
        }

        toast.error('Apple 인증 처리 중 오류가 발생했습니다.')
        router.push('/login')
      } catch (error) {
        console.error('Apple callback error:', error)
        toast.error('Apple 인증 처리 중 오류가 발생했습니다.')
        router.push('/login')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAppleCallback()
  }, [searchParams, router, fetchMember])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Apple 로그인 처리 중...</p>
        </div>
      </div>
    )
  }

  return null
}

export default function AppleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      }
    >
      <AppleCallbackContent />
    </Suspense>
  )
}
