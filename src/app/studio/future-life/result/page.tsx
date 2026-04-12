'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { futureLifeApi } from '@/lib/api'
import type { FutureLife, RebirthCategory } from '@/lib/types'

const CATEGORY_LABEL: Record<RebirthCategory, string> = {
  HUMAN: '인간',
  ANIMAL: '동물',
  INSECT: '곤충',
  ALIEN: '외계인',
  PLANT: '식물',
  OBJECT: '무생물',
}

const CATEGORY_EMOJI: Record<RebirthCategory, string> = {
  HUMAN: '👤',
  ANIMAL: '🐾',
  INSECT: '🦋',
  ALIEN: '👽',
  PLANT: '🌿',
  OBJECT: '💎',
}

// ─── 공유 카드 그리기 ─────────────────────────────────

async function drawFutureLifeShareCard(result: FutureLife): Promise<Blob> {
  const S = 2
  const W = 390 * S
  const H = 580 * S

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 배경 — 사이버펑크 다크 그라디언트
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, '#0f0c29')
  bgGrad.addColorStop(0.5, '#1e1b4b')
  bgGrad.addColorStop(1, '#083344')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // 격자 패턴
  ctx.strokeStyle = 'rgba(6,182,212,0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40 * S) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let yy = 0; yy < H; yy += 40 * S) {
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke()
  }

  // 네온 테두리
  ctx.strokeStyle = 'rgba(6,182,212,0.5)'
  ctx.lineWidth = S
  ctx.strokeRect(20 * S, 20 * S, (390 - 40) * S, (580 - 40) * S)

  const pad = 40 * S
  let y = 60 * S

  // 앱 이름
  ctx.font = `600 ${13 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(6,182,212,0.8)'
  ctx.textAlign = 'left'
  ctx.fillText('ㅇㄱㄱ 후생 보기', pad, y)
  y += 40 * S

  // 카테고리 레이블
  const categoryLabel = result.category ? CATEGORY_LABEL[result.category] : '후생'
  const categoryEmoji = result.category ? CATEGORY_EMOJI[result.category] : '🔮'
  ctx.font = `500 ${14 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(103,232,249,0.9)'
  ctx.fillText(`${categoryEmoji} ${categoryLabel}`, pad, y)
  y += 40 * S

  // 메인 카피
  const caption = result.wittyOneLiner ?? result.rebirthType ?? '미래의 주인공'
  const mainCopy = `"나의 후생은 ${caption}"`
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

  // 구분선 — 네온
  const divGrad = ctx.createLinearGradient(pad, y, W - pad, y)
  divGrad.addColorStop(0, 'rgba(6,182,212,0.5)')
  divGrad.addColorStop(1, 'rgba(139,92,246,0.5)')
  ctx.strokeStyle = divGrad
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

  // 후생 타입 정보
  if (result.rebirthType) {
    ctx.font = `500 ${13 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(103,232,249,0.85)'
    ctx.fillText(`후생: ${result.rebirthType}`, pad, y)
    y += 24 * S
  }

  // 하단 CTA
  y = H - 52 * S
  ctx.font = `500 ${12 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(6,182,212,0.6)'
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

function FutureLifeResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<FutureLife | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageTab, setActiveImageTab] = useState<'original' | 'future'>('future')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) {
      router.replace('/studio/future-life')
      return
    }
    futureLifeApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/future-life')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
    if (!result) return
    setSharing(true)
    try {
      const blob = await drawFutureLifeShareCard(result)
      const file = new File([blob], 'future-life.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 후생 결과 공개 🔮' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'future-life.png'
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

  const categoryLabel = result.category ? CATEGORY_LABEL[result.category] : null
  const categoryEmoji = result.category ? CATEGORY_EMOJI[result.category] : '🔮'
  const displayImage =
    activeImageTab === 'future' ? result.generatedImageUrl : result.sourceImageUrl

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">후생 결과</h1>
      </div>

      {/* 헤드라인 */}
      <div className="px-5 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          {categoryEmoji} {categoryLabel ?? '후생'}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-snug">
          나의 후생은{' '}
          <span className="text-cyan-600">
            {result.wittyOneLiner ?? result.rebirthType ?? '특별한 존재'}
          </span>
        </p>
      </div>

      {/* 이미지 비교 탭 */}
      {(result.sourceImageUrl || result.generatedImageUrl) && (
        <div className="px-5 mb-5">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            {[
              { id: 'original' as const, label: '원본' },
              { id: 'future' as const, label: '후생' },
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
                alt={activeImageTab === 'future' ? '후생 이미지' : '원본 이미지'}
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">후생 이야기</p>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed">{result.story}</p>
          </div>
        </div>
      )}

      {/* 후생 정보 카드 */}
      <div className="px-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">후생 정보</p>
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
          {result.rebirthType && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">후생</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">
                {categoryEmoji} {result.rebirthType}
              </p>
            </div>
          )}
          {categoryLabel && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">분류</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">{categoryLabel}</p>
            </div>
          )}
          {result.rebirthReason && (
            <div className="flex items-start px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400 pt-0.5">이유</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800 leading-snug">{result.rebirthReason}</p>
            </div>
          )}
          {result.personality && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">성격</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">{result.personality}</p>
            </div>
          )}
          {result.specialty && (
            <div className="flex items-center px-4 py-3.5">
              <p className="w-[20%] text-xs font-semibold text-gray-400">특기</p>
              <p className="w-[80%] text-sm font-semibold text-gray-800">{result.specialty}</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 flex gap-3 mt-4">
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-700 font-semibold"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {sharing ? '생성 중...' : '공유하기'}
        </Button>
        <Button
          onClick={() => router.push('/studio/future-life')}
          variant="outline"
          className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          다시 해보기
        </Button>
      </div>
    </div>
  )
}

export default function FutureLifeResultPage() {
  return (
    <Suspense>
      <FutureLifeResultContent />
    </Suspense>
  )
}
