'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { Camera, ChevronLeft, Zap, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { faceReadingApi, skinAnalysisApi, memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { SkinAnalysis } from '@/lib/types'
import { Suspense } from 'react'

// ─── 생년월일 입력 단계 ────────────────────────────────

function BirthdateStep({
  onComplete,
  onSkip,
}: {
  onComplete: (birthdate: string, isLunar: boolean) => void
  onSkip: () => void
}) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [isLunar, setIsLunar] = useState(false)

  const isValid = year.length === 4 && Number(year) >= 1900 && Number(year) <= currentYear
    && month.length > 0 && day.length > 0

  const handleComplete = () => {
    if (!isValid) return
    const mm = String(Number(month)).padStart(2, '0')
    const dd = String(Number(day)).padStart(2, '0')
    onComplete(`${year}-${mm}-${dd}`, isLunar)
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="px-5 py-5 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">생년월일 (선택)</p>
      <p className="text-xs text-gray-400 mb-4">
        사주 오행 정보를 활용하면 관상 분석이 더욱 정교해져요
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          placeholder="년도 (예: 1995)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="flex-1 h-11 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-20 h-11 border border-gray-200 rounded-xl px-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          <option value="">월</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="w-20 h-11 border border-gray-200 rounded-xl px-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          <option value="">일</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}일</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={isLunar}
          onChange={(e) => setIsLunar(e.target.checked)}
          className="w-4 h-4 accent-violet-600"
        />
        <span className="text-sm text-gray-600">음력으로 입력</span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500"
        >
          건너뛰기
        </button>
        <button
          disabled={!isValid}
          onClick={handleComplete}
          className="flex-[2] h-11 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-40"
        >
          사주 포함해서 분석하기
        </button>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function FaceReadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [recentAnalysis, setRecentAnalysis] = useState<SkinAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showBirthdateStep, setShowBirthdateStep] = useState(false)
  const [pendingParams, setPendingParams] = useState<{ skinAnalysisId?: number; image?: File } | null>(null)
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
      .finally(() => setLoading(false))
  }, [])

  // 카메라에서 돌아왔을 때
  useEffect(() => {
    if (apiCalledRef.current) return
    const imageData = sessionStorage.getItem('faceReadingImage')
    if (!imageData) return
    apiCalledRef.current = true
    sessionStorage.removeItem('faceReadingImage')

    const [header, base64] = imageData.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const file = new File([bytes], 'face.jpg', { type: mime })

    // 이미 생년월일이 저장된 회원은 바로 분석
    if (member?.birthdate) {
      startAnalysis({ image: file })
    } else {
      setPendingParams({ image: file })
      setShowBirthdateStep(true)
    }
  }, [member])

  const startAnalysis = async (params: { skinAnalysisId?: number; image?: File }) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await faceReadingApi.create(params)
      router.push(`/studio/face-reading/loading?id=${result.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403) {
        toast.error('크레딧이 부족합니다. 친구를 초대해 크레딧을 충전하세요.')
      } else {
        toast.error('관상 분석 요청에 실패했습니다.')
      }
      setSubmitting(false)
    }
  }

  const handlePhotoSelected = (params: { skinAnalysisId?: number; image?: File }) => {
    // 이미 생년월일이 저장된 회원은 바로 분석
    if (member?.birthdate) {
      startAnalysis(params)
    } else {
      setPendingParams(params)
      setShowBirthdateStep(true)
    }
  }

  const handleBirthdateComplete = async (birthdate: string, isLunar: boolean) => {
    // 생년월일 저장 (fire-and-forget)
    memberApi.updateBirthdate(birthdate, isLunar).catch(() => {})
    setShowBirthdateStep(false)
    if (pendingParams) startAnalysis(pendingParams)
  }

  const handleBirthdateSkip = () => {
    setShowBirthdateStep(false)
    if (pendingParams) startAnalysis(pendingParams)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handlePhotoSelected({ image: file })
  }

  const handleCameraCapture = () => {
    router.push('/camera?returnTo=/studio/face-reading')
  }

  const credit = member?.credit ?? 0
  const hasCredit = credit > 0

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="flex items-center px-4 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">관상보기</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-5 border border-violet-100">
          <div className="text-3xl mb-3">👁️</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">전통 동양 관상학 분석</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            이마·눈·코·입 등 9개 부위를 분석해<br />
            숨겨진 운세와 기질을 알려드려요
          </p>
          {isLoaded && (
            <div className="flex items-center gap-1.5 mt-3">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600">크레딧 {credit}회 남음</span>
            </div>
          )}
        </div>
      </div>

      {/* 사진 선택 */}
      {!showBirthdateStep && (
        <div className="px-5 py-6 space-y-4">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">사진 선택</p>

          {/* 최근 분석 사진 사용 */}
          {loading ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : recentAnalysis?.imageUrl ? (
            <button
              disabled={!hasCredit || submitting}
              onClick={() => handlePhotoSelected({ skinAnalysisId: recentAnalysis.id })}
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

          {/* 카메라 촬영 */}
          <button
            disabled={!hasCredit || submitting}
            onClick={handleCameraCapture}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">새로 촬영하기</p>
              <p className="text-xs text-gray-400 mt-0.5">카메라로 지금 바로 찍기</p>
            </div>
          </button>

          {/* 파일 업로드 */}
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

      {/* 생년월일 입력 단계 */}
      {showBirthdateStep && (
        <BirthdateStep
          onComplete={handleBirthdateComplete}
          onSkip={handleBirthdateSkip}
        />
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
            <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">분석 준비 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FaceReadingPage() {
  return (
    <Suspense>
      <FaceReadingContent />
    </Suspense>
  )
}
