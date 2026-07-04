'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { faceReadingApi } from '@/lib/api'
import type { FaceReading, FacePart, FaceReadingType, FortunePeriod, OhaengType } from '@/lib/types'
import { deriveFaceCode, parseFaceCode, characterFor } from '@/lib/face-code/faceCode'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

// ─── 정적 매핑 ────────────────────────────────────────

const TYPE_LABEL: Record<FaceReadingType, string> = {
  WEALTH: '재물복 관상',
  LEADER: '리더형 관상',
  ARTIST: '예술가형 관상',
  SCHOLAR: '학자형 관상',
  PEOPLE_LUCK: '인복 관상',
  OFFICIAL: '관록 관상',
  NOBLE: '귀인 관상',
  PEACH_BLOSSOM: '도화 관상',
  LONGEVITY: '장수 관상',
  VIRTUE: '복덕 관상',
  GUARDIAN: '수호자형 관상',
  ENTREPRENEUR: '창업가형 관상',
  DIPLOMAT: '외교관형 관상',
  HEALER: '치유자형 관상',
  ADVENTURER: '모험가형 관상',
  SAGE: '현자형 관상',
}

/** 품격 인트로 (고정) — overallType별 */
const TYPE_INTRO: Record<FaceReadingType, string> = {
  WEALTH: '당신의 얼굴에는 재물의 기운이 가득합니다',
  LEADER: '당신의 얼굴에는 사람을 이끄는 기상이 서려 있습니다',
  ARTIST: '당신의 얼굴에는 아름다움을 빚어내는 기운이 흐릅니다',
  SCHOLAR: '당신의 얼굴에는 세상의 이치가 담겨 있습니다',
  PEOPLE_LUCK: '당신의 얼굴에는 사람을 모으는 복이 담겨 있습니다',
  OFFICIAL: '당신의 얼굴에는 관록의 기운이 서려 있습니다',
  NOBLE: '당신의 얼굴에는 귀인의 품격이 흐릅니다',
  PEACH_BLOSSOM: '당신의 얼굴에는 사람을 끌어당기는 힘이 있습니다',
  LONGEVITY: '당신의 얼굴에는 생명력과 복록이 가득합니다',
  VIRTUE: '당신의 얼굴에는 덕망이 넘쳐흐릅니다',
  GUARDIAN: '당신의 얼굴에는 강인한 수호의 기운이 있습니다',
  ENTREPRENEUR: '당신의 얼굴에는 새 길을 여는 창업의 기상이 있습니다',
  DIPLOMAT: '당신의 얼굴에는 사람을 조화롭게 하는 기운이 흐릅니다',
  HEALER: '당신의 얼굴에는 따뜻한 치유의 기운이 있습니다',
  ADVENTURER: '당신의 얼굴에는 세상을 탐험하는 담대함이 서려 있습니다',
  SAGE: '당신의 얼굴에는 세상의 이치를 꿰뚫는 지혜가 담겨 있습니다',
}

const FACE_PART_LABEL: Record<FacePart, string> = {
  FOREHEAD: '이마',
  EYES: '눈',
  NOSE: '코',
  MOUTH: '입',
  CHIN: '턱',
  EARS: '귀',
  CHEEKBONES: '광대',
  PHILTRUM: '인중',
  GLABELLA: '미간',
}

const PERIOD_LABEL: Record<FortunePeriod, string> = {
  EARLY: '초년운',
  MID: '중년운',
  LATE: '말년운',
  OVERALL: '총운',
}

const PERIOD_RANGE: Record<FortunePeriod, string> = {
  EARLY: '1~30세',
  MID: '30~50세',
  LATE: '50세~',
  OVERALL: '전체',
}

const PERIOD_ORDER: FortunePeriod[] = ['EARLY', 'MID', 'LATE', 'OVERALL']

// ─── 오행 매핑 ───────────────────────────────────────

const OHAENG_LABEL: Record<OhaengType, string> = {
  WOOD: '木 목',
  FIRE: '火 화',
  EARTH: '土 토',
  METAL: '金 금',
  WATER: '水 수',
}

const OHAENG_COLOR: Record<OhaengType, string> = {
  WOOD: 'bg-emerald-500',
  FIRE: 'bg-red-500',
  EARTH: 'bg-amber-500',
  METAL: 'bg-gray-400',
  WATER: 'bg-blue-500',
}

const OHAENG_ORDER: OhaengType[] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER']

// ─── 하위 컴포넌트 ────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-500 w-7 text-right">{score}</span>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function FaceReadingResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<FaceReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FortunePeriod>('OVERALL')

  useEffect(() => {
    if (!id) {
      router.replace('/studio/face-reading')
      return
    }
    faceReadingApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/studio/face-reading')
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
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const overallTypeLabel = result.overallType ? TYPE_LABEL[result.overallType] : '알 수 없음'
  const introText = result.overallType
    ? TYPE_INTRO[result.overallType]
    : '당신의 얼굴에는 세상 삼라만상이 들어 있습니다'

  const overallFortune = result.fortunes.find((f) => f.period === 'OVERALL')
  const overallScore = overallFortune?.score ?? 0

  // 낯빛코드(페이스코드) — 백엔드 저장값(canonical) 우선, 없으면(레거시) 9부위 점수로 산출
  const faceCode = result.faceCode
    ? parseFaceCode(result.faceCode) ?? deriveFaceCode(result)
    : deriveFaceCode(result)

  // 인생 그래프 데이터 (LineChart)
  const lifeGraphData = (['EARLY', 'MID', 'LATE'] as FortunePeriod[]).map((p) => ({
    name: PERIOD_LABEL[p],
    score: result.fortunes.find((f) => f.period === p)?.score ?? 0,
  }))

  const activeFortune = result.fortunes.find((f) => f.period === activeTab)
  const activeParts = result.readings.filter((r) =>
    activeTab === 'OVERALL' ? true : r.period === activeTab
  )

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* 헤더 */}
      <div className="flex items-center px-4 pt-6 pb-4">
        <button
          onClick={() => router.push('/studio')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">관상 결과</h1>
      </div>

      {/* 낯빛코드 교차 CTA — 성격 콘텐츠는 낯빛코드 기능으로 분리 (운세는 관상에 유지) */}
      {faceCode && (
        <div className="px-5 mb-5">
          <button
            onClick={() => router.push('/studio/face-code')}
            className={`w-full rounded-3xl p-4 text-white bg-gradient-to-br ${faceCode.gradient} flex items-center gap-3 active:scale-[0.99] transition-transform shadow-sm`}
          >
            <div className="text-3xl">{characterFor(faceCode.code)}</div>
            <div className="flex-1 text-left">
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.2em]">낯빛코드</p>
              <p className="text-lg font-black leading-tight">
                {faceCode.code} · {faceCode.meta.nickname}
              </p>
              <p className="text-white/70 text-xs mt-0.5">성격·궁합 자세히 보기 →</p>
            </div>
          </button>
        </div>
      )}

      {/* 종합 유형 카드 */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg">
          <div className="mb-4">
            <h2 className="text-2xl font-bold leading-snug">
              {result.shareCaption ?? (result.overallType ? TYPE_LABEL[result.overallType] : '특별한 관상')}
            </h2>
            <p className="text-white/70 text-sm mt-1">{overallTypeLabel} · 종합 {overallScore}점</p>
            <p className="text-white/50 text-xs mt-0.5">{introText}</p>
          </div>

          {/* 행운 정보 */}
          {(result.luckyColor || result.luckyNumber != null) && (
            <div className="flex gap-3 mb-5">
              {result.luckyColor && (
                <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
                  <p className="text-white/60 text-[10px] font-semibold uppercase mb-0.5">행운의 색</p>
                  <p className="text-white font-bold text-sm">{result.luckyColor}</p>
                </div>
              )}
              {result.luckyNumber != null && (
                <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
                  <p className="text-white/60 text-[10px] font-semibold uppercase mb-0.5">행운의 숫자</p>
                  <p className="text-white font-bold text-sm">{result.luckyNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* 인생 그래프 — LineChart */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">인생 그래프</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={lifeGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(88,28,135,0.9)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}점`, '']}
                />
                <ReferenceLine y={70} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#c4b5fd"
                  strokeWidth={2.5}
                  dot={{ fill: '#c4b5fd', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 브랜딩 */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-end">
            <p className="text-white/30 text-xs tracking-wide">ggap.ai</p>
          </div>
        </div>
      </div>

      {/* 오행 분석 섹션 */}
      {result.ohaengData && (() => {
        const od = result.ohaengData!
        const totalGlyphs = Object.values(od.distribution).reduce((a, b) => a + b, 0)
        return (
          <div className="px-5 mb-5">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">사주 오행 분석</p>

              {/* 일간 정보 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <span className="text-xl font-black text-amber-700">{od.ilganHanja}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{od.ilganKor} 일간</p>
                  {od.fusionPattern && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      {od.fusionPattern}
                    </span>
                  )}
                </div>
              </div>

              {/* 오행 분포 바 */}
              <div className="space-y-2 mb-4">
                {OHAENG_ORDER.map((key) => {
                  const count = od.distribution[key] ?? 0
                  const width = totalGlyphs > 0 ? Math.round((count / totalGlyphs) * 100) : 0
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 w-10">{OHAENG_LABEL[key]}</span>
                      <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${OHAENG_COLOR[key]} transition-all`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>

              {/* 시너지 해설 */}
              {od.synergyNote && (
                <div className="bg-white/60 rounded-2xl p-3 mb-2">
                  <p className="text-xs font-semibold text-amber-700 mb-1">관상 × 오행 시너지</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{od.synergyNote}</p>
                </div>
              )}

              {/* 보완 팁 */}
              {od.complementTip && (
                <div className="bg-white/60 rounded-2xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">보완 팁</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{od.complementTip}</p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* 탭 */}
      <div className="px-5 mb-5">
        <div className="flex border-b border-gray-100">
          {PERIOD_ORDER.map((period) => {
            const isActive = activeTab === period
            return (
              <button
                key={period}
                onClick={() => setActiveTab(period)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                  isActive ? 'text-violet-600' : 'text-gray-400'
                }`}
              >
                {PERIOD_LABEL[period]}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="px-5">
        {activeFortune && (
          <div className="mb-4">
            {/* 점수 */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 font-medium">{PERIOD_RANGE[activeTab]}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{activeFortune.score}점</p>
              </div>
              <div className="w-20">
                <ScoreBar score={activeFortune.score} />
              </div>
            </div>

            {/* AI 해설 */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">{activeFortune.summary}</p>
              {activeFortune.ohaengNote && (
                <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-gray-200">
                  🔥 {activeFortune.ohaengNote}
                </p>
              )}
            </div>

            {/* 키워드 */}
            {activeFortune.keywords.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-4">
                {activeFortune.keywords.map((kw) => (
                  <span key={kw} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 부위별 분석 */}
        {activeParts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">부위별 분석</p>
            <div className="space-y-3">
              {activeParts.map((r) => (
                <div key={r.facePart} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{FACE_PART_LABEL[r.facePart]}</h3>
                    <span className={`text-sm font-bold ${r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {r.score}점
                    </span>
                  </div>
                  <ScoreBar score={r.score} />
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{r.fortune}</p>
                  {r.ohaengNote && (
                    <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-gray-100">
                      🔥 {r.ohaengNote}
                    </p>
                  )}
                  {r.keywords.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {r.keywords.map((kw) => (
                        <span key={kw} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-6">
          <Button
            onClick={() => router.push('/studio/face-reading')}
            variant="outline"
            className="w-full h-12 rounded-2xl border-gray-200 font-semibold"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시하기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function FaceReadingResultPage() {
  return (
    <Suspense>
      <FaceReadingResultContent />
    </Suspense>
  )
}
