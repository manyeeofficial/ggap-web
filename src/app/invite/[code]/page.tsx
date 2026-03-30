'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, Gift, AlertCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { inviteApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { InviteLandingInfo } from '@/lib/types'

export default function InviteLandingPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { member, isLoaded, fetchMember } = useMemberStore()

  const [info, setInfo] = useState<InviteLandingInfo | null>(null)
  const [error, setError] = useState<'expired' | 'invalid' | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  useEffect(() => {
    if (!code) return
    inviteApi.getLandingInfo(code)
      .then((data) => {
        if (!data.valid) {
          setError('expired')
        } else {
          setInfo(data)
        }
      })
      .catch(() => setError('invalid'))
      .finally(() => setLoading(false))
  }, [code])

  // 로그인 상태이고 아직 수락 안 한 경우 자동 수락 시도
  useEffect(() => {
    if (!isLoaded || !member || !info) return
    handleAccept()
  }, [isLoaded, member, info])

  const handleAccept = async () => {
    if (accepting) return
    setAccepting(true)
    try {
      await inviteApi.acceptInvite(code)
    } catch {
      // 이미 사용됐거나 자기 초대 등은 무시 (이미 가입된 유저)
    } finally {
      setAccepting(false)
    }
  }

  const handleStart = () => {
    if (!member) {
      // 로그인 후 돌아올 수 있도록 쿼리 파라미터 전달
      router.push(`/login?inviteCode=${code}`)
    } else {
      router.push('/camera')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-8 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {error === 'expired' ? '만료된 초대 링크예요' : '유효하지 않은 초대 링크예요'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {error === 'expired'
            ? '초대 링크는 7일간 유효합니다. 새 링크를 요청해보세요.'
            : '링크가 잘못됐거나 이미 사용된 코드입니다.'}
        </p>
        <Button
          onClick={() => router.push('/')}
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl"
        >
          홈으로 가기
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 to-purple-700">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <p className="text-white/80 text-sm font-medium mb-2">
          <span className="text-white font-bold">{info?.inviterNickname ?? '친구'}</span>님이 초대했어요!
        </p>
        <h1 className="text-3xl font-bold text-white mb-3">
          내 얼굴값은?
        </h1>
        <p className="text-white/70 text-sm leading-relaxed">
          AI가 분석한 내 얼굴값 점수,<br />전국 랭킹 상위 몇 %인지 확인해보세요
        </p>
      </div>

      {/* 혜택 카드 */}
      <div className="mx-5 mb-6 bg-white/15 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-yellow-300 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">가입하면 무료 분석 3회 제공!</p>
            <p className="text-white/70 text-xs mt-0.5">초대 링크로 가입 시 특별 혜택이에요</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10">
        <Button
          onClick={handleStart}
          className="w-full h-14 bg-white text-indigo-600 hover:bg-gray-50 font-bold text-base rounded-2xl shadow-none"
        >
          {member ? '지금 바로 분석하기' : '무료로 얼굴값 분석하기'}
        </Button>
        {!member && (
          <p className="text-center text-white/60 text-xs mt-3">
            카카오, 네이버, 애플 계정으로 가입 가능
          </p>
        )}
      </div>
    </div>
  )
}
