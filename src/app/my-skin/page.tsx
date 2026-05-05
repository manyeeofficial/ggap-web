'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Progress } from '@/app/components/ui/progress'
import { Edit, Camera } from 'lucide-react'
import { SocialLoginSheet } from '@/app/components/SocialLoginSheet'
import { useMemberStore } from '@/lib/store/member-store'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { skinAnalysisApi, skinProfileApi } from '@/lib/api'
import type { SkinAnalysis, SkinProfile, SkinType, SkinConcern, SkinGoal, TroubleType, Severity } from '@/lib/types'

const SKIN_TYPE_LABEL: Record<SkinType, string> = {
  OILY: '지성',
  DRY: '건성',
  COMBINATION: '복합성',
  SENSITIVE: '민감성',
  NORMAL: '중성',
}

const SKIN_TYPE_COLOR: Record<SkinType, string> = {
  OILY: 'bg-blue-50 text-blue-600 border border-blue-100',
  DRY: 'bg-amber-50 text-amber-600 border border-amber-100',
  COMBINATION: 'bg-violet-50 text-violet-600 border border-violet-100',
  SENSITIVE: 'bg-rose-50 text-rose-600 border border-rose-100',
  NORMAL: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
}

const CONCERN_LABEL: Record<SkinConcern, string> = {
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

const GOAL_LABEL: Record<SkinGoal, string> = {
  ANTI_AGING: '안티에이징',
  BRIGHTENING: '미백/브라이트닝',
  ACNE_CARE: '여드름 케어',
  PORE_CARE: '모공 관리',
  SOOTHING: '진정',
  FIRMING: '탄력 강화',
  HYDRATING: '수분 공급',
  EVEN_TONE: '톤 균일화',
}

const TROUBLE_LABEL: Record<TroubleType, string> = {
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

const SEVERITY_COLOR: Record<Severity, string> = {
  NONE: 'bg-gray-100 text-gray-400',
  MILD: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
  MODERATE: 'bg-orange-50 text-orange-600 border border-orange-100',
  SEVERE: 'bg-red-50 text-red-600 border border-red-100',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  NONE: '없음',
  MILD: '경증',
  MODERATE: '중등도',
  SEVERE: '중증',
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function MySkinPage() {
  const router = useRouter()
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [loginSheetOpen, setLoginSheetOpen] = useState(false)
  const [latestAnalysis, setLatestAnalysis] = useState<SkinAnalysis | null>(null)
  const [prevAnalysis, setPrevAnalysis] = useState<SkinAnalysis | null>(null)
  const [trendData, setTrendData] = useState<{ date: string; value: number }[]>([])
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  useEffect(() => {
    if (!isLoaded) return
    if (!member) {
      setLoading(false)
      setLoginSheetOpen(true)
      return
    }
    Promise.all([skinAnalysisApi.getList(0, 10), skinProfileApi.get()])
      .then(([analyses, profile]) => {
        const completed = analyses.filter((a) => a.status === 'COMPLETED')
        if (completed.length > 0) {
          setLatestAnalysis(completed[0])
          if (completed.length > 1) setPrevAnalysis(completed[1])

          const recent = completed.slice(0, 5).reverse()
          setTrendData(
            recent.map((a) => ({
              date: a.createdAt ?? '',
              value: a.totalFaceValue ? Math.round(a.totalFaceValue / 10000) : 0,
            }))
          )
        }
        setSkinProfile(profile)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoaded, member])

  const handleProtectedNav = (path: string) => {
    if (!member) {
      setLoginSheetOpen(true)
      return
    }
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-5 pt-8 pb-4 border-b border-gray-100">
          <Skeleton className="h-7 w-20 mb-1.5" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="px-5 pt-5 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const faceValue = latestAnalysis?.totalFaceValue ?? 0
  const prevFaceValue = prevAnalysis?.totalFaceValue ?? null
  const faceValueChange = prevFaceValue !== null ? faceValue - prevFaceValue : null
  const breakdown = latestAnalysis?.faceValueBreakdown

  const profileCompletion = skinProfile
    ? Math.round(
        ((skinProfile.skinType ? 1 : 0) +
          (skinProfile.concerns.length > 0 ? 1 : 0) +
          (skinProfile.goals.length > 0 ? 1 : 0)) /
          3 *
          100
      )
    : 0

  return (
    <div className="min-h-screen bg-white">
      <SocialLoginSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} />

      {/* 헤더 */}
      <div className="px-5 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">내 스킨</h1>
        <p className="text-sm text-gray-400 mt-0.5">피부 상태를 한눈에 확인하세요</p>
      </div>

      <div className="pb-10">
        {/* 얼굴값 섹션 */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">내 얼굴값</p>
              {latestAnalysis ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {faceValue.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-500">원</span>
                  </div>
                  {faceValueChange !== null && faceValueChange !== 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-sm font-semibold ${faceValueChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                      >
                        {faceValueChange > 0 ? '▲' : '▼'} {Math.abs(faceValueChange).toLocaleString()}원
                      </span>
                      <span className="text-sm text-gray-400">이전 대비</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-300">—</p>
              )}
            </div>
            {latestAnalysis && (
              <button
                onClick={() => router.push(`/analysis-result?id=${latestAnalysis.id}`)}
                className="text-sm font-medium text-indigo-600"
              >
                자세히
              </button>
            )}
          </div>

          {latestAnalysis ? (
            breakdown ? (
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="space-y-2">
                  {[
                    { label: '기본 가치', value: breakdown.baseValue },
                    { label: '피부 가치', value: breakdown.skinValue },
                    { label: '조화 가치', value: breakdown.harmonyValue },
                    { label: '인상 가치', value: breakdown.impressionValue },
                    { label: '나이 보너스', value: breakdown.ageBonus },
                    { label: '희소성 보너스', value: breakdown.rarityBonus },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-semibold text-gray-800">
                        {item.value >= 0 ? '+' : ''}{item.value.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                  {breakdown.deductions !== 0 && (
                    <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-200">
                      <span className="text-gray-500">감점</span>
                      <span className="font-semibold text-rose-500">{breakdown.deductions.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-4">아직 분석 기록이 없습니다</p>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-full" onClick={() => router.push('/camera')}>
                <Camera className="w-4 h-4 mr-2" />첫 분석 시작하기
              </Button>
            </div>
          )}
        </div>

        {/* 현재 피부 상태 */}
        {latestAnalysis && (
          <div className="px-5 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">현재 피부 상태</p>
              {latestAnalysis.createdAt && (
                <span className="text-xs text-gray-400">{formatShortDate(latestAnalysis.createdAt)} 분석</span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {latestAnalysis.skinType && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SKIN_TYPE_COLOR[latestAnalysis.skinType]}`}
                >
                  {SKIN_TYPE_LABEL[latestAnalysis.skinType]}
                </span>
              )}
              {latestAnalysis.estimatedSkinAge != null && (
                <span className="text-sm text-gray-600">
                  피부 나이 <strong className="text-indigo-600">{latestAnalysis.estimatedSkinAge}세</strong>
                </span>
              )}
            </div>

            {latestAnalysis.troubles && latestAnalysis.troubles.length > 0 && (
              <div className="space-y-3.5">
                {latestAnalysis.troubles.map((trouble, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">
                        {TROUBLE_LABEL[trouble.troubleType] || trouble.troubleType}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOR[trouble.severity]}`}
                      >
                        {SEVERITY_LABEL[trouble.severity] || trouble.severity}
                      </span>
                    </div>
                    <Progress value={trouble.score} className="h-1" />
                  </div>
                ))}
              </div>
            )}

            {latestAnalysis.aiSummary && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
                <p className="text-sm text-gray-700 leading-relaxed">{latestAnalysis.aiSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* 트렌드 차트 */}
        {trendData.length >= 2 && (
          <div className="px-5 py-6 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">얼굴값 추세</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="#d1d5db"
                    tickFormatter={(v) => formatShortDate(v)}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#d1d5db"
                    tickFormatter={(v) => `${v}만`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value}만원`, '얼굴값']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-400 text-center mt-3">최근 {trendData.length}회 분석 결과 기준</p>
          </div>
        )}

        {/* 스킨 프로필 */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">스킨 프로필</p>
            <button
              onClick={() => handleProtectedNav('/skin-profile-edit')}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600"
            >
              <Edit className="w-3 h-3" />편집
            </button>
          </div>

          {skinProfile ? (
            <div className="space-y-4">
              {skinProfile.skinType && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">피부 타입</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SKIN_TYPE_COLOR[skinProfile.skinType]}`}
                  >
                    {SKIN_TYPE_LABEL[skinProfile.skinType]}
                  </span>
                </div>
              )}
              {skinProfile.concerns.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">주요 고민</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skinProfile.concerns.map((c, i) => (
                      <span
                        key={i}
                        className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full"
                      >
                        {CONCERN_LABEL[c] || c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skinProfile.goals.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">관리 목표</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skinProfile.goals.map((g, i) => (
                      <span
                        key={i}
                        className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full"
                      >
                        {GOAL_LABEL[g] || g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-400">프로필 완성도</span>
                <span
                  className={`text-sm font-semibold ${profileCompletion === 100 ? 'text-emerald-600' : 'text-orange-500'}`}
                >
                  {profileCompletion}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-4">스킨 프로필을 등록해주세요</p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => handleProtectedNav('/skin-profile-edit')}
              >
                <Edit className="w-4 h-4 mr-2" />프로필 작성하기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
