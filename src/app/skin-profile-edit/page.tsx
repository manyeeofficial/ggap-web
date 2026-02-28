'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import { ArrowLeft } from 'lucide-react'
import { skinProfileApi } from '@/lib/api'
import { useSkinProfileStore } from '@/lib/store/skin-profile-store'
import { toast } from 'sonner'
import type { SkinType } from '@/lib/types/skin-analysis.types'
import type { SkinConcern, SkinGoal } from '@/lib/types'

const skinTypes: { value: SkinType; label: string; emoji: string; description: string }[] = [
  { value: 'DRY', label: '건성', emoji: '🌵', description: '각질이 일어나고 당김' },
  { value: 'OILY', label: '지성', emoji: '💧', description: '번들거리고 모공이 넓음' },
  { value: 'COMBINATION', label: '복합성', emoji: '⚖️', description: 'T존은 지성, 볼은 건성' },
  { value: 'NORMAL', label: '중성', emoji: '😊', description: '유수분 밸런스가 좋음' },
  { value: 'SENSITIVE', label: '민감성', emoji: '😰', description: '쉽게 붉어지고 자극 받음' },
]

const concerns: { value: SkinConcern; label: string; emoji: string }[] = [
  { value: 'ACNE', label: '여드름/트러블', emoji: '❤️' },
  { value: 'PORE', label: '모공', emoji: '🕳️' },
  { value: 'PIGMENTATION', label: '색소침착/잡티', emoji: '🌟' },
  { value: 'WRINKLE', label: '주름', emoji: '📏' },
  { value: 'REDNESS', label: '홍조/민감', emoji: '😳' },
  { value: 'ELASTICITY', label: '탄력 저하', emoji: '💪' },
  { value: 'HYDRATION', label: '건조함/수분 부족', emoji: '💦' },
  { value: 'TEXTURE', label: '피부결', emoji: '✋' },
  { value: 'DARK_CIRCLE', label: '다크서클', emoji: '😴' },
]

const goals: { value: SkinGoal; label: string; emoji: string }[] = [
  { value: 'BRIGHTENING', label: '미백/브라이트닝', emoji: '✨' },
  { value: 'HYDRATING', label: '보습/수분공급', emoji: '💧' },
  { value: 'ANTI_AGING', label: '주름개선/안티에이징', emoji: '⏰' },
  { value: 'ACNE_CARE', label: '트러블 케어', emoji: '🧘' },
  { value: 'PORE_CARE', label: '모공 관리', emoji: '🕳️' },
  { value: 'FIRMING', label: '탄력 개선', emoji: '💪' },
  { value: 'SOOTHING', label: '진정/보호', emoji: '🌊' },
  { value: 'EVEN_TONE', label: '피부톤 균일화', emoji: '😌' },
]

export default function SkinProfileEditPage() {
  const router = useRouter()
  const { profile, isLoaded, fetchProfile, updateProfile } = useSkinProfileStore()
  const [selectedSkinType, setSelectedSkinType] = useState<SkinType | undefined>()
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>([])
  const [selectedGoals, setSelectedGoals] = useState<SkinGoal[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) {
      fetchProfile()
    }
  }, [isLoaded, fetchProfile])

  useEffect(() => {
    if (profile) {
      setSelectedSkinType(profile.skinType)
      setSelectedConcerns(profile.concerns)
      setSelectedGoals(profile.goals)
    }
  }, [profile])

  const toggleConcern = (value: SkinConcern) => {
    setSelectedConcerns((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const toggleGoal = (value: SkinGoal) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const completion = Math.round(
    (selectedSkinType ? 40 : 0) + (selectedConcerns.length > 0 ? 30 : 0) + (selectedGoals.length > 0 ? 30 : 0)
  )

  const handleSave = async () => {
    if (!selectedSkinType) {
      toast.error('피부 타입을 선택해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const updated = await skinProfileApi.upsert({
        skinType: selectedSkinType,
        concerns: selectedConcerns,
        goals: selectedGoals,
      })
      updateProfile(updated)
      toast.success('스킨 프로필이 저장되었습니다.')
      router.back()
    } catch (err: any) {
      toast.error(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">스킨 프로필 설정</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Completion */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">프로필 완성도</span>
            <span className="text-sm font-semibold text-indigo-600">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </Card>

        {/* Skin Type */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">피부 타입</h2>
          <div className="grid grid-cols-1 gap-2">
            {skinTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedSkinType(type.value)}
                disabled={isLoading}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  selectedSkinType === type.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{type.emoji}</span>
                <div className="text-left">
                  <p className={`font-medium ${selectedSkinType === type.value ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {type.label}
                  </p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Concerns */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">주요 고민 (복수 선택)</h2>
          <div className="grid grid-cols-2 gap-2">
            {concerns.map((item) => (
              <button
                key={item.value}
                onClick={() => toggleConcern(item.value)}
                disabled={isLoading}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  selectedConcerns.includes(item.value)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{item.emoji}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">관리 목표 (복수 선택)</h2>
          <div className="grid grid-cols-2 gap-2">
            {goals.map((item) => (
              <button
                key={item.value}
                onClick={() => toggleGoal(item.value)}
                disabled={isLoading}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  selectedGoals.includes(item.value)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{item.emoji}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
        <Button
          onClick={handleSave}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? '저장 중...' : '저장하기'}
        </Button>
      </div>
    </div>
  )
}
