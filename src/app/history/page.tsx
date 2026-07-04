'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  skinAnalysisApi, faceReadingApi, faceCodeApi, mbtiMatchApi, ageSimulationApi,
} from '@/lib/api'
import { UnauthenticatedError } from '@/lib/api/client'
import type {
  SkinAnalysis, SkinType, TroubleType,
  FaceReading, FaceReadingType,
  FaceCodeAnalysis,
  MbtiMatch, MatchLevel,
  AgeSimulation,
} from '@/lib/types'

// ─── 레이블 맵 ───────────────────────────────────────────

const SKIN_TYPE_LABEL: Record<SkinType, string> = {
  OILY: '지성', DRY: '건성', COMBINATION: '복합성', SENSITIVE: '민감성', NORMAL: '중성',
}
const SKIN_TYPE_COLOR: Record<SkinType, string> = {
  OILY: 'bg-blue-50 text-blue-600 border border-blue-100',
  DRY: 'bg-amber-50 text-amber-600 border border-amber-100',
  COMBINATION: 'bg-violet-50 text-violet-600 border border-violet-100',
  SENSITIVE: 'bg-rose-50 text-rose-600 border border-rose-100',
  NORMAL: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
}
const TROUBLE_LABEL: Record<TroubleType, string> = {
  WRINKLE: '주름', PIGMENTATION: '색소', ACNE: '여드름', PORE: '모공', REDNESS: '홍조',
  ELASTICITY: '탄력', TEXTURE: '결', HYDRATION: '수분', DARK_CIRCLE: '다크서클',
}
const FACE_READING_TYPE_LABEL: Record<FaceReadingType, string> = {
  WEALTH: '재물복 관상', LEADER: '리더형 관상', ARTIST: '예술가형 관상', SCHOLAR: '학자형 관상',
  PEOPLE_LUCK: '인복 관상', OFFICIAL: '관록 관상', NOBLE: '귀인 관상', PEACH_BLOSSOM: '도화 관상',
  LONGEVITY: '장수 관상', VIRTUE: '복덕 관상', GUARDIAN: '수호자형 관상', ENTREPRENEUR: '창업가형 관상',
  DIPLOMAT: '외교관형 관상', HEALER: '치유자형 관상', ADVENTURER: '모험가형 관상', SAGE: '현자형 관상',
}
const MATCH_LEVEL_LABEL: Record<MatchLevel, string> = {
  SPOILER: '얼굴이 스포일러', HONEST: '정직한 얼굴', SUBTLE: '겉바속촉',
  DOUBLE_LIFE: '각자도생', FRAUD: '얼굴 사기',
}
const MATCH_LEVEL_EMOJI: Record<MatchLevel, string> = {
  SPOILER: '🔮', HONEST: '😇', SUBTLE: '🥤', DOUBLE_LIFE: '🎭', FRAUD: '🕵️',
}

// ─── 유틸 ─────────────────────────────────────────────────

function formatDate(dateStr: string): { main: string; sub: string } {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return { main: dateStr, sub: '' }
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[date.getDay()]
  const hour = date.getHours()
  const minute = date.getMinutes().toString().padStart(2, '0')
  const ampm = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return { main: `${month}월 ${day}일 ${dayName}요일`, sub: `${ampm} ${displayHour}:${minute}` }
}

function getMonthGroup(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '기타'
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const now = new Date()
  if (year === now.getFullYear() && month === now.getMonth() + 1) return '이번 달'
  if (
    (year === now.getFullYear() && month === now.getMonth()) ||
    (year === now.getFullYear() - 1 && month === 12 && now.getMonth() === 0)
  ) return '지난 달'
  return `${year}년 ${month}월`
}

// ─── 공통 컴포넌트 ─────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="px-5 space-y-px">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="w-[60px] h-[60px] rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ emoji, title, desc, label, color, onClick }: {
  emoji: string; title: string; desc: string; label: string; color: string; onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-3xl">{emoji}</div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 mb-6">{desc}</p>
      <Button className={`${color} rounded-full px-6`} onClick={onClick}>{label}</Button>
    </div>
  )
}

// 컴포넌트 내부 정의 금지 — 모듈 스코프에 배치
function DeleteMenu({ onDelete }: { onDelete: (e: React.MouseEvent) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── 1. 피부 분석 탭 ──────────────────────────────────────

type AnalysisWithIndex = SkinAnalysis & { originalIndex: number }

function SkinAnalysisTab() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    skinAnalysisApi.getList()
      .then((data) => setAnalyses(data.filter((a) => a.status === 'COMPLETED')))
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('분석 기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await skinAnalysisApi.delete(id)
      setAnalyses((prev) => prev.filter((a) => a.id !== id))
      toast.success('분석 기록이 삭제되었습니다.')
    } catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />
  if (analyses.length === 0) return (
    <EmptyState emoji="📷" title="아직 분석 기록이 없어요" desc="첫 번째 피부 분석을 시작해보세요"
      label="분석 시작하기" color="bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push('/camera')} />
  )

  const groups: { label: string; items: AnalysisWithIndex[] }[] = []
  const groupMap: Record<string, AnalysisWithIndex[]> = {}
  analyses.forEach((item, index) => {
    const label = item.createdAt ? getMonthGroup(item.createdAt) : '기타'
    if (!groupMap[label]) { groupMap[label] = []; groups.push({ label, items: groupMap[label] }) }
    groupMap[label].push({ ...item, originalIndex: index })
  })

  return (
    <div className="pb-10">
      {groups.map((group) => (
        <div key={group.label} className="mb-1">
          <div className="px-5 pt-4 pb-1">
            <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">{group.label}</span>
          </div>
          <div>
            {group.items.map((item) => {
              const faceValue = item.totalFaceValue ?? 0
              const prevFaceValue = item.originalIndex < analyses.length - 1 ? (analyses[item.originalIndex + 1].totalFaceValue ?? 0) : null
              const change = prevFaceValue !== null ? faceValue - prevFaceValue : null
              const topTroubles = item.troubles.filter((t) => t.severity !== 'NONE').sort((a, b) => b.score - a.score).slice(0, 2)
              const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
              return (
                <button key={item.id}
                  className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  onClick={() => router.push(`/analysis-result?id=${item.id}`)}>
                  {item.imageUrl ? (
                    <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image src={item.imageUrl} alt="분석 사진" width={60} height={60} className="w-full h-full object-cover" quality={70} />
                    </div>
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">👤</div>
                  )}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
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
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SKIN_TYPE_COLOR[item.skinType]}`}>
                                {SKIN_TYPE_LABEL[item.skinType]}
                              </span>
                            )}
                            {topTroubles.map((t) => (
                              <span key={t.troubleType} className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {TROUBLE_LABEL[t.troubleType]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <DeleteMenu onDelete={(e) => handleDelete(e, item.id)} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mx-5 border-b border-gray-100" />
        </div>
      ))}
    </div>
  )
}

// ─── 2. 관상 탭 ───────────────────────────────────────────

function FaceReadingTab() {
  const router = useRouter()
  const [readings, setReadings] = useState<FaceReading[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    faceReadingApi.getList()
      .then((data) => setReadings(data.filter((r) => r.status === 'COMPLETED')))
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('관상 기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await faceReadingApi.delete(id)
      setReadings((prev) => prev.filter((r) => r.id !== id))
      toast.success('관상 기록이 삭제되었습니다.')
    } catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />
  if (readings.length === 0) return (
    <EmptyState emoji="👁️" title="아직 관상 분석 기록이 없어요" desc="스튜디오에서 관상보기를 시작해보세요"
      label="관상보기 시작" color="bg-violet-600 hover:bg-violet-700" onClick={() => router.push('/studio/face-reading')} />
  )

  return (
    <div className="pb-10">
      {readings.map((item) => {
        const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
        return (
          <button key={item.id}
            className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
            onClick={() => router.push(`/studio/face-reading/result?id=${item.id}`)}>
            {item.imageUrl ? (
              <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={item.imageUrl} alt="관상 사진" width={60} height={60} className="w-full h-full object-cover" quality={70} />
              </div>
            ) : (
              <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">👁️</div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                  {item.shareCaption || item.overallType ? (
                    <>
                      <p className="text-base font-bold text-violet-600 leading-snug">
                        {item.shareCaption ?? FACE_READING_TYPE_LABEL[item.overallType!]}
                      </p>
                      {item.overallType && (() => {
                        const overallScore = item.fortunes?.find(f => f.period === 'OVERALL')?.score
                        return (
                          <p className="text-gray-400 text-sm mt-1">
                            {FACE_READING_TYPE_LABEL[item.overallType]} · 종합 {overallScore}점
                          </p>
                        )
                      })()}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">유형 분석 중</p>
                  )}
                </div>
                <DeleteMenu onDelete={(e) => handleDelete(e, item.id)} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── 3. 낯빛코드 탭 ───────────────────────────────────────

function FaceCodeTab() {
  const router = useRouter()
  const [items, setItems] = useState<FaceCodeAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    faceCodeApi.getList()
      .then((data) => setItems(data.filter((x) => x.status === 'COMPLETED')))
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('낯빛코드 기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await faceCodeApi.delete(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast.success('낯빛코드 기록이 삭제되었습니다.')
    } catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />
  if (items.length === 0) return (
    <EmptyState emoji="🔮" title="아직 낯빛코드 기록이 없어요" desc="스튜디오에서 낯빛코드를 확인해보세요"
      label="낯빛코드 분석하기" color="bg-rose-500 hover:bg-rose-600" onClick={() => router.push('/studio/face-code')} />
  )

  return (
    <div className="pb-10">
      {items.map((item) => {
        const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
        return (
          <button key={item.id}
            className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
            onClick={() => router.push(`/studio/face-code/result?id=${item.id}`)}>
            {item.imageUrl ? (
              <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={item.imageUrl} alt="낯빛코드 사진" width={60} height={60} className="w-full h-full object-cover" quality={70} />
              </div>
            ) : (
              <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center flex-shrink-0 text-2xl">🔮</div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                  {item.faceCode ? (
                    <>
                      <p className="text-base font-bold text-rose-500 leading-snug">{item.faceCode}</p>
                      {item.meta?.nickname && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate">{item.meta.nickname}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">분석 중</p>
                  )}
                </div>
                <DeleteMenu onDelete={(e) => handleDelete(e, item.id)} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── 4. MBTI x 얼굴 탭 ───────────────────────────────────

function MbtiMatchTab() {
  const router = useRouter()
  const [items, setItems] = useState<MbtiMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mbtiMatchApi.getList()
      .then((data) => setItems(data.filter((x) => x.status === 'COMPLETED')))
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('MBTI 기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await mbtiMatchApi.delete(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast.success('MBTI 기록이 삭제되었습니다.')
    } catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />
  if (items.length === 0) return (
    <EmptyState emoji="🧬" title="아직 MBTI 매칭 기록이 없어요" desc="내 얼굴과 MBTI가 얼마나 일치하는지 확인해보세요"
      label="MBTI 매칭 시작" color="bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push('/studio/mbti-match')} />
  )

  return (
    <div className="pb-10">
      {items.map((item) => {
        const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
        return (
          <button key={item.id}
            className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
            onClick={() => router.push(`/studio/mbti-match/result?id=${item.id}`)}>
            <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center flex-shrink-0 text-xl font-bold text-indigo-600">
              {item.mbti}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                  {item.matchLevel ? (
                    <p className="text-base font-bold text-indigo-600">
                      {MATCH_LEVEL_EMOJI[item.matchLevel]} {MATCH_LEVEL_LABEL[item.matchLevel]}
                      <span className="text-sm font-normal text-gray-400 ml-1">({item.overallMatchRate}%)</span>
                    </p>
                  ) : <p className="text-sm text-gray-400">분석 중</p>}
                  {item.wittyOneLiner && <p className="text-xs text-gray-500 mt-1 truncate">{item.wittyOneLiner}</p>}
                </div>
                <DeleteMenu onDelete={(e) => handleDelete(e, item.id)} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── 5. 나이 시뮬레이션 탭 ───────────────────────────────

function AgeSimulationTab() {
  const router = useRouter()
  const [items, setItems] = useState<AgeSimulation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ageSimulationApi.getList()
      .then((data) => setItems(data.filter((x) => x.status === 'COMPLETED')))
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('나이 시뮬레이션 기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await ageSimulationApi.delete(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast.success('나이 시뮬레이션 기록이 삭제되었습니다.')
    } catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />
  if (items.length === 0) return (
    <EmptyState emoji="⏳" title="아직 나이 시뮬레이션 기록이 없어요" desc="내 미래 얼굴을 AI로 확인해보세요"
      label="나이 시뮬레이션 시작" color="bg-amber-500 hover:bg-amber-600" onClick={() => router.push('/studio/age-simulation')} />
  )

  return (
    <div className="pb-10">
      {items.map((item) => {
        const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
        return (
          <button key={item.id}
            className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
            onClick={() => router.push(`/studio/age-simulation/result?id=${item.id}`)}>
            {item.generatedImageUrl ? (
              <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={item.generatedImageUrl} alt="나이 시뮬레이션" width={60} height={60} className="w-full h-full object-cover" quality={70} />
              </div>
            ) : (
              <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center flex-shrink-0 text-2xl">⏳</div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                  <p className="text-base font-bold text-amber-600">⏳ {item.targetAge}세 시뮬레이션</p>
                  {item.wittyOneLiner && <p className="text-xs text-gray-500 mt-1 truncate">{item.wittyOneLiner}</p>}
                </div>
                <DeleteMenu onDelete={(e) => handleDelete(e, item.id)} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────

type TabId = 'skin' | 'face-reading' | 'face-code' | 'mbti-match' | 'age-simulation'

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: 'skin', label: '피부 분석' },
  { id: 'face-reading', label: '관상' },
  { id: 'face-code', label: '낯빛코드' },
  { id: 'mbti-match', label: 'MBTI x 얼굴' },
  { id: 'age-simulation', label: '나이 시뮬' },
]

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('skin')

  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">기록</h1>
        <p className="text-sm text-gray-400 mt-0.5">나의 분석 히스토리</p>
      </div>

      {/* 탭 바 — overflow-x-auto로 스크롤 가능 */}
      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none">
        {TAB_LABELS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`}>
            {label}
            {activeTab === id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'skin' && <SkinAnalysisTab />}
      {activeTab === 'face-reading' && <FaceReadingTab />}
      {activeTab === 'face-code' && <FaceCodeTab />}
      {activeTab === 'mbti-match' && <MbtiMatchTab />}
      {activeTab === 'age-simulation' && <AgeSimulationTab />}
    </div>
  )
}
