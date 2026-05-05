'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { mbtiMatchApi } from '@/lib/api'
import type { MbtiMatch, MatchLevel, MbtiAxis } from '@/lib/types'

const MATCH_LEVEL_LABEL: Record<MatchLevel, string> = {
  SPOILER: '얼굴이 스포일러',
  HONEST: '정직한 얼굴',
  SUBTLE: '겉바속촉',
  DOUBLE_LIFE: '각자도생',
  FRAUD: '얼굴 사기',
}

const MATCH_LEVEL_EMOJI: Record<MatchLevel, string> = {
  SPOILER: '🔮',
  HONEST: '😇',
  SUBTLE: '🥤',
  DOUBLE_LIFE: '🎭',
  FRAUD: '🕵️',
}

const MATCH_LEVEL_DESC: Record<MatchLevel, string> = {
  SPOILER: '당신의 얼굴은 MBTI를 완벽하게 반영하고 있어요',
  HONEST: '얼굴과 MBTI가 솔직하게 일치하네요',
  SUBTLE: '겉모습과 실제 성격 사이에 매력적인 차이가 있어요',
  DOUBLE_LIFE: '얼굴과 MBTI가 각자의 길을 걷고 있어요',
  FRAUD: '얼굴과 MBTI가 전혀 다른 이야기를 하고 있어요!',
}

const AXIS_LABEL: Record<MbtiAxis, string> = {
  EI: '에너지 방향',
  SN: '인식 방식',
  TF: '판단 기준',
  JP: '생활 방식',
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function MbtiMatchResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<MbtiMatch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      router.replace('/studio/mbti-match')
      return
    }
    mbtiMatchApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/mbti-match')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center px-4 pt-6 pb-4">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-6 w-24 ml-2" />
        </div>
        <div className="px-5 space-y-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const matchLevelLabel = result.matchLevel ? MATCH_LEVEL_LABEL[result.matchLevel] : '분석 완료'
  const matchLevelEmoji = result.matchLevel ? MATCH_LEVEL_EMOJI[result.matchLevel] : '🧬'
  const matchLevelDesc = result.matchLevel ? MATCH_LEVEL_DESC[result.matchLevel] : ''
  const matchRate = result.overallMatchRate ?? 0

  const matchColor =
    matchRate >= 80 ? 'from-emerald-500 to-teal-600' :
    matchRate >= 60 ? 'from-indigo-500 to-violet-600' :
    matchRate >= 40 ? 'from-amber-500 to-orange-600' :
    'from-rose-500 to-pink-600'

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">MBTI 매칭 결과</h1>
      </div>

      {/* 메인 카드 */}
      <div className="px-5 mb-5">
        <div className={`bg-gradient-to-br ${matchColor} rounded-3xl p-6 text-white shadow-lg`}>
          <div className="text-center mb-4">
            <p className="text-5xl mb-2">{matchLevelEmoji}</p>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wide mb-1">
              {result.mbti}
            </p>
            <h2 className="text-2xl font-bold mb-1">{matchLevelLabel}</h2>
            <p className="text-white/80 text-sm">{matchLevelDesc}</p>
          </div>

          {/* 일치율 게이지 */}
          <div className="bg-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/70 text-xs font-semibold">전체 일치율</p>
              <p className="text-white text-2xl font-black">{matchRate}%</p>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${matchRate}%` }}
              />
            </div>
          </div>

          {result.wittyOneLiner && (
            <div className="bg-white/15 rounded-2xl px-4 py-3 mt-3">
              <p className="text-white text-sm text-center">"{result.wittyOneLiner}"</p>
            </div>
          )}

          {/* 브랜딩 */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-end">
            <p className="text-white/30 text-xs tracking-wide">ggap.ai</p>
          </div>
        </div>
      </div>

      {/* 축별 분석 */}
      {result.axisMatches.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">축별 분석</p>
          <div className="space-y-3">
            {result.axisMatches.map((axis) => (
              <div key={axis.axis} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{AXIS_LABEL[axis.axis]}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {axis.axis}축: 얼굴 {axis.faceResult} vs MBTI {axis.mbtiResult}
                    </p>
                  </div>
                  {axis.isMatch ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-indigo-600 italic">"{axis.wittyLine}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 스토리 */}
      {result.story && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">분석 이야기</p>
          <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
            <p className="text-sm text-gray-700 leading-relaxed">{result.story}</p>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="px-5 mt-4">
        <Button
          onClick={() => router.push('/studio/mbti-match')}
          variant="outline"
          className="w-full h-12 rounded-2xl border-gray-200 font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          다시하기
        </Button>
      </div>
    </div>
  )
}

export default function MbtiMatchResultPage() {
  return (
    <Suspense>
      <MbtiMatchResultContent />
    </Suspense>
  )
}
