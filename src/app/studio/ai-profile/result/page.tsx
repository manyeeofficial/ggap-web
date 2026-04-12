'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, Share2, Download, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import { toast } from 'sonner'
import { aiProfileApi } from '@/lib/api'
import type { AiProfile, ProfileStyle } from '@/lib/types'

const STYLE_LABEL: Record<ProfileStyle, string> = {
  ID_PHOTO: '증명사진',
  CELEBRITY: '연예인 화보',
  WEBTOON: '웹툰 캐릭터',
  GHIBLI: '지브리',
  YEARBOOK: '졸업사진',
  POP_ART: '팝아트',
  WATERCOLOR: '수채화 초상',
  RETRO_90S: '90s 레트로',
  THREE_D_AVATAR: '3D 캐릭터',
  BW_CLASSIC: '흑백 클래식',
}

const STYLE_EMOJI: Record<ProfileStyle, string> = {
  ID_PHOTO: '🪪',
  CELEBRITY: '⭐',
  WEBTOON: '💬',
  GHIBLI: '🌿',
  YEARBOOK: '🎓',
  POP_ART: '🎨',
  WATERCOLOR: '🖌️',
  RETRO_90S: '📼',
  THREE_D_AVATAR: '🤖',
  BW_CLASSIC: '🎞️',
}

// ─── 저장/공유 바텀시트 ──────────────────────────────────

function SaveBottomSheet({
  imageUrl,
  hdImageUrl,
  onClose,
}: {
  imageUrl: string
  hdImageUrl?: string
  onClose: () => void
}) {
  const [downloading, setDownloading] = useState(false)

  const downloadImage = async (url: string, filename: string) => {
    setDownloading(true)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)
      toast.success('이미지를 저장했습니다.')
      onClose()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  const handleNativeShare = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'ai-profile.jpg', { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 AI 프로필 🎨' })
        onClose()
      } else {
        await downloadImage(imageUrl, 'ai-profile.jpg')
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error('공유에 실패했습니다.')
      }
    }
  }

  return (
    <>
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-5 pb-10 pt-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
          <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-4">저장 및 공유</h3>

        <div className="space-y-2.5">
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 text-pink-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">공유하기</p>
              <p className="text-xs text-gray-400 mt-0.5">카카오톡, 인스타그램 등으로 공유</p>
            </div>
          </button>

          <button
            disabled={downloading}
            onClick={() => downloadImage(imageUrl, 'ai-profile.jpg')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">사진 저장</p>
              <p className="text-xs text-gray-400 mt-0.5">갤러리에 저장하기</p>
            </div>
          </button>

          {hdImageUrl && hdImageUrl !== imageUrl && (
            <button
              disabled={downloading}
              onClick={() => downloadImage(hdImageUrl, 'ai-profile-hd.jpg')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">고화질 원본 저장</p>
                <p className="text-xs text-gray-400 mt-0.5">워터마크 없는 원본 이미지</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── 만족도 UI ───────────────────────────────────────────

function SatisfactionBar({ onRetry }: { onRetry: () => void }) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  const handleVote = (vote: 'up' | 'down') => {
    setVoted(vote)
    if (vote === 'up') {
      toast.success('피드백 감사해요! 더 좋은 결과를 만들어갈게요 🎉')
    } else {
      toast('다시 생성해 보세요', { description: '스타일을 바꾸거나 다른 사진으로 시도해보세요' })
    }
  }

  if (voted) {
    return (
      <div className="px-5 py-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          {voted === 'up' ? '👍 피드백 감사해요!' : '다시 도전해보세요!'}
        </p>
        {voted === 'down' && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-pink-600 underline underline-offset-2"
          >
            다시 생성하기
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
      <p className="text-sm text-gray-500">이 결과가 마음에 드셨나요?</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleVote('up')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-colors text-gray-500 hover:text-green-600"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-semibold">좋아요</span>
        </button>
        <button
          onClick={() => handleVote('down')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 hover:bg-rose-50 hover:border-rose-200 transition-colors text-gray-500 hover:text-rose-600"
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-xs font-semibold">별로예요</span>
        </button>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function AiProfileResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<AiProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSaveSheet, setShowSaveSheet] = useState(false)

  useEffect(() => {
    if (!id) {
      router.replace('/studio/ai-profile')
      return
    }
    aiProfileApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/ai-profile')
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
          <Skeleton className="aspect-[3/4] rounded-3xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const currentStyleLabel = result.style ? STYLE_LABEL[result.style] : '스타일'
  const currentStyleEmoji = result.style ? STYLE_EMOJI[result.style] : '🎨'

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
        <h1 className="text-lg font-bold text-gray-900 ml-2">AI 프로필 결과</h1>
      </div>

      {/* 스타일 레이블 */}
      <div className="px-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          {currentStyleEmoji} {currentStyleLabel} 스타일
        </p>
        {result.wittyOneLiner && (
          <p className="text-lg font-bold text-gray-900 leading-snug">
            <span className="text-pink-600">"{result.wittyOneLiner}"</span>
          </p>
        )}
      </div>

      {/* 생성된 이미지 — 3:4 세로형 */}
      <div className="px-5 mb-5">
        {result.generatedImageUrl ? (
          <div className="rounded-3xl overflow-hidden bg-gray-100 aspect-[3/4] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.generatedImageUrl}
              alt="AI 생성 프로필"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-3xl bg-gray-100 aspect-[3/4] flex items-center justify-center">
            <p className="text-gray-400 text-sm">이미지 준비 중...</p>
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      {result.generatedImageUrl && (
        <div className="px-5 mb-5">
          <button
            onClick={() => setShowSaveSheet(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            프사로 저장
          </button>
        </div>
      )}

      {/* 만족도 */}
      <SatisfactionBar onRetry={() => router.push('/studio/ai-profile')} />

      {/* 추천 스타일 */}
      {result.recommendedStyles.length > 0 && (
        <div className="px-5 mt-4 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">다른 스타일도 해보세요</p>
          <div className="flex gap-2 flex-wrap">
            {result.recommendedStyles.map((style) => (
              <button
                key={style}
                onClick={() => router.push(`/studio/ai-profile?style=${style}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-pink-200 bg-pink-50 text-pink-700 text-sm font-semibold hover:bg-pink-100 transition-colors"
              >
                <span>{STYLE_EMOJI[style]}</span>
                <span>{STYLE_LABEL[style]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="px-5 flex gap-3 mt-4">
        <Button
          onClick={() => router.push('/studio/ai-profile')}
          variant="outline"
          className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          다시하기
        </Button>
      </div>

      {/* 저장/공유 바텀시트 */}
      {showSaveSheet && result.generatedImageUrl && (
        <SaveBottomSheet
          imageUrl={result.generatedImageUrl}
          hdImageUrl={result.generatedImageHdUrl ?? result.originalImageUrl}
          onClose={() => setShowSaveSheet(false)}
        />
      )}
    </div>
  )
}

export default function AiProfileResultPage() {
  return (
    <Suspense>
      <AiProfileResultContent />
    </Suspense>
  )
}
