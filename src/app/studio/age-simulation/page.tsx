'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { Camera, ChevronLeft, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { ageSimulationApi, skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { SkinAnalysis } from '@/lib/types'
import { Suspense } from 'react'

const AGE_PRESETS = [10, 20, 30, 40, 50, 60, 70, 80]

function AgeSimulationContent() {
  const router = useRouter()
  const { isLoaded, fetchMember } = useMemberStore()
  const [selectedAge, setSelectedAge] = useState(60)
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
    const imageData = sessionStorage.getItem('ageSimulationImage')
    const ageStr = sessionStorage.getItem('ageSimulationTargetAge')
    if (!imageData || !ageStr) return
    apiCalledRef.current = true
    sessionStorage.removeItem('ageSimulationImage')
    sessionStorage.removeItem('ageSimulationTargetAge')

    const [header, base64] = imageData.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const file = new File([bytes], 'face.jpg', { type: mime })

    startAnalysis({ image: file, targetAge: Number(ageStr) })
  }, [])

  const startAnalysis = async (params: { skinAnalysisId?: number; image?: File; targetAge: number }) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await ageSimulationApi.create(params)
      router.push(`/studio/age-simulation/loading?id=${result.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403) {
        toast.error('크레딧이 부족합니다. 친구를 초대해 크레딧을 충전하세요.')
      } else {
        toast.error('나이 시뮬레이션 요청에 실패했습니다.')
      }
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    startAnalysis({ image: file, targetAge: selectedAge })
  }

  const handleCameraCapture = () => {
    sessionStorage.setItem('ageSimulationTargetAge', String(selectedAge))
    router.push('/camera?returnTo=/studio/age-simulation')
  }

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">나이 시뮬레이션</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">나이 시뮬레이션</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            10살부터 100살까지, 나이대별 모습을<br />
            AI가 생성합니다. 미래의 내 모습은?
          </p>
        </div>
      </div>

      {/* 나이 선택 */}
      <div className="px-5 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">나이 선택</p>

        {/* 현재 선택된 나이 표시 */}
        <div className="text-center mb-4">
          <p className="text-5xl font-black text-amber-600">{selectedAge}</p>
          <p className="text-sm text-gray-400 mt-1">세</p>
        </div>

        {/* 슬라이더 */}
        <div className="mb-5">
          <input
            type="range"
            min={5}
            max={100}
            value={selectedAge}
            onChange={(e) => setSelectedAge(Number(e.target.value))}
            className="w-full h-2 bg-amber-100 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5세</span>
            <span>100세</span>
          </div>
        </div>

        {/* 프리셋 버튼 */}
        <div className="grid grid-cols-4 gap-2">
          {AGE_PRESETS.map((age) => (
            <button
              key={age}
              onClick={() => setSelectedAge(age)}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedAge === age
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              {age}세
            </button>
          ))}
        </div>
      </div>

      {/* 사진 선택 */}
      <div className="px-5 py-5 border-t border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">사진 선택</p>

        {loadingAnalysis ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : recentAnalysis?.imageUrl ? (
          <button
            disabled={submitting}
            onClick={() => startAnalysis({ skinAnalysisId: recentAnalysis.id, targetAge: selectedAge })}
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
          disabled={submitting}
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
          disabled={submitting}
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

      {submitting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-6 py-5 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">나이 시뮬레이션 준비 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgeSimulationPage() {
  return (
    <Suspense>
      <AgeSimulationContent />
    </Suspense>
  )
}
