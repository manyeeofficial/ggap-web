'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ageSimulationApi } from '@/lib/api'
import type { AgeSimulation } from '@/lib/types'

// ─── 메인 컴포넌트 ────────────────────────────────────

function AgeSimulationResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<AgeSimulation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      router.replace('/studio/age-simulation')
      return
    }
    ageSimulationApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/age-simulation')
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
          <Skeleton className="aspect-square rounded-3xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">나이 시뮬레이션 결과</h1>
      </div>

      {/* 헤드라인 */}
      <div className="px-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          ⏳ {result.targetAge}세 버전
        </p>
        {result.wittyOneLiner && (
          <p className="text-xl font-bold text-gray-900 leading-snug">
            <span className="text-amber-600">"{result.wittyOneLiner}"</span>
          </p>
        )}
      </div>

      {/* 이미지 비교 — 좌우 나란히 */}
      {(result.sourceImageUrl || result.generatedImageUrl) && (
        <div className="px-5 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {/* 현재 */}
            <div>
              <p className="text-xs text-center text-gray-400 font-semibold mb-2">현재</p>
              {result.sourceImageUrl ? (
                <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.sourceImageUrl} alt="현재 모습" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-100 aspect-square flex items-center justify-center">
                  <p className="text-gray-300 text-xs">없음</p>
                </div>
              )}
            </div>
            {/* 시뮬레이션 */}
            <div>
              <p className="text-xs text-center text-amber-600 font-semibold mb-2">{result.targetAge}세</p>
              {result.generatedImageUrl ? (
                <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square shadow-sm ring-2 ring-amber-400/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.generatedImageUrl} alt={`${result.targetAge}세 모습`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-100 aspect-square flex items-center justify-center">
                  <p className="text-gray-300 text-xs">생성 중...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 스토리 */}
      {result.story && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">미래 이야기</p>
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <p className="text-sm text-gray-700 leading-relaxed">{result.story}</p>
          </div>
        </div>
      )}

      {/* 변화 분석 */}
      {(result.unchangedFeatures.length > 0 || result.changedFeatures.length > 0) && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">변화 분석</p>
          <div className="grid grid-cols-2 gap-3">
            {result.unchangedFeatures.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-700">유지될 특징</p>
                </div>
                <div className="space-y-1.5">
                  {result.unchangedFeatures.map((f) => (
                    <p key={f} className="text-xs text-gray-600">{f}</p>
                  ))}
                </div>
              </div>
            )}
            {result.changedFeatures.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <XCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold text-amber-700">변화될 특징</p>
                </div>
                <div className="space-y-1.5">
                  {result.changedFeatures.map((f) => (
                    <p key={f} className="text-xs text-gray-600">{f}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 스킨케어 팁 */}
      {result.skincareTip && (
        <div className="px-5 mb-5">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
            <p className="text-xs font-bold text-amber-700 mb-2">💡 스킨케어 팁</p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.skincareTip}</p>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="px-5 mt-4">
        <Button
          onClick={() => router.push('/studio/age-simulation')}
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

export default function AgeSimulationResultPage() {
  return (
    <Suspense>
      <AgeSimulationResultContent />
    </Suspense>
  )
}
