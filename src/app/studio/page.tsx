'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useMemberStore } from '@/lib/store/member-store'
import { useEffect } from 'react'

const features = [
  {
    id: 'face-reading',
    emoji: '👁️',
    title: '관상보기',
    description: '전통 동양 관상학으로\n숨겨진 운세를 알아보세요',
    path: '/studio/face-reading',
    available: true,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50',
    border: 'border-violet-100',
  },
  {
    id: 'animal-face',
    emoji: '🦊',
    title: '동물상',
    description: '내 얼굴은 어떤 동물상일까?\n귀여운 동물 습성 분석',
    path: '/studio/animal-face',
    available: true,
    gradient: 'from-orange-400 to-rose-500',
    bgGradient: 'from-orange-50 to-rose-50',
    border: 'border-orange-100',
  },
  {
    id: 'mbti-match',
    emoji: '🧬',
    title: 'MBTI × 얼굴',
    description: '얼굴과 MBTI가 얼마나 일치할까?\n겉바속촉 지수 측정',
    path: '/studio/mbti-match',
    available: true,
    gradient: 'from-indigo-500 to-violet-600',
    bgGradient: 'from-indigo-50 to-violet-50',
    border: 'border-indigo-100',
  },
  {
    id: 'ai-profile',
    emoji: '🎨',
    title: 'AI 프로필',
    description: '웹툰, 수채화, 팝아트...\n나만의 AI 프로필 사진',
    path: '/studio/ai-profile',
    available: true,
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50',
    border: 'border-pink-100',
  },
  {
    id: 'age-simulation',
    emoji: '⏳',
    title: '나이 시뮬레이션',
    description: '10살부터 100살까지\n미래의 내 모습은?',
    path: '/studio/age-simulation',
    available: true,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-100',
  },
  {
    id: 'past-life',
    emoji: '📜',
    title: '전생 보기',
    description: 'AI가 사진으로 분석한\n나의 전생 이야기',
    path: '/studio/past-life',
    available: true,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-100',
  },
  {
    id: 'future-life',
    emoji: '🚀',
    title: '후생 보기',
    description: 'AI가 사진으로 그려낸\n나의 미래 모습',
    path: '/studio/future-life',
    available: true,
    gradient: 'from-cyan-500 to-violet-600',
    bgGradient: 'from-cyan-50 to-violet-50',
    border: 'border-cyan-100',
  },
]

export default function StudioPage() {
  const router = useRouter()
  const { isLoaded, fetchMember } = useMemberStore()

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">스튜디오</h1>
        </div>
        <p className="text-sm text-gray-400">AI로 즐기는 재미있는 분석</p>
      </div>

      {/* 기능 카드 */}
      <div className="px-5 py-6 space-y-4">
        {features.map((feature) => (
          <button
            key={feature.id}
            disabled={!feature.available}
            onClick={() => feature.path && router.push(feature.path)}
            className={`w-full text-left rounded-3xl border p-5 ${feature.border} bg-gradient-to-br ${feature.bgGradient} ${
              feature.available
                ? 'active:scale-[0.98] transition-transform'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl shadow-sm`}>
                  {feature.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-bold text-gray-900">{feature.title}</h2>
                    {!feature.available && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        준비중
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 whitespace-pre-line leading-snug">
                    {feature.description}
                  </p>
                </div>
              </div>
              {feature.available && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 안내 */}
      <div className="px-5 mt-2 pb-10">
        <div className="flex items-start gap-3 bg-amber-50 rounded-2xl px-4 py-3.5 border border-amber-100">
          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            스튜디오 기능은 AI 기반 재미용 콘텐츠입니다. 실제 운세나 과학적 사실과 다를 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
