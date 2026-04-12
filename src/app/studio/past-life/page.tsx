'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { Camera, ChevronLeft, Upload, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { pastLifeApi, skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { EraRegion, PastEra, SkinAnalysis } from '@/lib/types'
import { Suspense } from 'react'

type EraOption = { value: PastEra; emoji: string; label: string; sub: string }

const KOREA_ERAS: EraOption[] = [
  { value: 'THREE_KINGDOMS', emoji: '⚔️', label: '삼국시대', sub: '고구려·백제·신라' },
  { value: 'GORYEO', emoji: '🏺', label: '고려시대', sub: '고려 귀족·문인' },
  { value: 'JOSEON', emoji: '📜', label: '조선시대', sub: '조선 양반·규수' },
  { value: 'RETRO_60S', emoji: '🎞️', label: '1960년대', sub: '레트로 감성' },
  { value: 'RETRO_80S', emoji: '🎵', label: '1980년대', sub: '뉴트로' },
]

const WORLD_ERAS: EraOption[] = [
  { value: 'ANCIENT_EGYPT', emoji: '🏛️', label: '고대 이집트', sub: '파라오·서기관·사제' },
  { value: 'ANCIENT_GREECE', emoji: '🏺', label: '고대 그리스', sub: '아테네·스파르타' },
  { value: 'ROMAN_EMPIRE', emoji: '⚔️', label: '로마 제국', sub: '로마 시민·검투사' },
  { value: 'MEDIEVAL_EUROPE', emoji: '🏰', label: '중세 유럽', sub: '기사·음유시인·수도사' },
  { value: 'RENAISSANCE', emoji: '🎨', label: '르네상스', sub: '피렌체·베네치아 예술가' },
  { value: 'SILK_ROAD', emoji: '🐪', label: '실크로드', sub: '중앙아시아 대상(隊商)' },
  { value: 'OTTOMAN_EMPIRE', emoji: '🕌', label: '오스만 제국', sub: '이스탄불 궁정·바자르' },
  { value: 'AFRICAN_KINGDOM', emoji: '👑', label: '아프리카 왕국', sub: '말리 제국·팀북투 학자' },
  { value: 'VICTORIAN_ERA', emoji: '🎩', label: '빅토리아 시대', sub: '런던 19세기' },
  { value: 'JAZZ_AGE', emoji: '🎷', label: '1920년대 미국', sub: '재즈 에이지·뉴욕' },
]

export const ERA_LABEL: Record<PastEra, string> = {
  THREE_KINGDOMS: '삼국시대', GORYEO: '고려시대', JOSEON: '조선시대',
  RETRO_60S: '1960년대', RETRO_80S: '1980년대',
  ANCIENT_EGYPT: '고대 이집트', ANCIENT_GREECE: '고대 그리스',
  ROMAN_EMPIRE: '로마 제국', MEDIEVAL_EUROPE: '중세 유럽',
  RENAISSANCE: '르네상스', SILK_ROAD: '실크로드',
  OTTOMAN_EMPIRE: '오스만 제국', AFRICAN_KINGDOM: '아프리카 왕국',
  VICTORIAN_ERA: '빅토리아 시대', JAZZ_AGE: '1920년대 미국',
}

function PastLifeContent() {
  const router = useRouter()
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [activeRegion, setActiveRegion] = useState<EraRegion>('KOREA')
  const [selectedEra, setSelectedEra] = useState<PastEra | null>(null)
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
    const imageData = sessionStorage.getItem('pastLifeImage')
    const era = sessionStorage.getItem('pastLifeEra') as PastEra | null
    if (!imageData || !era) return
    apiCalledRef.current = true
    sessionStorage.removeItem('pastLifeImage')
    sessionStorage.removeItem('pastLifeEra')

    const [header, base64] = imageData.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const file = new File([bytes], 'face.jpg', { type: mime })

    startAnalysis({ era, image: file })
  }, [])

  const startAnalysis = async (params: { era: PastEra; skinAnalysisId?: number; image?: File }) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await pastLifeApi.create(params)
      router.push(`/studio/past-life/loading?id=${result.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403) {
        toast.error('크레딧이 부족합니다. 친구를 초대해 크레딧을 충전하세요.')
      } else {
        toast.error('전생 분석 요청에 실패했습니다.')
      }
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEra) return
    startAnalysis({ era: selectedEra, image: file })
  }

  const handleCameraCapture = () => {
    if (!selectedEra) return
    sessionStorage.setItem('pastLifeEra', selectedEra)
    router.push('/camera?returnTo=/studio/past-life')
  }

  const credit = member?.credit ?? 0
  const hasCredit = credit > 0
  const currentEras = activeRegion === 'KOREA' ? KOREA_ERAS : WORLD_ERAS

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">전생 보기</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100">
          <div className="text-3xl mb-3">📜</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">AI 전생 분석</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            사진 한 장으로 전생의 모습을 AI가 생성합니다.<br />
            시대를 선택하고 나의 전생을 만나보세요
          </p>
          {isLoaded && (
            <div className="flex items-center gap-1.5 mt-3">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600">크레딧 {credit}회 남음</span>
            </div>
          )}
        </div>
      </div>

      {/* 시대 선택 */}
      <div className="px-5 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">시대 선택</p>

        {/* 한국사 / 세계사 탭 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          {([['KOREA', '🇰🇷 한국사'], ['WORLD', '🌍 세계사']] as const).map(([region, label]) => (
            <button
              key={region}
              onClick={() => { setActiveRegion(region); setSelectedEra(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeRegion === region
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {currentEras.map((era) => {
            const isSelected = selectedEra === era.value
            return (
              <button
                key={era.value}
                onClick={() => setSelectedEra(era.value)}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{era.emoji}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>
                    {era.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{era.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 사진 선택 — 시대 선택 후 표시 */}
      {selectedEra && (
        <div className="px-5 py-5 border-t border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">사진 선택</p>

          {loadingAnalysis ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : recentAnalysis?.imageUrl ? (
            <button
              disabled={!hasCredit || submitting}
              onClick={() => startAnalysis({ era: selectedEra, skinAnalysisId: recentAnalysis.id })}
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
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-amber-600" />
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
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">전생 분석 준비 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PastLifePage() {
  return (
    <Suspense>
      <PastLifeContent />
    </Suspense>
  )
}
