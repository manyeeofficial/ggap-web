'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, ChevronLeft, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/app/components/ui/skeleton'
import { faceCodeApi, skinAnalysisApi } from '@/lib/api'
import type { SkinAnalysis } from '@/lib/types'

function FaceCodeEntryContent() {
  const router = useRouter()
  const [recentAnalysis, setRecentAnalysis] = useState<SkinAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiCalledRef = useRef(false)

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

  // 카메라에서 돌아왔을 때 (전용 sessionStorage key)
  useEffect(() => {
    if (apiCalledRef.current) return
    const imageData = sessionStorage.getItem('faceCodeImage')
    if (!imageData) return
    apiCalledRef.current = true
    sessionStorage.removeItem('faceCodeImage')

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
      const result = await faceCodeApi.create(params)
      router.push(`/loading?type=face-code&id=${result.id}`)
    } catch {
      toast.error('낯빛코드 분석 요청에 실패했습니다.')
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    startAnalysis({ image: file })
  }

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">낯빛코드</h1>
      </div>

      {/* 소개 */}
      <div className="px-5 pb-6 border-b border-gray-100">
        <div className="bg-gradient-to-br from-fuchsia-50 to-violet-50 rounded-3xl p-5 border border-fuchsia-100">
          <div className="text-3xl mb-3">🔮</div>
          <h2 className="text-base font-bold text-gray-900 mb-1">12유형 얼굴 성격 분석</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            얼굴 인상을 세 글자 코드로 풀어<br />
            성격·강점·궁합을 알려드려요
          </p>
        </div>
      </div>

      {/* 사진 선택 */}
      <div className="px-5 py-6 space-y-4">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">사진 선택</p>

        {loading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : recentAnalysis?.imageUrl ? (
          <button
            disabled={submitting}
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
              <p className="text-xs text-gray-400 mt-0.5">관상 점수가 있으면 더 빠르게 분석돼요</p>
            </div>
          </button>
        ) : null}

        <button
          disabled={submitting}
          onClick={() => router.push('/camera?returnTo=/studio/face-code')}
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
            <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">분석 준비 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FaceCodeEntryPage() {
  return (
    <Suspense>
      <FaceCodeEntryContent />
    </Suspense>
  )
}
