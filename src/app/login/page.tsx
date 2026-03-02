'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=None; Secure`
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchMember } = useMemberStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Apple 신규 회원 — 전화번호 입력 상태
  const [appleSignup, setAppleSignup] = useState<{ tempToken: string; email: string } | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    const tempToken = searchParams.get('apple_temp_token')
    const email = searchParams.get('apple_email')
    if (tempToken && email) {
      setAppleSignup({ tempToken, email })
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams])

  const isPhoneNumber = (value: string) => /^[\d-]+$/.test(value.trim())

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const loginData = isPhoneNumber(identifier)
        ? { phoneNumber: identifier.replace(/-/g, ''), password }
        : { emailAddress: identifier.trim(), password }
      await memberApi.login(loginData)
      router.push('/')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleSignupComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appleSignup) return
    setError('')
    setIsLoading(true)

    try {
      await memberApi.completeAppleSignup({
        tempToken: appleSignup.tempToken,
        phoneNumber: phoneNumber.replace(/-/g, ''),
      })
      await fetchMember()
      toast.success('Apple 회원가입이 완료되었습니다.')
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Apple 회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'kakao' | 'naver' | 'apple') => {
    setError('')
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
      console.error(`${provider} login error:`, err)
      const names: Record<string, string> = { kakao: '카카오', naver: '네이버', apple: 'Apple' }
      setError(`${names[provider]} 로그인에 실패했습니다.`)
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
        </div>

        <div className="p-6 pt-0 space-y-3">
          <Button
            onClick={handleAppleSignupComplete}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading || !phoneNumber}
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

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {/* <Button
              onClick={() => handleSocialLogin('kakao')}
              className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.43 4.68 7.07l-1.23 4.47c-.07.27.18.5.44.4l5.42-2.35c.89.13 1.8.2 2.69.2 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              카카오톡으로 로그인
            </Button> */}

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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-600">
                또는 이메일/휴대전화로 로그인
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="identifier">이메일 또는 휴대전화번호</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="face@ggap.ai 또는 01012345678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-2 h-12"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-12"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <button
              onClick={() => router.push('/forgot-password')}
              className="text-gray-600 text-sm hover:text-indigo-600"
            >
              비밀번호를 잊으셨나요?
            </button>

            <div className="pt-4 border-t">
              <p className="text-gray-600 text-sm mb-3">아직 계정이 없으신가요?</p>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => router.push('/register')}
              >
                회원가입
              </Button>
            </div>
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
