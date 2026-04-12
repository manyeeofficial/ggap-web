'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Camera, Lock, Gift, Zap, Sparkles, ChevronRight } from 'lucide-react'
import { rankingApi, skinAnalysisApi, inviteApi } from '@/lib/api'
import TrendingProductsWidget from '@/app/components/TrendingProductsWidget'
import { useMemberStore } from '@/lib/store/member-store'
import type { RankingResult, SkinAnalysis, SkinType, TroubleType } from '@/lib/types'

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

const TROUBLE_LABEL: Record<TroubleType, string> = {
  WRINKLE: '주름',
  PIGMENTATION: '색소',
  ACNE: '여드름',
  PORE: '모공',
  REDNESS: '홍조',
  ELASTICITY: '탄력',
  TEXTURE: '결',
  HYDRATION: '수분',
  DARK_CIRCLE: '다크서클',
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일 ${dayNames[date.getDay()]}요일`
}

function formatPercent(value: number): string {
  return value < 1 ? value.toFixed(1) : Math.round(value).toString()
}

function CreditExhaustedModal({ onClose, onInvite }: { onClose: () => void; onInvite: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">분석 크레딧이 소진됐어요</h2>
          <p className="text-sm text-gray-500">친구를 초대하면 +3회를 무료로 받을 수 있어요!</p>
        </div>
        <Button
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl"
          onClick={onInvite}
        >
          <Gift className="mr-2 w-4 h-4" />
          친구 초대하고 +3회 받기
        </Button>
        <button
          className="w-full mt-3 h-11 text-sm text-gray-400 font-medium"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [recentAnalyses, setRecentAnalyses] = useState<SkinAnalysis[]>([])
  const [ranking, setRanking] = useState<RankingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  useEffect(() => {
    if (!isLoaded) return
    if (!member) {
      setLoading(false)
      return
    }
    Promise.all([
      skinAnalysisApi.getList(0, 3).then((data) =>
        data.filter((a) => a.status === 'COMPLETED').slice(0, 3)
      ),
      rankingApi.getMyRanking().catch(() => null),
    ])
      .then(([analyses, rankingData]) => {
        setRecentAnalyses(analyses)
        setRanking(rankingData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoaded, member])

  const handleAnalysisStart = () => {
    if (!member) {
      router.push('/login')
      return
    }
    const credit = member.credit ?? 0
    if (credit <= 0) {
      setShowCreditModal(true)
      return
    }
    router.push('/camera')
  }

  const handleInvite = async () => {
    if (inviting) return
    setInviting(true)
    try {
      const result = await inviteApi.createInvite()
      // 카카오 공유 SDK가 없으므로 클립보드에 복사
      await navigator.clipboard.writeText(result.shareUrl)
      setShowCreditModal(false)
      alert(`초대 링크가 복사됐어요!\n\n${result.shareUrl}\n\n친구에게 공유해보세요 😊`)
    } catch {
      alert('초대 링크 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="bg-white">
      {showCreditModal && (
        <CreditExhaustedModal
          onClose={() => setShowCreditModal(false)}
          onInvite={handleInvite}
        />
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-5 pt-10 pb-8">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">ㅇㄱㄱ - 얼굴값 분석</h1>
          {member && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-white text-xs font-bold">{member.credit ?? 0}회</span>
            </div>
          )}
        </div>
        <p className="text-white/70 text-sm mb-6">얼굴값 췍! 상위 몇 %인지 궁금하다면?</p>
        <Button
          onClick={handleAnalysisStart}
          className="w-full h-12 bg-white text-indigo-600 hover:bg-gray-50 font-semibold rounded-2xl shadow-none"
        >
          <Camera className="mr-2 w-4 h-4" />
          셀카 촬영하기
        </Button>
        {member && (member.credit ?? 0) <= 0 && (
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="w-full mt-2 h-10 text-white/80 text-sm font-medium flex items-center justify-center gap-1.5"
          >
            <Gift className="w-4 h-4" />
            친구 초대하고 +3회 받기
          </button>
        )}
      </div>

      {/* 촬영 가이드 */}
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">촬영 가이드</p>
        <div className="space-y-2.5">
          {['정면을 바라보고 촬영해주세요', '충분한 조명을 확보해주세요', '안경과 마스크를 벗어주세요'].map((tip, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
              </div>
              <p className="text-sm text-gray-600">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 스튜디오 배너 */}
      <div className="px-5 py-5 border-b border-gray-100">
        <button
          onClick={() => router.push('/studio')}
          className="w-full flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">스튜디오 바로가기</p>
              <p className="text-xs text-gray-500 mt-0.5">관상 · 동물상 · AI 프로필 · MBTI 매칭</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* 랭킹 */}
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">나의 랭킹</p>
        {!isLoaded || (isLoaded && member && loading) ? (
          <div className="flex gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 flex-1 rounded-2xl" />
            ))}
          </div>
        ) : !member ? (
          <div className="relative rounded-2xl overflow-hidden min-h-[140px]">
            {/* 블러 더미 */}
            <div className="flex gap-2 blur-sm pointer-events-none select-none">
              <div className="flex-1 bg-indigo-50 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-indigo-400 mb-0.5">전체</p>
                <p className="text-xl font-bold text-indigo-600">상위 ??%</p>
              </div>
              <div className="flex-1 bg-indigo-50 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-indigo-400 mb-0.5">동성·또래</p>
                <p className="text-xl font-bold text-indigo-600">상위 ??%</p>
              </div>
            </div>
            {/* 오버레이 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-semibold text-gray-600 text-center px-4">
                로그인하면 전국 얼굴값 랭킹에서<br />내 순위를 확인할 수 있어요
              </p>
              <button
                onClick={() => router.push('/login')}
                className="mt-1 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full"
              >
                로그인하기
              </button>
            </div>
          </div>
        ) : ranking?.overall ? (
          <div className="flex gap-2">
            {[
              ranking.overall,
              ranking.byGenderAge ?? ranking.byGender ?? ranking.byAge,
            ]
              .filter(Boolean)
              .slice(0, 2)
              .map((group, i) => (
                <div key={i} className="flex-1 bg-indigo-50 rounded-2xl px-4 py-3">
                  <p className="text-xs font-semibold text-indigo-400 mb-0.5">
                    {group!.label ?? '전체'}
                  </p>
                  <p className="text-xl font-bold text-indigo-600 leading-tight">
                    상위 {formatPercent(group!.topPercent)}%
                  </p>
                </div>
              ))}
          </div>
        ) : null}
      </div>

      {/* 트렌딩 상품 */}
      <TrendingProductsWidget />

      {/* 최근 분석 */}
      <div>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">최근 분석</p>
          {member && (
            <button onClick={() => router.push('/history')} className="text-sm font-medium text-indigo-600">
              전체보기
            </button>
          )}
        </div>

        {!isLoaded || (isLoaded && member && loading) ? (
          <div className="px-5 space-y-px">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton className="w-[60px] h-[60px] rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !member ? (
          <div className="relative mx-5 rounded-2xl overflow-hidden min-h-[180px]">
            {/* 블러 더미 아이템 */}
            <div className="blur-sm pointer-events-none select-none divide-y divide-gray-100">
              {[
                { date: '3월 4일 화요일', value: '1,250,000', tag: '지성' },
                { date: '2월 28일 목요일', value: '1,180,000', tag: '복합성' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 py-4">
                  <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">
                    👤
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{item.date}</p>
                    <p className="text-xl font-bold text-indigo-600">{item.value}원</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* 오버레이 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-semibold text-gray-600 text-center px-4">
                로그인하면 내 피부 분석 기록을<br />저장하고 변화를 추적할 수 있어요
              </p>
              <button
                onClick={() => router.push('/login')}
                className="mt-1 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full"
              >
                로그인하기
              </button>
            </div>
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400">아직 분석 기록이 없습니다</p>
          </div>
        ) : (
          <div>
            {recentAnalyses.map((item, index) => {
              const faceValue = item.totalFaceValue ?? 0
              const prevFaceValue =
                index < recentAnalyses.length - 1
                  ? (recentAnalyses[index + 1].totalFaceValue ?? 0)
                  : null
              const change = prevFaceValue !== null ? faceValue - prevFaceValue : null

              const topTroubles = item.troubles
                .filter((t) => t.severity !== 'NONE')
                .sort((a, b) => b.score - a.score)
                .slice(0, 2)

              return (
                <button
                  key={item.id}
                  className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  onClick={() => router.push(`/analysis-result?id=${item.id}`)}
                >
                  {item.imageUrl ? (
                    <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">
                      👤
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {item.createdAt && (
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        {formatShortDate(item.createdAt)}
                      </p>
                    )}
                    <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                      {faceValue.toLocaleString()}원
                    </p>
                    {change !== null && change !== 0 && (
                      <p className={`text-xs font-semibold mt-0.5 ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {change > 0 ? '▲' : '▼'} {Math.abs(change).toLocaleString()}원
                      </p>
                    )}
                    {(item.skinType || topTroubles.length > 0) && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.skinType && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SKIN_TYPE_COLOR[item.skinType]}`}
                          >
                            {SKIN_TYPE_LABEL[item.skinType]}
                          </span>
                        )}
                        {topTroubles.map((t) => (
                          <span
                            key={t.troubleType}
                            className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"
                          >
                            {TROUBLE_LABEL[t.troubleType]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
