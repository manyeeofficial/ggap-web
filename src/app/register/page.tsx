'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Checkbox } from '@/app/components/ui/checkbox'
import { ArrowLeft } from 'lucide-react'
import { memberApi } from '@/lib/api'
import type { SignupRequest, MobileCarrier } from '@/lib/types'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('')
  const [mobileCarrier, setMobileCarrier] = useState<MobileCarrier | ''>('')
  const [agreeAll, setAgreeAll] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleNext = async () => {
    if (step === 1) {
      if (!email || !email.includes('@')) {
        toast.error('올바른 이메일을 입력해주세요.')
        return
      }

      setIsLoading(true)
      try {
        const { emailExists, phoneExists } = await memberApi.checkDuplicate(
          email.trim(),
          phoneNumber || ''
        )
        if (emailExists) {
          toast.error('이미 사용 중인 이메일입니다.')
          return
        }
        if (phoneNumber && phoneExists) {
          toast.error('이미 사용 중인 휴대전화번호입니다.')
          return
        }
        setStep(2)
      } catch (err: any) {
        toast.error(err.response?.data?.message || '중복 확인에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    } else if (step === 2) {
      if (password.length < 8) {
        toast.error('비밀번호는 8자 이상이어야 합니다.')
        return
      }
      if (password !== passwordConfirm) {
        toast.error('비밀번호가 일치하지 않습니다.')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!agreeTerms || !agreePrivacy) {
        toast.error('필수 약관에 동의해주세요.')
        return
      }

      setIsLoading(true)
      try {
        const signupData: SignupRequest = {
          emailAddress: email,
          password,
          phoneNumber: phoneNumber || '',
          nickname: nickname || undefined,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
          gender: gender || undefined,
          mobileCarrier: mobileCarrier || undefined,
        }

        await memberApi.signup(signupData)
        router.push('/login')
      } catch (err: any) {
        console.error('Signup error:', err)
        toast.error(err.response?.data?.message || '회원가입에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked)
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="p-6 flex items-center border-b">
        <button onClick={() => (step === 1 ? router.push('/login') : setStep(step - 1))}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">회원가입</h1>
        <div className="w-6" />
      </div>

      {/* Progress */}
      <div className="p-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">Step {step} / 3</p>
      </div>

      {/* Content */}
      <div className="p-6 pb-28">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="face@ggap.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-2 h-12"
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="영문과 숫자를 포함하여 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임 (2-20자)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="birthYear">출생년도</Label>
              <select
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="mt-2 w-full h-12 px-3 border rounded-md"
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
                <Checkbox id="agreeAll" checked={agreeAll} onCheckedChange={handleAgreeAll} />
                <label htmlFor="agreeAll" className="font-semibold">전체 동의</label>
              </div>
              <div className="flex items-center space-x-2 pl-4">
                <Checkbox id="agreeTerms" checked={agreeTerms} onCheckedChange={setAgreeTerms} />
                <label htmlFor="agreeTerms" className="text-sm">(필수) 이용약관 동의</label>
              </div>
              <div className="flex items-center space-x-2 pl-4">
                <Checkbox id="agreePrivacy" checked={agreePrivacy} onCheckedChange={setAgreePrivacy} />
                <label htmlFor="agreePrivacy" className="text-sm">(필수) 개인정보 처리방침 동의</label>
              </div>
              <div className="flex items-center space-x-2 pl-4">
                <Checkbox id="agreeMarketing" checked={agreeMarketing} onCheckedChange={setAgreeMarketing} />
                <label htmlFor="agreeMarketing" className="text-sm">(선택) 마케팅 정보 수신 동의</label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
        <Button
          onClick={handleNext}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
          disabled={(step === 3 && (!agreeTerms || !agreePrivacy)) || isLoading}
        >
          {isLoading ? '처리 중...' : step === 3 ? '가입 완료' : '다음'}
        </Button>
      </div>
    </div>
  )
}
