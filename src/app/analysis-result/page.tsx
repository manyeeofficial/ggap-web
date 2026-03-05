'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Progress } from '@/app/components/ui/progress'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { ArrowLeft, Camera, Share2, Sparkles, AlertCircle, Download } from 'lucide-react'
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

function AnalysisResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!shareCardRef.current || !analysis) return
    setIsSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'ggap-face-value.png', { type: 'image/png' })

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: '나의 얼굴값 공개 🔥' })
        } else {
          // Web Share API 미지원 시 이미지 다운로드 fallback
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'ggap-face-value.png'
          a.click()
          URL.revokeObjectURL(url)
          toast.success('이미지가 저장되었습니다.')
        }
      }, 'image/png')
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('공유에 실패했습니다.')
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
      .then((data) => {
        setAnalysis(data)
      })
      .catch((err) => {
        console.error('Failed to load analysis:', err)
        setError(err.response?.data?.message || '분석 결과를 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="relative flex items-center justify-center h-14 px-4">
            <button
              onClick={() => router.back()}
              className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold">분석 결과</h1>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
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
            <button
              onClick={() => router.back()}
              className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
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
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full"
                onClick={() => router.push('/camera')}
              >
                <Camera className="mr-2 w-4 h-4" />다시 분석하기
              </Button>
              <Button variant="outline" className="w-full rounded-full" onClick={() => router.push('/')}>
                홈으로
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const skinTypeInfo = analysis.skinType ? SKIN_TYPE_MAP[analysis.skinType] : null

  return (
    <div className="min-h-screen bg-white">
      {/* 공유용 캡처 카드 (화면 밖 렌더링) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <div
          ref={shareCardRef}
          style={{ width: 390, fontFamily: 'sans-serif' }}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex flex-col items-center gap-6"
        >
          {/* 사진 */}
          {analysis.imageUrl ? (
            <div className="w-36 h-36 rounded-3xl overflow-hidden ring-4 ring-white/30 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={analysis.imageUrl} alt="" className="w-full h-full object-cover object-center" crossOrigin="anonymous" />
            </div>
          ) : (
            <div className="w-36 h-36 rounded-3xl bg-white/10 flex items-center justify-center text-6xl">👤</div>
          )}

          {/* 얼굴값 */}
          <div className="text-center text-white">
            <p className="text-sm text-white/60 mb-1">내 얼굴값</p>
            <p className="text-5xl font-bold tracking-tight">
              {analysis.totalFaceValue?.toLocaleString()}
              <span className="text-2xl font-semibold ml-1">원</span>
            </p>
          </div>

          {/* 배지 */}
          <div className="flex gap-2 flex-wrap justify-center">
            {skinTypeInfo && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
                {skinTypeInfo.icon} {skinTypeInfo.type}
              </span>
            )}
            {analysis.estimatedSkinAge != null && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
                피부나이 {analysis.estimatedSkinAge}세
              </span>
            )}
          </div>

          {/* 브랜딩 */}
          <p className="text-white/40 text-xs mt-2">ggap.ai · 얼굴값 췍! 🔥</p>
        </div>
      </div>
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
        <div className="relative">
          {/* 이미지 영역 */}
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
            {/* 하단 그라디언트 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* 오버레이 텍스트 */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 text-white">
              <p className="text-sm text-white/70 mb-1">내 얼굴값</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                  {analysis.totalFaceValue.toLocaleString()}
                </span>
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
        </div>
      )}

      {/* 탭 콘텐츠 */}
      <div className="px-5 pt-5 pb-8">
        <Tabs defaultValue="analysis">
          <TabsList className="grid grid-cols-2 mb-5 bg-gray-100 rounded-full p-1">
            <TabsTrigger value="analysis" className="rounded-full">분석</TabsTrigger>
            <TabsTrigger value="details" className="rounded-full">상세</TabsTrigger>
          </TabsList>

          {/* 분석 탭 */}
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

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full mt-2"
              onClick={() => router.push('/camera')}
            >
              <Camera className="mr-2 w-4 h-4" />다시 분석하기
            </Button>
          </TabsContent>

          {/* 상세 탭 */}
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
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 border-b border-gray-200 last:border-0"
                    >
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
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOR[trouble.severity]}`}
                        >
                          {SEVERITY_MAP[trouble.severity] || trouble.severity}
                        </span>
                      </div>
                      {trouble.description && (
                        <p className="text-xs text-gray-500 mb-1.5">{trouble.description}</p>
                      )}
                      <Progress value={trouble.score} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full mt-2"
              onClick={() => router.push('/camera')}
            >
              <Camera className="mr-2 w-4 h-4" />다시 분석하기
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AnalysisResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-32 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      }
    >
      <AnalysisResultContent />
    </Suspense>
  )
}
