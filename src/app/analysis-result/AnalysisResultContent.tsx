'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Progress } from '@/app/components/ui/progress'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { ArrowLeft, Camera, Sparkles, AlertCircle, Lock } from 'lucide-react'
import { skinAnalysisApi } from '@/lib/api'
import type { SkinAnalysis, TroubleType, Severity, PersonalColor } from '@/lib/types'
import { SocialLoginSheet } from '@/app/components/SocialLoginSheet'

const PERSONAL_COLOR_MAP: Record<PersonalColor, { displayName: string; season: string; bgColor: string; textColor: string }> = {
  SPRING_PALE:   { displayName: '봄 페일',   season: '봄',  bgColor: 'bg-yellow-50',  textColor: 'text-yellow-700' },
  SPRING_LIGHT:  { displayName: '봄 라이트', season: '봄',  bgColor: 'bg-yellow-50',  textColor: 'text-yellow-700' },
  SPRING_BRIGHT: { displayName: '봄 브라이트', season: '봄', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  SPRING_TRUE:   { displayName: '봄 트루',   season: '봄',  bgColor: 'bg-yellow-50',  textColor: 'text-yellow-700' },
  SUMMER_PALE:   { displayName: '여름 페일', season: '여름', bgColor: 'bg-blue-50',   textColor: 'text-blue-700' },
  SUMMER_LIGHT:  { displayName: '여름 라이트', season: '여름', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  SUMMER_MUTE:   { displayName: '여름 뮤트', season: '여름', bgColor: 'bg-blue-50',   textColor: 'text-blue-700' },
  SUMMER_TRUE:   { displayName: '여름 트루', season: '여름', bgColor: 'bg-blue-50',   textColor: 'text-blue-700' },
  AUTUMN_SOFT:   { displayName: '가을 소프트', season: '가을', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  AUTUMN_MUTE:   { displayName: '가을 뮤트', season: '가을', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  AUTUMN_DEEP:   { displayName: '가을 딥',   season: '가을', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  AUTUMN_TRUE:   { displayName: '가을 트루', season: '가을', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  WINTER_BRIGHT: { displayName: '겨울 브라이트', season: '겨울', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  WINTER_DEEP:   { displayName: '겨울 딥',   season: '겨울', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  WINTER_TRUE:   { displayName: '겨울 트루', season: '겨울', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  WINTER_PALE:   { displayName: '겨울 페일', season: '겨울', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
}

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

const STUDIO_FEATURES = [
  { label: '관상보기', icon: '👁️', desc: '9개 부위 관상 분석' },
  { label: '동물상', icon: '🐻', desc: '내 닮은 동물 찾기' },
  { label: 'AI 프로필', icon: '✨', desc: '10가지 스타일 프로필' },
  { label: 'MBTI 매칭', icon: '💘', desc: '피부로 보는 MBTI' },
  { label: '나이 시뮬', icon: '⏳', desc: '10년 후 내 얼굴은?' },
  { label: '전생/후생', icon: '🔮', desc: '전생과 후생 탐구' },
]

export default function AnalysisResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const token = searchParams.get('token')
  const isAnonymous = !!token

  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loginSheetOpen, setLoginSheetOpen] = useState(false)

  const skinTypeInfo = analysis?.skinType ? SKIN_TYPE_MAP[analysis.skinType] : null

  useEffect(() => {
    if (!id) {
      setError('분석 결과를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    const apiCall = token
      ? skinAnalysisApi.getByIdWithToken(Number(id), token)
      : skinAnalysisApi.getById(Number(id))

    apiCall
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
            <h1 className="text-base font-semibold">얼굴값 분석 결과</h1>
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
            <h1 className="text-base font-semibold">얼굴값 분석 결과</h1>
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
      <SocialLoginSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} />

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="relative flex items-center justify-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">얼굴값 분석 결과</h1>
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
            {isAnonymous ? (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                  {(() => {
                    const s = analysis.totalFaceValue.toLocaleString()
                    return (
                      <>
                        {s.length > 7 && (
                          <span className="blur-[8px] select-none">{s.slice(0, s.length - 7)}</span>
                        )}
                        {s.slice(-7)}
                      </>
                    )
                  })()}
                </span>
                <span className="text-xl font-medium">원</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{analysis.totalFaceValue.toLocaleString()}</span>
                <span className="text-xl font-medium">원</span>
              </div>
            )}
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

      {/* 브랜딩 배너 */}
      <div className="bg-gradient-to-r from-indigo-950 to-purple-950 px-5 py-3 flex items-center justify-between">
        <p className="text-xs text-white/60">
          <span className="text-white/90 font-semibold">077.co.kr</span>에서 내 얼굴값을 확인해보세요
        </p>
        <span className="text-xs text-indigo-300 font-medium shrink-0">ggap.ai</span>
      </div>

      {/* 비회원 — 추가 기능 미리보기 */}
      {isAnonymous && (
        <div className="px-5 py-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">가입하면 이런 기능도 사용 가능</p>
          <div className="grid grid-cols-3 gap-2">
            {STUDIO_FEATURES.map((f) => (
              <button
                key={f.label}
                onClick={() => setLoginSheetOpen(true)}
                className="rounded-2xl bg-gray-50 p-3 text-center w-full active:bg-gray-100 transition-colors"
              >
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs font-semibold text-gray-700">{f.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
              </button>
            ))}
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

          <div className="relative">
            {/* 실제 콘텐츠 — 비회원이면 블러 */}
            <div className={isAnonymous ? 'blur-md pointer-events-none select-none' : ''}>
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
                {analysis.personalColor && (() => {
                  const pc = PERSONAL_COLOR_MAP[analysis.personalColor!]
                  return (
                    <div className={`rounded-2xl p-5 ${pc.bgColor}`}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">퍼스널 컬러</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${pc.textColor}`}>{pc.displayName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 ${pc.textColor}`}>{pc.season}톤</span>
                      </div>
                    </div>
                  )
                })()}
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
            </div>

            {/* 비회원 잠금 오버레이 */}
            {isAnonymous && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-[3px] rounded-2xl min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">상세 결과는 로그인 후 확인</p>
                  <p className="text-xs text-gray-500 mt-0.5">피부 나이·퍼스널 컬러·AI 인사이트 전체 공개</p>
                </div>
                <button
                  onClick={() => {
                    if (id && token) {
                      localStorage.setItem('pendingAnalysisClaim', JSON.stringify({ id, token }))
                    }
                    setLoginSheetOpen(true)
                  }}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  로그인하기
                </button>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
