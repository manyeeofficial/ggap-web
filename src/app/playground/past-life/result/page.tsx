'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { pastLifeApi } from '@/lib/api'
import type { PastLife, PastEra } from '@/lib/types'

const ERA_LABEL: Record<PastEra, string> = {
  THREE_KINGDOMS: '삼국시대',
  GORYEO: '고려시대',
  JOSEON: '조선시대',
  RETRO_60S: '1960년대',
  RETRO_80S: '1980년대',
}

const ERA_EMOJI: Record<PastEra, string> = {
  THREE_KINGDOMS: '⚔️',
  GORYEO: '🏺',
  JOSEON: '📜',
  RETRO_60S: '🎞️',
  RETRO_80S: '🎵',
}

// ─── 공유 카드 그리기 ─────────────────────────────────

async function drawPastLifeShareCard(result: PastLife): Promise<Blob> {
  const S = 2
  const W = 390 * S
  const H = 580 * S

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 배경 — 세피아 한지 느낌
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#78350f')
  bgGrad.addColorStop(0.5, '#92400e')
  bgGrad.addColorStop(1, '#451a03')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // 장식 테두리
  ctx.strokeStyle = 'rgba(251,191,36,0.3)'
  ctx.lineWidth = S
  ctx.strokeRect(20 * S, 20 * S, (390 - 40) * S, (580 - 40) * S)
  ctx.strokeStyle = 'rgba(251,191,36,0.15)'
  ctx.lineWidth = S * 0.5
  ctx.strokeRect(26 * S, 26 * S, (390 - 52) * S, (580 - 52) * S)

  const pad = 40 * S
  let y = 60 * S

  // 앱 이름
  ctx.font = `600 ${13 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(251,191,36,0.8)'
  ctx.textAlign = 'left'
  ctx.fillText('ㅇㄱㄱ 전생 보기', pad, y)
  y += 40 * S

  // 시대 레이블
  const eraLabel = ERA_LABEL[result.era]
  const eraEmoji = ERA_EMOJI[result.era]
  ctx.font = `500 ${14 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(253,230,138,0.9)'
  ctx.fillText(`${eraEmoji} ${eraLabel}`, pad, y)
  y += 40 * S

  // 메인 카피
  const caption = result.wittyOneLiner ?? result.characterName ?? '전생의 주인공'
  const mainCopy = `"나의 전생은 ${caption}"`
  ctx.font = `700 ${20 * S}px -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'

  const maxWidth = (390 - 80) * S
  const words = mainCopy.split(' ')
  let line = ''
  const lines: string[] = []
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  for (const l of lines) {
    ctx.fillText(l, pad, y)
    y += 30 * S
  }
  y += 12 * S

  // 구분선
  ctx.strokeStyle = 'rgba(251,191,36,0.3)'
  ctx.lineWidth = S
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 28 * S

  // 생성된 이미지
  if (result.generatedImageUrl) {
    try {
      const img = await loadImage(result.generatedImageUrl)
      const imgW = (390 - 80) * S
      const imgH = 160 * S
      const imgX = pad
      const imgY = y

      // 라운드 클리핑
      ctx.save()
      ctx.beginPath()
      const r = 12 * S
      ctx.moveTo(imgX + r, imgY)
      ctx.lineTo(imgX + imgW - r, imgY)
      ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + r)
      ctx.lineTo(imgX + imgW, imgY + imgH - r)
      ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - r, imgY + imgH)
      ctx.lineTo(imgX + r, imgY + imgH)
      ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - r)
      ctx.lineTo(imgX, imgY + r)
      ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, imgX, imgY, imgW, imgH)
      ctx.restore()
      y += imgH + 28 * S
    } catch {
      // 이미지 로드 실패 시 스킵
    }
  }

  // 캐릭터 정보
  const infoItems: string[] = []
  if (result.characterName) infoItems.push(`이름: ${result.characterName}`)
  if (result.occupation) infoItems.push(`직업: ${result.occupation}`)

  for (const item of infoItems) {
    ctx.font = `500 ${13 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(253,230,138,0.85)'
    ctx.fillText(item, pad, y)
    y += 24 * S
  }

  // 하단 CTA
  y = H - 52 * S
  ctx.font = `500 ${12 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(251,191,36,0.6)'
  ctx.fillText('나도 해보기 → ggap.ai', pad, y)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function PastLifeResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<PastLife | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageTab, setActiveImageTab] = useState<'original' | 'past'>('past')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) {
      router.replace('/playground/past-life')
      return
    }
    pastLifeApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/playground/past-life')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
    if (!result) return
    setSharing(true)
    try {
      const blob = await drawPastLifeShareCard(result)
      const file = new File([blob], 'past-life.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 전생 결과 공개 📜' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'past-life.png'
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
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const eraLabel = ERA_LABEL[result.era]
  const eraEmoji = ERA_EMOJI[result.era]
  const displayImage =
    activeImageTab === 'past' ? result.generatedImageUrl : result.sourceImageUrl

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">전생 결과</h1>
      </div>

      {/* 헤드라인 */}
      <div className="px-5 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{eraEmoji} {eraLabel}</p>
        <p className="text-2xl font-bold text-gray-900 leading-snug">
          나의 전생은{' '}
          <span className="text-amber-600">
            {result.wittyOneLiner ?? result.characterName ?? '특별한 전생'}
          </span>
        </p>
      </div>

      {/* 이미지 비교 탭 */}
      {(result.sourceImageUrl || result.generatedImageUrl) && (
        <div className="px-5 mb-5">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            {[
              { id: 'original' as const, label: '원본' },
              { id: 'past' as const, label: '전생' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveImageTab(tab.id)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeImageTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {displayImage ? (
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={activeImageTab === 'past' ? '전생 이미지' : '원본 이미지'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-100 aspect-square flex items-center justify-center">
              <p className="text-gray-400 text-sm">이미지 준비 중...</p>
            </div>
          )}
        </div>
      )}

      {/* 스토리 */}
      {result.story && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">전생 이야기</p>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed">{result.story}</p>
          </div>
        </div>
      )}

      {/* 캐릭터 정보 카드 */}
      <div className="px-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">전생 정보</p>
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
          <div className="flex items-center px-4 py-3.5">
            <p className="w-[20%] text-xs font-semibold text-gray-400">시대</p>
            <p className="w-[80%] text-sm font-semibold text-gray-800">{eraEmoji} {eraLabel}</p>
          </div>
          {result.characterName && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">이름</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">{result.characterName}</p>
            </div>
          )}
          {result.occupation && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">직업</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">{result.occupation}</p>
            </div>
          )}
          {result.personality && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">성격</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">{result.personality}</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 flex gap-3 mt-4">
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 font-semibold"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {sharing ? '생성 중...' : '공유하기'}
        </Button>
        <Button
          onClick={() => router.push('/playground/past-life')}
          variant="outline"
          className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          다른 시대로 보기
        </Button>
      </div>
    </div>
  )
}

export default function PastLifeResultPage() {
  return (
    <Suspense>
      <PastLifeResultContent />
    </Suspense>
  )
}
