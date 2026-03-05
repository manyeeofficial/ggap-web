'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Progress } from '@/app/components/ui/progress'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { ArrowLeft, Camera, Share2, Sparkles, AlertCircle } from 'lucide-react'
import { skinAnalysisApi } from '@/lib/api'
import type { SkinAnalysis, TroubleType, Severity } from '@/lib/types'
import { toast } from 'sonner'

const SKIN_TYPE_MAP: Record<string, { type: string; icon: string }> = {
  OILY: { type: '지성', icon: '💧' },
  DRY: { type: '건성', icon: '🏜️' },
  COMBINATION: { type: '복합성', icon: '⚖️' },
  SENSITIVE: { type: '민감성', icon: '🌸' },
  NORMAL: { type: '중성', icon: '✨' },
}

const TROUBLE_TYPE_MAP: Record<TroubleType, string> = {
  WRINKLE: '주름',
  PIGMENTATION: '색소침착',
  ACNE: '여드름',
  PORE: '모공',
  REDNESS: '홍조',
  ELASTICITY: '탄력',
  TEXTURE: '피부결',
  HYDRATION: '수분',
  DARK_CIRCLE: '다크서클',
}

const SEVERITY_MAP: Record<Severity, string> = {
  NONE: '없음',
  MILD: '경증',
  MODERATE: '중등도',
  SEVERE: '중증',
}

const SEVERITY_COLOR: Record<Severity, string> = {
  NONE: 'bg-gray-100 text-gray-400',
  MILD: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
  MODERATE: 'bg-orange-50 text-orange-600 border border-orange-100',
  SEVERE: 'bg-red-50 text-red-600 border border-red-100',
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function loadImageAsDataUrl(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = dataUrl
    })
  } catch {
    return null
  }
}

async function drawShareCard(
  analysis: SkinAnalysis,
  skinTypeInfo: { type: string; icon: string } | null
): Promise<Blob> {
  const S = 2
  const W = 390 * S
  const H = 580 * S

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── 배경 ──────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#312e81')
  bgGrad.addColorStop(1, '#581c87')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // ── 이미지 (object-cover object-center) ────────────────
  const imgAreaH = 390 * S
  if (analysis.imageUrl) {
    const img = await loadImageAsDataUrl(analysis.imageUrl)
    if (img) {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const areaAspect = W / imgAreaH
      const imgAspect = iw / ih
      let sx = 0, sy = 0, sw = iw, sh = ih
      if (imgAspect > areaAspect) {
        sw = ih * areaAspect
        sx = (iw - sw) / 2
      } else {
        sh = iw / areaAspect
        sy = (ih - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, imgAreaH)
    }
  }

  // ── 하단 그라디언트 오버레이 ────────────────────────────
  const overlay = ctx.createLinearGradient(0, imgAreaH * 0.3, 0, imgAreaH)
  overlay.addColorStop(0, 'rgba(0,0,0,0)')
  overlay.addColorStop(0.5, 'rgba(0,0,0,0.35)')
  overlay.addColorStop(1, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, W, imgAreaH)

  // ── 이미지 위 텍스트 (좌측 정렬) ──────────────────────
  const padX = 24 * S
  const labelY = imgAreaH - 105 * S

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = `${12 * S}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('내 얼굴값', padX, labelY)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${34 * S}px sans-serif`
  const valueStr = analysis.totalFaceValue?.toLocaleString() ?? '?'
  ctx.fillText(`${valueStr}원`, padX, labelY + 46 * S)

  // 배지
  const badges: string[] = []
  if (skinTypeInfo) badges.push(`${skinTypeInfo.icon} ${skinTypeInfo.type}`)
  if (analysis.estimatedSkinAge != null) badges.push(`피부나이 ${analysis.estimatedSkinAge}세`)

  if (badges.length > 0) {
    ctx.font = `600 ${10 * S}px sans-serif`
    const bPadX = 10 * S
    const bPadY = 5 * S
    const bH = (10 + bPadY * 2 / S) * S
    const bGap = 8 * S
    let bx = padX
    const by = labelY + 64 * S
    badges.forEach((text) => {
      const bw = ctx.measureText(text).width + bPadX * 2
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      drawRoundRect(ctx, bx, by, bw, bH, bH / 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText(text, bx + bPadX, by + bPadY + 10 * S)
      bx += bw + bGap
    })
  }

  // ── 하단 브랜딩 영역 ────────────────────────────────────
  const bottomY = imgAreaH
  const bottomH = H - bottomY
  const cx = W / 2

  // 배경
  const bottomGrad = ctx.createLinearGradient(0, bottomY, 0, H)
  bottomGrad.addColorStop(0, '#1e1b4b')
  bottomGrad.addColorStop(1, '#0f0a2b')
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, bottomY, W, bottomH)

  // 구분선
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padX, bottomY)
  ctx.lineTo(W - padX, bottomY)
  ctx.stroke()

  // 후킹 질문
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `bold ${14 * S}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('당신의 얼굴값은 얼마일까요?', cx, bottomY + 34 * S)

  // 서브 텍스트
  ctx.fillStyle = 'rgba(167,139,250,0.9)' // purple-400
  ctx.font = `${11 * S}px sans-serif`
  ctx.fillText('077.co.kr에서 AI로 지금 바로 확인해보세요', cx, bottomY + 55 * S)

  // CTA 버튼 모양
  const btnW = 160 * S
  const btnH = 32 * S
  const btnX = cx - btnW / 2
  const btnY = bottomY + 70 * S
  ctx.fillStyle = 'rgba(99,102,241,0.9)' // indigo-500
  drawRoundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${10 * S}px sans-serif`
  ctx.fillText('얼굴값 측정하기 →', cx, btnY + btnH / 2 + 4 * S)

  // 브랜드 워드마크
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.font = `${9 * S}px sans-serif`
  ctx.fillText('077.co.kr', cx, bottomY + bottomH - 12 * S)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  })
}

export default function AnalysisResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  const skinTypeInfo = analysis?.skinType ? SKIN_TYPE_MAP[analysis.skinType] : null

  const handleShare = async () => {
    if (!analysis) return
    setIsSharing(true)
    try {
      const blob = await drawShareCard(analysis, skinTypeInfo)
      const file = new File([blob], 'ggap-face-value.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 얼굴값 공개 🔥' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ggap-face-value.png'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('이미지가 저장되었습니다.')
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('Share error:', e)
        toast.error('공유에 실패했습니다.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setError('분석 결과를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    skinAnalysisApi
      .getById(Number(id))
      .then((data) => setAnalysis(data))
      .catch((err) => {
        console.error('Failed to load analysis:', err)
        setError(err.response?.data?.message || '분석 결과를 불러오는 데 실패했습니다.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="relative flex items-center justify-center h-14 px-4">
            <button onClick={() => router.back()} className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold">분석 결과</h1>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Skeleton className="h-80 w-full rounded-none" />
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="relative flex items-center justify-center h-14 px-4">
            <button onClick={() => router.back()} className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold">분석 결과</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">{error || '분석 결과를 찾을 수 없습니다.'}</p>
            <div className="space-y-3">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full" onClick={() => router.push('/camera')}>
                <Camera className="mr-2 w-4 h-4" />다시 분석하기
              </Button>
              <Button variant="outline" className="w-full rounded-full" onClick={() => router.push('/')}>홈으로</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="relative flex items-center justify-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">분석 결과</h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isSharing
              ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <Share2 className="w-5 h-5 text-gray-600" />
            }
          </button>
        </div>
      </div>

      {/* 히어로 배너 */}
      {analysis.totalFaceValue != null && (
        <div className="relative w-full h-80 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden">
          {analysis.imageUrl ? (
            <Image
              src={analysis.imageUrl}
              alt="분석 사진"
              fill
              className="object-cover object-center"
              quality={90}
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 text-white">
            <p className="text-sm text-white/70 mb-1">내 얼굴값</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">{analysis.totalFaceValue.toLocaleString()}</span>
              <span className="text-xl font-medium">원</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {skinTypeInfo && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {skinTypeInfo.icon} {skinTypeInfo.type}
                </span>
              )}
              {analysis.estimatedSkinAge != null && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  피부나이 {analysis.estimatedSkinAge}세
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 탭 콘텐츠 */}
      <div className="px-5 pt-5 pb-8">
        <Tabs defaultValue="analysis">
          <TabsList className="grid grid-cols-2 mb-5 bg-gray-100 rounded-full p-1">
            <TabsTrigger value="analysis" className="rounded-full">분석</TabsTrigger>
            <TabsTrigger value="details" className="rounded-full">상세</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {analysis.estimatedSkinAge != null && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">추정 피부 나이</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-indigo-600">{analysis.estimatedSkinAge}</span>
                  <span className="text-lg text-indigo-600">세</span>
                </div>
              </div>
            )}
            {analysis.aiSummary && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">AI 인사이트</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{analysis.aiSummary}</p>
              </div>
            )}
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full mt-2" onClick={() => router.push('/camera')}>
              <Camera className="mr-2 w-4 h-4" />다시 분석하기
            </Button>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {analysis.faceValueBreakdown && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">얼굴값 상세</p>
                <div className="space-y-2.5">
                  {[
                    { label: '기본값', value: analysis.faceValueBreakdown.baseValue },
                    { label: '피부 상태', value: analysis.faceValueBreakdown.skinValue },
                    { label: '조화도', value: analysis.faceValueBreakdown.harmonyValue },
                    { label: '인상', value: analysis.faceValueBreakdown.impressionValue },
                    { label: '나이 보정', value: analysis.faceValueBreakdown.ageBonus },
                    { label: '희소성 보정', value: analysis.faceValueBreakdown.rarityBonus },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-200 last:border-0">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value >= 0 ? '+' : ''}{item.value.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                  {analysis.faceValueBreakdown.deductions !== 0 && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-600">감점</span>
                      <span className="text-sm font-semibold text-rose-600">
                        {analysis.faceValueBreakdown.deductions.toLocaleString()}원
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {analysis.troubles && analysis.troubles.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">주요 피부 고민</p>
                <div className="space-y-4">
                  {analysis.troubles.map((trouble, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-900">
                          {TROUBLE_TYPE_MAP[trouble.troubleType] || trouble.troubleType}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOR[trouble.severity]}`}>
                          {SEVERITY_MAP[trouble.severity] || trouble.severity}
                        </span>
                      </div>
                      {trouble.description && <p className="text-xs text-gray-500 mb-1.5">{trouble.description}</p>}
                      <Progress value={trouble.score} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full mt-2" onClick={() => router.push('/camera')}>
              <Camera className="mr-2 w-4 h-4" />다시 분석하기
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
