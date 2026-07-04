'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, RotateCcw, Eye, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { faceCodeApi } from '@/lib/api'
import type { FaceCodeAnalysis } from '@/lib/types'
import { FaceCodeBadge } from '@/app/studio/face-code/components/FaceCodeBadge'
import { characterFor, gradientHexFor } from '@/lib/face-code/faceCode'

// ─── 공유 카드 (Canvas, 운세 미노출) ──────────────────

async function drawFaceCodeShareCard(result: FaceCodeAnalysis): Promise<Blob> {
  const meta = result.meta!
  const S = 2
  const W = 390 * S
  const H = 520 * S
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const [c0, c1] = gradientHexFor(meta.code)
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, c0)
  bg.addColorStop(1, c1)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const pad = 40 * S
  let y = 52 * S
  ctx.font = `600 ${12 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'left'
  ctx.fillText('ggap 낯빛코드', pad, y)
  y += 60 * S

  // 캐릭터
  ctx.font = `${52 * S}px -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(characterFor(meta.code), W / 2, y)
  y += 58 * S

  // 코드
  ctx.font = `800 ${44 * S}px -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(meta.code, W / 2, y)
  y += 40 * S

  // 별명
  ctx.font = `700 ${18 * S}px -apple-system, sans-serif`
  ctx.fillText(meta.nickname, W / 2, y)
  y += 28 * S

  // 캐치프레이즈
  ctx.font = `500 ${13 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(`"${meta.catchphrase}"`, W / 2, y)
  y += 36 * S

  // 구분선
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = S
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 34 * S

  // 3축
  if (result.axes) {
    const axes = [result.axes.temp, result.axes.mood, result.axes.def]
    const colW = (W - pad * 2) / 3
    axes.forEach((a, i) => {
      const cx = pad + colW * i + colW / 2
      ctx.font = `800 ${22 * S}px -apple-system, sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(a.letter, cx, y)
      ctx.font = `500 ${11 * S}px -apple-system, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(a.keyword, cx, y + 20 * S)
    })
    y += 52 * S
  }

  // 궁합
  ctx.font = `500 ${12 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'center'
  ctx.fillText(`잘 맞는 코드 · ${meta.matchCode} ${meta.matchNickname}`, W / 2, y)

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
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

function FaceCodeResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<FaceCodeAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (!result?.meta) return
    setSharing(true)
    try {
      const blob = await drawFaceCodeShareCard(result)
      const file = new File([blob], 'face-code.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `나의 낯빛코드는 ${result.meta.code} · ${result.meta.nickname} 🔮`,
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'face-code.png'
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

  useEffect(() => {
    if (!id) {
      router.replace('/studio/face-code')
      return
    }
    faceCodeApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/face-code')
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
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const meta = result.meta

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* 헤더 */}
      <div className="flex items-center px-4 pt-6 pb-4">
        <button
          onClick={() => router.push('/studio')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">낯빛코드 결과</h1>
      </div>

      {!meta ? (
        <div className="px-5">
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500">코드를 산출하지 못했어요. 다시 시도해 주세요.</p>
          </div>
        </div>
      ) : (
        <>
          {/* 코드 뱃지 (대표 정체성) */}
          <div className="px-5 mb-5">
            <FaceCodeBadge meta={meta} axes={result.axes} lowConfidence={result.lowConfidence} />
          </div>

          {/* 코드 해독 (3축 근거) */}
          {result.axes && (
            <div className="px-5 mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">코드 해독</p>
              <div className="space-y-2">
                {[result.axes.temp, result.axes.mood, result.axes.def].map((a) => (
                  <div key={a.letter} className="bg-gray-50 rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-800">
                        {a.letter} · {a.keyword}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{a.score}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{a.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 성격 프로필 */}
          <div className="px-5 mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">성격 프로필</p>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <ProfileRow label="성향" value={meta.temperament} />
              <ProfileRow label="강점" value={meta.strengths} />
              <ProfileRow label="주의" value={meta.caution} />
              <ProfileRow label="어울리는 일" value={meta.jobFit} />
            </div>
          </div>

          {/* 궁합 */}
          <div className="px-5 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">잘 맞는 코드</p>
            <div className="flex items-center gap-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-4">
              <span className="text-2xl font-black text-violet-600">{meta.matchCode}</span>
              <span className="text-sm font-semibold text-gray-700">{meta.matchNickname}</span>
            </div>
          </div>
        </>
      )}

      {/* 관상 교차 유도 */}
      <div className="px-5 mb-3">
        <button
          onClick={() => router.push('/studio/face-reading')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-800">이 얼굴의 운세도 궁금하다면?</p>
            <p className="text-xs text-gray-400 mt-0.5">관상보기로 초·중·말년운 확인하기</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
        </button>
      </div>

      {/* 액션 */}
      <div className="px-5 mt-3 space-y-2">
        {meta && (
          <Button
            onClick={handleShare}
            disabled={sharing}
            className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-semibold"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {sharing ? '카드 만드는 중...' : '공유하기'}
          </Button>
        )}
        <Button
          onClick={() => router.push('/studio/face-code')}
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

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-400 font-semibold shrink-0 w-20">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}

export default function FaceCodeResultPage() {
  return (
    <Suspense>
      <FaceCodeResultContent />
    </Suspense>
  )
}
