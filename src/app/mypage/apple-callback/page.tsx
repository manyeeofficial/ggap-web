'use client'

import { Suspense } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=None; Secure`
}

function AppleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchMember } = useMemberStore()
  const [isProcessing, setIsProcessing] = useState(true)
  const processedSessionRef = useRef<string | null>(null)

  // Apple 신규 회원 가입 상태
  const [appleSignup, setAppleSignup] = useState<{ tempToken: string; email: string } | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing
  const handleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
  }

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
          router.push('/')
          return
        }

        if (!sessionId) {
          toast.error('Apple 인증 세션이 없습니다.')
          router.push('/')
          return
        }

        const sessionData = await memberApi.getAppleAuthSession(sessionId)

        window.history.replaceState({}, '', window.location.pathname)

        if (!sessionData.requiresPhoneNumber && sessionData.accessToken && sessionData.refreshToken) {
          setCookie('Authorization', sessionData.accessToken, 900)
          setCookie('Refresh-token', sessionData.refreshToken, 1209600)
          await fetchMember()
          toast.success('Apple 로그인 성공')
          router.push('/')
          return
        }

        if (sessionData.requiresPhoneNumber && sessionData.tempToken && sessionData.email) {
          setAppleSignup({ tempToken: sessionData.tempToken, email: sessionData.email })
          setIsProcessing(false)
          return
        }

        toast.error('Apple 인증 처리 중 오류가 발생했습니다.')
        router.push('/')
      } catch (error) {
        console.error('Apple callback error:', error)
        toast.error('Apple 인증 처리 중 오류가 발생했습니다.')
        router.push('/')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAppleCallback()
  }, [searchParams, router, fetchMember])

  const handleAppleSignupComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appleSignup) return
    setIsSubmitting(true)
    try {
      await memberApi.completeAppleSignup({
        tempToken: appleSignup.tempToken,
        phoneNumber: phoneNumber.replace(/-/g, ''),
        agreeMarketing,
      })
      await fetchMember()
      toast.success('Apple 회원가입이 완료되었습니다.')
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Apple 회원가입에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (appleSignup) {
    return (
      <div className="h-full bg-white">
        <div className="p-6 flex items-center border-b">
          <button onClick={() => router.push('/')}>
            <span className="text-sm text-gray-500">취소</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold">Apple 회원가입</h1>
          <div className="w-10" />
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              연결된 이메일: <span className="font-medium text-foreground">{appleSignup.email}</span>
            </p>
          </div>

          <div>
            <Label htmlFor="phoneNumber">휴대전화번호</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="01012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-2 h-12"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox id="appleAgreeAll" checked={agreeAll} onCheckedChange={(v) => handleAgreeAll(!!v)} />
              <label htmlFor="appleAgreeAll" className="font-semibold">전체 동의</label>
            </div>
            <div className="flex items-center space-x-2 pl-4">
              <Checkbox id="appleAgreeTerms" checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
              <label htmlFor="appleAgreeTerms" className="text-sm">(필수) <a href="/terms" target="_blank" className="underline text-indigo-600">이용약관</a> 동의</label>
            </div>
            <div className="flex items-center space-x-2 pl-4">
              <Checkbox id="appleAgreePrivacy" checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(!!v)} />
              <label htmlFor="appleAgreePrivacy" className="text-sm">(필수) <a href="/privacy" target="_blank" className="underline text-indigo-600">개인정보 처리방침</a> 동의</label>
            </div>
            <div className="flex items-center space-x-2 pl-4">
              <Checkbox id="appleAgreeMarketing" checked={agreeMarketing} onCheckedChange={(v) => setAgreeMarketing(!!v)} />
              <label htmlFor="appleAgreeMarketing" className="text-sm">(선택) 마케팅 정보 수신 동의</label>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 space-y-3">
          <Button
            onClick={handleAppleSignupComplete}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
            disabled={isSubmitting || !phoneNumber || !agreeTerms || !agreePrivacy}
          >
            {isSubmitting ? '처리 중...' : '가입 완료'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            onClick={() => router.push('/')}
            disabled={isSubmitting}
          >
            취소
          </Button>
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
