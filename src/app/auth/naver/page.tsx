'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { MobileCarrier } from '@/lib/types'

function NaverCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchMember } = useMemberStore()

  const [status, setStatus] = useState<'processing' | 'phone'>('processing')
  const [tempToken, setTempToken] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mobileCarrier, setMobileCarrier] = useState<MobileCarrier | ''>('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('')
  const [naverAccessToken, setNaverAccessToken] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const hasProcessed = useRef(false)

  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing
  const handleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
  }

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code) {
      toast.error('네이버 인증 코드가 없습니다.')
      router.replace('/login')
      return
    }

    memberApi.naverCallback(code, state ?? undefined)
      .then(async (result) => {
        if (result.requiresPhoneNumber) {
          setTempToken(result.tempToken!)
          setEmail(result.email!)
          setNaverAccessToken(result.naverAccessToken ?? '')
          setProfileImageUrl(result.profileImageUrl ?? '')
          setStatus('phone')
        } else {
          await fetchMember()
          router.replace('/')
        }
      })
      .catch((err) => {
        console.error('Naver callback error:', err)
        toast.error(err.response?.data?.message || '네이버 로그인에 실패했습니다.')
        router.replace('/login')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompleteSignup = async () => {
    setIsLoading(true)
    try {
      await memberApi.naverCompleteSignup({
        tempToken,
        phoneNumber: phoneNumber.replace(/-/g, ''),
        mobileCarrier: mobileCarrier || undefined,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        gender: gender || undefined,
        naverAccessToken: naverAccessToken || undefined,
        agreeMarketing,
        profileImageUrl: profileImageUrl || undefined,
      })
      await fetchMember()
      toast.success('네이버 회원가입이 완료되었습니다.')
      router.replace('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">네이버 로그인 처리 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 flex items-center border-b">
        <button onClick={() => router.replace('/login')}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">네이버 회원가입</h1>
        <div className="w-6" />
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            연결된 이메일: <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div>
          <Label htmlFor="phoneNumber">휴대전화번호 <span className="text-red-500">*</span></Label>
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

        <div>
          <Label>이동통신사</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'SKT', value: 'SKT' as const },
              { label: 'KT', value: 'KT' as const },
              { label: 'LGU+', value: 'LGU' as const },
              { label: 'SKT 알뜰폰', value: 'SKT_MVNO' as const },
              { label: 'KT 알뜰폰', value: 'KT_MVNO' as const },
              { label: 'LGU+ 알뜰폰', value: 'LGU_MVNO' as const },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setMobileCarrier(c.value)}
                className={`h-12 rounded-md border-2 text-sm transition-colors ${
                  mobileCarrier === c.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="birthYear">출생년도</Label>
          <select
            id="birthYear"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="mt-2 w-full h-12 px-3 border rounded-md"
            disabled={isLoading}
          >
            <option value="">선택하세요</option>
            {Array.from({ length: 61 }, (_, i) => 2010 - i).map((year) => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>

        <div>
          <Label>성별</Label>
          <div className="flex gap-3 mt-2">
            {[
              { label: '여성', value: 'FEMALE' as const },
              { label: '남성', value: 'MALE' as const },
              { label: '선택안함', value: 'OTHER' as const },
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={`flex-1 h-12 rounded-md border-2 transition-colors ${
                  gender === g.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox id="agreeAll" checked={agreeAll} onCheckedChange={(v) => handleAgreeAll(!!v)} />
            <label htmlFor="agreeAll" className="font-semibold">전체 동의</label>
          </div>
          <div className="flex items-center space-x-2 pl-4">
            <Checkbox id="agreeTerms" checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
            <label htmlFor="agreeTerms" className="text-sm">(필수) 이용약관 동의</label>
          </div>
          <div className="flex items-center space-x-2 pl-4">
            <Checkbox id="agreePrivacy" checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(!!v)} />
            <label htmlFor="agreePrivacy" className="text-sm">(필수) 개인정보 처리방침 동의</label>
          </div>
          <div className="flex items-center space-x-2 pl-4">
            <Checkbox id="agreeMarketing" checked={agreeMarketing} onCheckedChange={(v) => setAgreeMarketing(!!v)} />
            <label htmlFor="agreeMarketing" className="text-sm">(선택) 마케팅 정보 수신 동의</label>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCompleteSignup}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading || !phoneNumber || !agreeTerms || !agreePrivacy}
          >
            {isLoading ? '처리 중...' : '가입 완료'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            onClick={() => router.replace('/login')}
            disabled={isLoading}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NaverCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    }>
      <NaverCallbackContent />
    </Suspense>
  )
}
