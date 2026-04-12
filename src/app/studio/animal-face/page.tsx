'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { Camera, ChevronLeft, Upload, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { animalFaceApi, skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import type { SkinAnalysis } from '@/lib/types'
import { Suspense } from 'react'

function AnimalFaceContent() {
  const router = useRouter()
  const { member, isLoaded, fetchMember } = useMemberStore()
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
    const imageData = sessionStorage.getItem('animalFaceImage')
    if (!imageData) return
    apiCalledRef.current = true
    sessionStorage.removeItem('animalFaceImage')

    const [header, base64] = imageData.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const file = new File([bytes], 'face.jpg', { type: mime })

    startAnalysis({ image: file })
  }, [])

  const startAnalysis = async (params: { skinAnalysisId?: number; image?: File }) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await animalFaceApi.create(params)
      router.push(`/studio/animal-face/loading?id=${result.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403) {
        toast.error('크레딧이 부족합니다. 친구를 초대해 크레딧을 충전하세요.')
      } else {
        toast.error('동물상 분석 요청에 실패했습니다.')
      }
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    startAnalysis({ image: file })
  }

  const handleCameraCapture = () => {
    router.push('/camera?returnTo=/studio/animal-face')
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
        <h1 className="text-lg font-bold text-gray-900 ml-2">동물상 분석</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-3xl p-5 border border-orange-100">
          <div className="text-3xl mb-3">🦊</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">동물상 분석</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            내 얼굴과 가장 닮은 동물은? 동물 습성과<br />
            당신의 실제 성격 대조 분석
          </p>
          {isLoaded && (
            <div className="flex items-center gap-1.5 mt-3">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600">크레딧 {credit}회 남음</span>
            </div>
          )}
        </div>
      </div>

      {/* 사진 선택 */}
      <div className="px-5 py-6 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">사진 선택</p>

        {/* 최근 분석 사진 사용 */}
        {loadingAnalysis ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : recentAnalysis?.imageUrl ? (
          <button
            disabled={!hasCredit || submitting}
            onClick={() => startAnalysis({ skinAnalysisId: recentAnalysis.id })}
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
          <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Camera className="w-6 h-6 text-orange-600" />
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
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">동물상 분석 준비 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnimalFacePage() {
  return (
    <Suspense>
      <AnimalFaceContent />
    </Suspense>
  )
}
