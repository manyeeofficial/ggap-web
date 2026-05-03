'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchMember } = useMemberStore()
  const [isLoading, setIsLoading] = useState(false)

  // Apple 신규 회원 — 전화번호 입력 상태
  const [appleSignup, setAppleSignup] = useState<{ tempToken: string; email: string } | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const appleAgreeAll = agreeTerms && agreePrivacy && agreeMarketing
  const handleAppleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
  }

  useEffect(() => {
    const tempToken = searchParams.get('apple_temp_token')
    const email = searchParams.get('apple_email')
    if (tempToken && email) {
      setAppleSignup({ tempToken, email })
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams])

  const handleAppleSignupComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appleSignup) return
    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'kakao' | 'naver' | 'apple') => {
    try {
      let authUrl: string
      if (provider === 'kakao') {
        authUrl = await memberApi.getKakaoSigninUrl()
      } else if (provider === 'naver') {
        authUrl = await memberApi.getNaverSigninUrl()
      } else {
        authUrl = await memberApi.getAppleSigninUrl()
      }
      window.location.href = authUrl
    } catch (err: any) {
      const names: Record<string, string> = { kakao: '카카오', naver: '네이버', apple: 'Apple' }
      toast.error(`${names[provider]} 로그인에 실패했습니다.`)
    }
  }

  if (appleSignup) {
    return (
      <div className="h-full bg-white">
        <div className="p-6 flex items-center border-b">
          <button onClick={() => setAppleSignup(null)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold">Apple 회원가입</h1>
          <div className="w-6" />
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox id="appleAgreeAll" checked={appleAgreeAll} onCheckedChange={(v) => handleAppleAgreeAll(!!v)} />
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
            disabled={isLoading || !phoneNumber || !agreeTerms || !agreePrivacy}
          >
            {isLoading ? '처리 중...' : '가입 완료'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            onClick={() => setAppleSignup(null)}
            disabled={isLoading}
          >
            취소
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* 히어로 문구 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              로그인하고 <span className="text-indigo-600">얼굴값 췍! 🔥</span>
            </h1>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialLogin('kakao')}
              className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.43 4.68 7.07l-1.23 4.47c-.07.27.18.5.44.4l5.42-2.35c.89.13 1.8.2 2.69.2 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              카카오톡으로 로그인
            </Button>

            <Button
              onClick={() => handleSocialLogin('naver')}
              className="w-full h-12 bg-[#03C75A] hover:bg-[#02B350] text-white"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              네이버로 로그인
            </Button>

            {/* <Button
              onClick={() => handleSocialLogin('apple')}
              className="w-full h-12 bg-black hover:bg-gray-800 text-white"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple로 로그인
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
