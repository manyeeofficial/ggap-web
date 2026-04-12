'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { Camera, ChevronLeft, Upload, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { aiProfileApi, skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { ProfileStyle, SkinAnalysis } from '@/lib/types'
import { Suspense } from 'react'

const STYLES: {
  value: ProfileStyle
  label: string
  emoji: string
  editorialIntro: string
  wittyCaption: string
  isPopular?: boolean
}[] = [
  {
    value: 'ID_PHOTO',
    label: '증명사진',
    emoji: '🪪',
    editorialIntro: '단정하고 신뢰감 있는 프로페셔널한 한 장',
    wittyCaption: '면접관이 서류 먼저 통과시킬 비주얼',
  },
  {
    value: 'CELEBRITY',
    label: '연예인 화보',
    emoji: '⭐',
    editorialIntro: '패션 에디터가 \'커버 감이다\' 고개 끄덕이는 화보',
    wittyCaption: '매니저가 \'아직 스케줄 남았어요\'라고 말릴 것 같은 화보',
    isPopular: true,
  },
  {
    value: 'WEBTOON',
    label: '웹툰 캐릭터',
    emoji: '💬',
    editorialIntro: '국내 최대 플랫폼 목요 연재 주인공 포스',
    wittyCaption: '네이버 웹툰 주인공 공석 채울 비주얼',
  },
  {
    value: 'GHIBLI',
    label: '지브리',
    emoji: '🌿',
    editorialIntro: '미야자키 감독이 직접 스케치했을 법한 따뜻함',
    wittyCaption: '피아노 BGM 깔리는 그 장면',
    isPopular: true,
  },
  {
    value: 'YEARBOOK',
    label: '졸업사진',
    emoji: '🎓',
    editorialIntro: '세대를 초월한 클래식 학창 시절의 순수함',
    wittyCaption: '하버드 옆 동네 졸업이라도 이 사진이면 OK',
  },
  {
    value: 'POP_ART',
    label: '팝아트',
    emoji: '🎨',
    editorialIntro: '앤디 워홀이 선택했을 강렬한 색감의 아이콘',
    wittyCaption: 'MoMA에 걸어도 \'오, 누구지?\' 반응',
  },
  {
    value: 'WATERCOLOR',
    label: '수채화 초상',
    emoji: '🖌️',
    editorialIntro: '미술관 특별전 초청 작가 인물화 수준',
    wittyCaption: '\'이 모델 누구예요?\' 질문 받을 초상화',
  },
  {
    value: 'RETRO_90S',
    label: '90년대 레트로',
    emoji: '📼',
    editorialIntro: '시간을 거스르는 빈티지 필름 감성',
    wittyCaption: '선배한테 \'너 몇 반이야?\' 들을 비주얼',
  },
  {
    value: 'THREE_D_AVATAR',
    label: '3D 캐릭터',
    emoji: '🤖',
    editorialIntro: '픽사 스튜디오 애니메이션 주인공급 입체감',
    wittyCaption: '픽사에서 캐스팅 제의 올 법한 3D 비주얼',
  },
  {
    value: 'BW_CLASSIC',
    label: '흑백 클래식',
    emoji: '🎞️',
    editorialIntro: '시대를 관통하는 자서전 표지감의 품격',
    wittyCaption: '자서전 표지에 써도 될 클래식한 한 장',
  },
]

function AiProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [selectedStyle, setSelectedStyle] = useState<ProfileStyle | null>(
    (searchParams.get('style') as ProfileStyle | null) ?? null
  )
  const [recentAnalysis, setRecentAnalysis] = useState<SkinAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiCalledRef = useRef(false)

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  useEffect(() => {
    skinAnalysisApi
      .getList(0, 1)
      .then((data) => {
        const completed = data.find((a) => a.status === 'COMPLETED' && a.imageUrl)
        setRecentAnalysis(completed ?? null)
      })
      .catch(() => {})
      .finally(() => setLoadingAnalysis(false))
  }, [])

  // 카메라에서 돌아왔을 때
  useEffect(() => {
    if (apiCalledRef.current) return
    const imageData = sessionStorage.getItem('aiProfileImage')
    const style = sessionStorage.getItem('aiProfileStyle') as ProfileStyle | null
    if (!imageData || !style) return
    apiCalledRef.current = true
    sessionStorage.removeItem('aiProfileImage')
    sessionStorage.removeItem('aiProfileStyle')

    const [header, base64] = imageData.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const file = new File([bytes], 'face.jpg', { type: mime })

    startAnalysis({ image: file, style })
  }, [])

  const startAnalysis = async (params: { skinAnalysisId?: number; image?: File; style: ProfileStyle }) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await aiProfileApi.create(params)
      router.push(`/studio/ai-profile/loading?id=${result.id}&style=${params.style}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403) {
        toast.error('크레딧이 부족합니다. 친구를 초대해 크레딧을 충전하세요.')
      } else {
        toast.error('AI 프로필 생성 요청에 실패했습니다.')
      }
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedStyle) return
    startAnalysis({ image: file, style: selectedStyle })
  }

  const handleCameraCapture = () => {
    if (!selectedStyle) return
    sessionStorage.setItem('aiProfileStyle', selectedStyle)
    router.push('/camera?returnTo=/studio/ai-profile')
  }

  const credit = member?.credit ?? 0
  const hasCredit = credit > 0

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">AI 프로필</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-5 border border-pink-100">
          <div className="text-3xl mb-3">🎨</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">AI 프로필 사진 생성</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            10가지 스타일로 나만의 AI 프로필 사진을 만들어보세요<br />
            세로형 3:4 비율로 프사·공유에 최적화된 화질로 생성돼요
          </p>
          {isLoaded && (
            <div className="flex items-center gap-1.5 mt-3">
              <Zap className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-xs font-semibold text-pink-600">크레딧 {credit}회 남음</span>
            </div>
          )}
        </div>
      </div>

      {/* 스타일 선택 */}
      <div className="px-5 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">스타일 선택</p>
        <div className="grid grid-cols-2 gap-3">
          {STYLES.map((style) => {
            const isSelected = selectedStyle === style.value
            return (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-pink-400 bg-pink-50 shadow-sm'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                {style.isPopular && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">
                    인기
                  </span>
                )}
                <span className="text-2xl mb-2">{style.emoji}</span>
                <p className={`text-sm font-bold mb-1 ${isSelected ? 'text-pink-700' : 'text-gray-800'}`}>
                  {style.label}
                </p>
                <p className={`text-[11px] leading-snug ${isSelected ? 'text-pink-500' : 'text-gray-400'}`}>
                  {style.editorialIntro}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 사진 선택 — 스타일 선택 후 표시 */}
      {selectedStyle && (
        <div className="px-5 py-5 border-t border-gray-100 space-y-3">
          <div className="mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">사진 선택</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {STYLES.find(s => s.value === selectedStyle)?.wittyCaption}
            </p>
          </div>

          {loadingAnalysis ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : recentAnalysis?.imageUrl ? (
            <button
              disabled={!hasCredit || submitting}
              onClick={() => startAnalysis({ skinAnalysisId: recentAnalysis.id, style: selectedStyle })}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={recentAnalysis.imageUrl}
                  alt="최근 분석 사진"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">최근 분석 사진 사용</p>
                <p className="text-xs text-gray-400 mt-0.5">가장 최근에 분석한 사진으로 시작하기</p>
              </div>
            </button>
          ) : null}

          <button
            disabled={!hasCredit || submitting}
            onClick={handleCameraCapture}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">새로 촬영하기</p>
              <p className="text-xs text-gray-400 mt-0.5">카메라로 지금 바로 찍기</p>
            </div>
          </button>

          <button
            disabled={!hasCredit || submitting}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">사진 불러오기</p>
              <p className="text-xs text-gray-400 mt-0.5">갤러리에서 사진 선택</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* 크레딧 부족 안내 */}
      {isLoaded && !hasCredit && (
        <div className="px-5">
          <div className="bg-rose-50 rounded-2xl px-4 py-3.5 border border-rose-100">
            <p className="text-sm font-semibold text-rose-700 mb-1">크레딧이 부족해요</p>
            <p className="text-xs text-rose-500">친구를 초대하면 +3회 크레딧을 받을 수 있어요</p>
            <Button
              size="sm"
              className="mt-3 bg-rose-600 hover:bg-rose-700 rounded-full"
              onClick={() => router.push('/settings')}
            >
              크레딧 충전하기
            </Button>
          </div>
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-6 py-5 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">AI 프로필 준비 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AiProfilePage() {
  return (
    <Suspense>
      <AiProfileContent />
    </Suspense>
  )
}
