'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { animalFaceApi } from '@/lib/api'
import type { AnimalFace, AnimalType, AnimalCategory } from '@/lib/types'

const ANIMAL_LABEL: Record<AnimalType, string> = {
  DOG: '강아지상',
  CAT: '고양이상',
  FOX: '여우상',
  RABBIT: '토끼상',
  BEAR: '곰상',
  DEER: '사슴상',
  WOLF: '늑대상',
  HAMSTER: '햄스터상',
}

const ANIMAL_EMOJI: Record<AnimalType, string> = {
  DOG: '🐶',
  CAT: '🐱',
  FOX: '🦊',
  RABBIT: '🐰',
  BEAR: '🐻',
  DEER: '🦌',
  WOLF: '🐺',
  HAMSTER: '🐹',
}

const CATEGORY_LABEL: Record<AnimalCategory, string> = {
  FIRST_IMPRESSION: '첫인상',
  PERSONALITY: '성격',
  ROMANCE: '연애',
  HIDDEN_CHARM: '숨겨진 매력',
}

const CATEGORY_EMOJI: Record<AnimalCategory, string> = {
  FIRST_IMPRESSION: '👀',
  PERSONALITY: '🧠',
  ROMANCE: '💕',
  HIDDEN_CHARM: '✨',
}

// ─── 공유 카드 ────────────────────────────────────────

async function drawAnimalFaceShareCard(result: AnimalFace): Promise<Blob> {
  const S = 2
  const W = 390 * S
  const H = 520 * S
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 배경 그라데이션
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#f97316') // orange-500
  bg.addColorStop(1, '#e11d48') // rose-600
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 앱 이름
  const pad = 40 * S
  let y = 52 * S
  ctx.font = `600 ${12 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'left'
  ctx.fillText('ggap 동물상', pad, y)
  y += 52 * S

  // 동물 이모지
  if (result.animalType) {
    ctx.font = `${40 * S}px -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(ANIMAL_EMOJI[result.animalType], W / 2, y)
    y += 52 * S
  }

  // 동물 이름
  if (result.animalType) {
    ctx.font = `700 ${28 * S}px -apple-system, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(ANIMAL_LABEL[result.animalType], W / 2, y)
    y += 36 * S
  }

  // 서브타입
  if (result.subType) {
    ctx.font = `500 ${14 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.textAlign = 'center'
    ctx.fillText(result.subType, W / 2, y)
    y += 36 * S
  }

  // 구분선
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = S
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 28 * S

  // 매칭률 상위 3개
  const top3 = result.matchRates.slice(0, 3)
  for (const match of top3) {
    const barW = (W - pad * 2) * (match.rate / 100)
    ctx.font = `600 ${12 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.textAlign = 'left'
    ctx.fillText(`${ANIMAL_EMOJI[match.animalType]} ${ANIMAL_LABEL[match.animalType]}`, pad, y)
    ctx.textAlign = 'right'
    ctx.fillText(`${match.rate}%`, W - pad, y)
    y += 14 * S
    // 바 배경
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.beginPath()
    ctx.roundRect(pad, y, W - pad * 2, 8 * S, 4 * S)
    ctx.fill()
    // 바 채우기
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.roundRect(pad, y, barW, 8 * S, 4 * S)
    ctx.fill()
    y += 24 * S
  }

  // 위트 한마디
  if (result.wittyOneLiner) {
    y += 8 * S
    ctx.font = `500 ${12 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.textAlign = 'center'
    ctx.fillText(`"${result.wittyOneLiner}"`, W / 2, y)
  }

  // 하단 CTA
  ctx.font = `500 ${11 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.textAlign = 'left'
  ctx.fillText('나도 해보기 → ggap.ai', pad, H - 36 * S)

  // 워터마크
  const WM = '077.co.kr'
  ctx.font = `600 ${12 * S}px -apple-system, sans-serif`
  const wmW = ctx.measureText(WM).width
  const wmX = W - wmW - 12 * S
  const wmY = 12 * S + 14 * S
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillText(WM, wmX + S, wmY + S)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(WM, wmX, wmY)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    )
  })
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function AnimalFaceResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<AnimalFace | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) {
      router.replace('/studio/animal-face')
      return
    }
    animalFaceApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/animal-face')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
    if (!result) return
    setSharing(true)
    try {
      const blob = await drawAnimalFaceShareCard(result)
      const file = new File([blob], 'animal-face.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `나의 동물상은 ${result.animalType ? ANIMAL_LABEL[result.animalType] : '?'} 🐾` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'animal-face.png'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('이미지를 저장했습니다.')
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error('공유에 실패했습니다.')
      }
    } finally {
      setSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center px-4 pt-6 pb-4">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-6 w-24 ml-2" />
        </div>
        <div className="px-5 space-y-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const animalLabel = result.animalType ? ANIMAL_LABEL[result.animalType] : '알 수 없음'
  const animalEmoji = result.animalType ? ANIMAL_EMOJI[result.animalType] : '🐾'

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">동물상 결과</h1>
      </div>

      {/* 메인 카드 */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="text-5xl mb-3 text-center">{animalEmoji}</div>
          <h2 className="text-3xl font-bold text-center mb-1">{animalLabel}</h2>
          {result.subType && (
            <p className="text-white/80 text-sm text-center mb-3">{result.subType}</p>
          )}
          {result.wittyOneLiner && (
            <div className="bg-white/20 rounded-2xl px-4 py-3 mt-3">
              <p className="text-white text-sm text-center leading-relaxed">"{result.wittyOneLiner}"</p>
            </div>
          )}
        </div>
      </div>

      {/* 매칭률 */}
      {result.matchRates.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">동물상 매칭률</p>
          <div className="space-y-3">
            {result.matchRates.slice(0, 3).map((match) => (
              <div key={match.animalType} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ANIMAL_EMOJI[match.animalType]}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{ANIMAL_LABEL[match.animalType]}</p>
                      {match.subType && (
                        <p className="text-xs text-gray-400">{match.subType}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{match.rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${match.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 분석 섹션 */}
      {result.analyses.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">상세 분석</p>
          <div className="space-y-3">
            {result.analyses.map((analysis) => (
              <div key={analysis.category} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{CATEGORY_EMOJI[analysis.category]}</span>
                  <h3 className="font-bold text-gray-900">{CATEGORY_LABEL[analysis.category]}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">{analysis.summary}</p>
                <p className="text-xs text-orange-600 italic mb-3">"{analysis.wittyLine}"</p>
                {analysis.keywords.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {analysis.keywords.map((kw) => (
                      <span key={kw} className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 베스트/워스트 매치 */}
      {(result.bestMatch || result.worstMatch) && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">궁합</p>
          <div className="grid grid-cols-2 gap-3">
            {result.bestMatch && (
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 mb-2">찰떡 궁합</p>
                <div className="text-2xl mb-1">{ANIMAL_EMOJI[result.bestMatch]}</div>
                <p className="text-sm font-bold text-gray-900">{ANIMAL_LABEL[result.bestMatch]}</p>
              </div>
            )}
            {result.worstMatch && (
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                <p className="text-xs font-semibold text-rose-600 mb-2">최악 궁합</p>
                <div className="text-2xl mb-1">{ANIMAL_EMOJI[result.worstMatch]}</div>
                <p className="text-sm font-bold text-gray-900">{ANIMAL_LABEL[result.worstMatch]}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="px-5 flex gap-3 mt-6">
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 font-semibold"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {sharing ? '공유 중...' : '공유하기'}
        </Button>
        <Button
          onClick={() => router.push('/studio/animal-face')}
          variant="outline"
          className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          다시하기
        </Button>
      </div>
    </div>
  )
}

export default function AnimalFaceResultPage() {
  return (
    <Suspense>
      <AnimalFaceResultContent />
    </Suspense>
  )
}
