'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { mbtiMatchApi, memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import { Suspense } from 'react'

type EIType = 'E' | 'I'
type SNType = 'S' | 'N'
type TFType = 'T' | 'F'
type JPType = 'J' | 'P'

function AxisToggle<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: [T, T]
  selected: T | null
  onSelect: (v: T) => void
}) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
            selected === opt
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const AXIS_DESCRIPTIONS: Record<string, string> = {
  E: '외향 — 사람과 함께할 때 에너지 충전',
  I: '내향 — 혼자만의 시간에서 에너지 충전',
  S: '감각 — 현실과 구체적인 사실 중시',
  N: '직관 — 패턴과 가능성에 집중',
  T: '사고 — 논리와 객관적 분석 선호',
  F: '감정 — 감정과 가치관 중시',
  J: '판단 — 계획적이고 체계적인 생활',
  P: '인식 — 유연하고 즉흥적인 생활',
}

function MbtiMatchContent() {
  const router = useRouter()
  const { isLoaded, fetchMember } = useMemberStore()
  const [ei, setEi] = useState<EIType | null>(null)
  const [sn, setSn] = useState<SNType | null>(null)
  const [tf, setTf] = useState<TFType | null>(null)
  const [jp, setJp] = useState<JPType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  const mbti = ei && sn && tf && jp ? `${ei}${sn}${tf}${jp}` : null
  const isComplete = mbti !== null

  const handleSubmit = async () => {
    if (!mbti || submitting) return
    setSubmitting(true)
    // MBTI DB 저장 (fire-and-forget)
    memberApi.updateMbti(mbti).catch(() => {})
    try {
      const result = await mbtiMatchApi.create({ mbti })
      router.push(`/studio/mbti-match/loading?id=${result.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403) {
        toast.error('크레딧이 부족합니다. 친구를 초대해 크레딧을 충전하세요.')
      } else {
        toast.error('MBTI 매칭 요청에 실패했습니다.')
      }
      setSubmitting(false)
    }
  }

  const selectedChar = [ei, sn, tf, jp].find((v) => v !== null && AXIS_DESCRIPTIONS[v])

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* 헤더 */}
      <div className="flex items-center px-4 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">MBTI × 얼굴 매칭</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-5 border border-indigo-100">
          <div className="text-3xl mb-3">🧬</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">MBTI × 얼굴 분석</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            얼굴과 MBTI가 얼마나 일치할까요?<br />
            겉바속촉 지수를 측정해 드려요
          </p>
        </div>
      </div>

      {/* MBTI 선택 */}
      <div className="px-5 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">나의 MBTI</p>

        {/* 현재 MBTI 표시 */}
        <div className="text-center mb-6">
          <p className="text-5xl font-black text-indigo-600 tracking-widest">
            {mbti ?? '????'}
          </p>
        </div>

        {/* 축 선택 */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
              <span>외향 (E)</span>
              <span>내향 (I)</span>
            </div>
            <AxisToggle options={['E', 'I']} selected={ei} onSelect={setEi} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
              <span>감각 (S)</span>
              <span>직관 (N)</span>
            </div>
            <AxisToggle options={['S', 'N']} selected={sn} onSelect={setSn} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
              <span>사고 (T)</span>
              <span>감정 (F)</span>
            </div>
            <AxisToggle options={['T', 'F']} selected={tf} onSelect={setTf} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
              <span>판단 (J)</span>
              <span>인식 (P)</span>
            </div>
            <AxisToggle options={['J', 'P']} selected={jp} onSelect={setJp} />
          </div>
        </div>

        {/* 선택된 타입 설명 */}
        {[ei, sn, tf, jp].filter(Boolean).map((v) => v && (
          <div key={v} className="mt-1" />
        ))}
      </div>

      {/* 시작 버튼 */}
      <div className="px-5 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || submitting}
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-base disabled:opacity-50"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>분석 준비 중...</span>
            </div>
          ) : isComplete ? (
            `${mbti} 분석 시작하기`
          ) : (
            'MBTI를 선택해주세요'
          )}
        </Button>
      </div>
    </div>
  )
}

export default function MbtiMatchPage() {
  return (
    <Suspense>
      <MbtiMatchContent />
    </Suspense>
  )
}
