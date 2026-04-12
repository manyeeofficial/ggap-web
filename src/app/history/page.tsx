'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import Image from 'next/image'
import { MoreVertical, Trash2, Camera, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  skinAnalysisApi, faceReadingApi, pastLifeApi, futureLifeApi,
  animalFaceApi, aiProfileApi, ageSimulationApi, mbtiMatchApi,
} from '@/lib/api'
import { UnauthenticatedError } from '@/lib/api/client'
import type {
  SkinAnalysis, SkinType, TroubleType,
  FaceReading, FaceReadingType,
  PastLife, PastEra,
  FutureLife, RebirthCategory,
  AnimalFace, AnimalType,
  AiProfile, ProfileStyle,
  AgeSimulation,
  MbtiMatch, MatchLevel,
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
const PAST_ERA_LABEL: Record<PastEra, string> = {
  THREE_KINGDOMS: '삼국시대', GORYEO: '고려시대', JOSEON: '조선시대',
  RETRO_60S: '1960년대', RETRO_80S: '1980년대',
  ANCIENT_EGYPT: '고대 이집트', ANCIENT_GREECE: '고대 그리스',
  ROMAN_EMPIRE: '로마 제국', MEDIEVAL_EUROPE: '중세 유럽',
  RENAISSANCE: '르네상스', SILK_ROAD: '실크로드',
  OTTOMAN_EMPIRE: '오스만 제국', AFRICAN_KINGDOM: '아프리카 왕국',
  VICTORIAN_ERA: '빅토리아 시대', JAZZ_AGE: '1920년대 미국',
}
const PAST_ERA_EMOJI: Record<PastEra, string> = {
  THREE_KINGDOMS: '⚔️', GORYEO: '🏺', JOSEON: '📜',
  RETRO_60S: '🎞️', RETRO_80S: '🎵',
  ANCIENT_EGYPT: '🏛️', ANCIENT_GREECE: '🏺',
  ROMAN_EMPIRE: '⚔️', MEDIEVAL_EUROPE: '🏰',
  RENAISSANCE: '🎨', SILK_ROAD: '🐪',
  OTTOMAN_EMPIRE: '🕌', AFRICAN_KINGDOM: '👑',
  VICTORIAN_ERA: '🎩', JAZZ_AGE: '🎷',
}
const REBIRTH_CATEGORY_LABEL: Record<RebirthCategory, string> = {
  HUMAN: '인간', ANIMAL: '동물', INSECT: '곤충', ALIEN: '외계인', PLANT: '식물', OBJECT: '무생물',
}
const REBIRTH_CATEGORY_EMOJI: Record<RebirthCategory, string> = {
  HUMAN: '👤', ANIMAL: '🐾', INSECT: '🦋', ALIEN: '👽', PLANT: '🌿', OBJECT: '💎',
}
const ANIMAL_TYPE_LABEL: Record<AnimalType, string> = {
  DOG: '강아지상', CAT: '고양이상', FOX: '여우상', RABBIT: '토끼상',
  BEAR: '곰상', DEER: '사슴상', WOLF: '늑대상', HAMSTER: '햄스터상',
}
const ANIMAL_TYPE_EMOJI: Record<AnimalType, string> = {
  DOG: '🐶', CAT: '🐱', FOX: '🦊', RABBIT: '🐰',
  BEAR: '🐻', DEER: '🦌', WOLF: '🐺', HAMSTER: '🐹',
}
const PROFILE_STYLE_LABEL: Record<ProfileStyle, string> = {
  ID_PHOTO: '증명사진', CELEBRITY: '셀럽', WEBTOON: '웹툰', GHIBLI: '지브리',
  YEARBOOK: '졸업사진', POP_ART: '팝아트', WATERCOLOR: '수채화',
  RETRO_90S: '90s 레트로', THREE_D_AVATAR: '3D 아바타', BW_CLASSIC: '흑백클래식',
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

type AnalysisWithIndex = SkinAnalysis & { originalIndex: number }

// ─── 피부 분석 탭 ─────────────────────────────────────────

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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => handleDelete(e, item.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

// ─── 관상 탭 ──────────────────────────────────────────────

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => handleDelete(e, item.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── 전생/후생 탭 ─────────────────────────────────────────

function PastFutureTab() {
  const router = useRouter()
  const [pastItems, setPastItems] = useState<PastLife[]>([])
  const [futureItems, setFutureItems] = useState<FutureLife[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      pastLifeApi.getList().catch(() => [] as PastLife[]),
      futureLifeApi.getList().catch(() => [] as FutureLife[]),
    ])
      .then(([past, future]) => {
        setPastItems(past.filter((p) => p.status === 'COMPLETED'))
        setFutureItems(future.filter((f) => f.status === 'COMPLETED'))
      })
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDeletePast = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await pastLifeApi.delete(id); setPastItems((prev) => prev.filter((p) => p.id !== id)); toast.success('전생 기록이 삭제되었습니다.') }
    catch { toast.error('삭제에 실패했습니다.') }
  }
  const handleDeleteFuture = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await futureLifeApi.delete(id); setFutureItems((prev) => prev.filter((f) => f.id !== id)); toast.success('후생 기록이 삭제되었습니다.') }
    catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />
  if (pastItems.length === 0 && futureItems.length === 0) return (
    <EmptyState emoji="✨" title="아직 기록이 없습니다" desc="스튜디오에서 전생/후생 보기를 시작해보세요"
      label="전생 보기 시작" color="bg-amber-500 hover:bg-amber-600" onClick={() => router.push('/studio/past-life')} />
  )

  return (
    <div className="pb-10">
      {pastItems.length > 0 && (
        <div className="mb-1">
          <div className="px-5 pt-4 pb-1"><span className="text-sm font-semibold text-gray-400 tracking-wide">전생</span></div>
          {pastItems.map((item) => {
            const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
            return (
              <button key={item.id}
                className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
                onClick={() => router.push(`/studio/past-life/result?id=${item.id}`)}>
                {item.generatedImageUrl ? (
                  <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image src={item.generatedImageUrl} alt="전생 이미지" width={60} height={60} className="w-full h-full object-cover" quality={70} />
                  </div>
                ) : (
                  <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center flex-shrink-0 text-2xl">
                    {PAST_ERA_EMOJI[item.era]}
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                      <p className="text-base font-bold text-amber-600">{PAST_ERA_EMOJI[item.era]} {PAST_ERA_LABEL[item.era]}</p>
                      {item.wittyOneLiner && <p className="text-xs text-gray-500 mt-1 truncate">{item.wittyOneLiner}</p>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => handleDeletePast(e, item.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      {futureItems.length > 0 && (
        <div className="mb-1">
          <div className="px-5 pt-4 pb-1"><span className="text-sm font-semibold text-gray-400 tracking-wide">후생</span></div>
          {futureItems.map((item) => {
            const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
            return (
              <button key={item.id}
                className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
                onClick={() => router.push(`/studio/future-life/result?id=${item.id}`)}>
                {item.generatedImageUrl ? (
                  <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image src={item.generatedImageUrl} alt="후생 이미지" width={60} height={60} className="w-full h-full object-cover" quality={70} />
                  </div>
                ) : (
                  <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-cyan-50 to-violet-100 flex items-center justify-center flex-shrink-0 text-2xl">
                    {item.category ? REBIRTH_CATEGORY_EMOJI[item.category] : '🔮'}
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                      <p className="text-base font-bold text-cyan-600">
                        {item.category ? `${REBIRTH_CATEGORY_EMOJI[item.category]} ${item.rebirthType ?? REBIRTH_CATEGORY_LABEL[item.category]}` : '후생'}
                      </p>
                      {item.wittyOneLiner && <p className="text-xs text-gray-500 mt-1 truncate">{item.wittyOneLiner}</p>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => handleDeleteFuture(e, item.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 스튜디오 탭 (동물상·AI프로필·나이시뮬·MBTI) ──────────

function StudioTab() {
  const router = useRouter()
  const [animalFaces, setAnimalFaces] = useState<AnimalFace[]>([])
  const [aiProfiles, setAiProfiles] = useState<AiProfile[]>([])
  const [ageSimulations, setAgeSimulations] = useState<AgeSimulation[]>([])
  const [mbtiMatches, setMbtiMatches] = useState<MbtiMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      animalFaceApi.getList().catch(() => [] as AnimalFace[]),
      aiProfileApi.getList().catch(() => [] as AiProfile[]),
      ageSimulationApi.getList().catch(() => [] as AgeSimulation[]),
      mbtiMatchApi.getList().catch(() => [] as MbtiMatch[]),
    ])
      .then(([af, ap, as_, mm]) => {
        setAnimalFaces(af.filter((x) => x.status === 'COMPLETED'))
        setAiProfiles(ap.filter((x) => x.status === 'COMPLETED'))
        setAgeSimulations(as_.filter((x) => x.status === 'COMPLETED'))
        setMbtiMatches(mm.filter((x) => x.status === 'COMPLETED'))
      })
      .catch((err) => { if (!(err instanceof UnauthenticatedError)) toast.error('기록을 불러오는 데 실패했습니다.') })
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteAnimalFace = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await animalFaceApi.delete(id); setAnimalFaces((prev) => prev.filter((x) => x.id !== id)); toast.success('삭제되었습니다.') }
    catch { toast.error('삭제에 실패했습니다.') }
  }
  const handleDeleteAiProfile = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await aiProfileApi.delete(id); setAiProfiles((prev) => prev.filter((x) => x.id !== id)); toast.success('삭제되었습니다.') }
    catch { toast.error('삭제에 실패했습니다.') }
  }
  const handleDeleteAgeSimulation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await ageSimulationApi.delete(id); setAgeSimulations((prev) => prev.filter((x) => x.id !== id)); toast.success('삭제되었습니다.') }
    catch { toast.error('삭제에 실패했습니다.') }
  }
  const handleDeleteMbtiMatch = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await mbtiMatchApi.delete(id); setMbtiMatches((prev) => prev.filter((x) => x.id !== id)); toast.success('삭제되었습니다.') }
    catch { toast.error('삭제에 실패했습니다.') }
  }

  if (loading) return <LoadingSkeleton />

  const isEmpty = animalFaces.length === 0 && aiProfiles.length === 0 && ageSimulations.length === 0 && mbtiMatches.length === 0
  if (isEmpty) return (
    <EmptyState emoji="🎨" title="아직 스튜디오 기록이 없어요" desc="동물상, AI 프로필, 나이 시뮬레이션 등을 이용해보세요"
      label="스튜디오 가기" color="bg-violet-600 hover:bg-violet-700" onClick={() => router.push('/studio')} />
  )

  function DeleteMenu({ onDelete }: { onDelete: (e: React.MouseEvent) => void }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors" onClick={(e) => e.stopPropagation()}>
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

  return (
    <div className="pb-10">
      {/* 동물상 */}
      {animalFaces.length > 0 && (
        <div className="mb-1">
          <div className="px-5 pt-4 pb-1"><span className="text-sm font-semibold text-gray-400 tracking-wide">동물상</span></div>
          {animalFaces.map((item) => {
            const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
            return (
              <button key={item.id}
                className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
                onClick={() => router.push(`/studio/animal-face/result?id=${item.id}`)}>
                {item.sourceImageUrl ? (
                  <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image src={item.sourceImageUrl} alt="동물상 사진" width={60} height={60} className="w-full h-full object-cover" quality={70} />
                  </div>
                ) : (
                  <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-orange-50 to-rose-100 flex items-center justify-center flex-shrink-0 text-2xl">
                    {item.animalType ? ANIMAL_TYPE_EMOJI[item.animalType] : '🦊'}
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                      {item.animalType ? (
                        <p className="text-base font-bold text-orange-600">
                          {ANIMAL_TYPE_EMOJI[item.animalType]} {ANIMAL_TYPE_LABEL[item.animalType]}
                          {item.subType && <span className="text-sm font-normal text-gray-400 ml-1">({item.subType})</span>}
                        </p>
                      ) : <p className="text-sm text-gray-400">분석 중</p>}
                      {item.wittyOneLiner && <p className="text-xs text-gray-500 mt-1 truncate">{item.wittyOneLiner}</p>}
                    </div>
                    <DeleteMenu onDelete={(e) => handleDeleteAnimalFace(e, item.id)} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* AI 프로필 */}
      {aiProfiles.length > 0 && (
        <div className="mb-1">
          <div className="px-5 pt-4 pb-1"><span className="text-sm font-semibold text-gray-400 tracking-wide">AI 프로필</span></div>
          {aiProfiles.map((item) => {
            const formattedDate = item.createdAt ? formatDate(item.createdAt) : null
            return (
              <button key={item.id}
                className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100"
                onClick={() => router.push(`/studio/ai-profile/result?id=${item.id}`)}>
                {item.generatedImageUrl ? (
                  <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image src={item.generatedImageUrl} alt="AI 프로필" width={60} height={60} className="w-full h-full object-cover" quality={70} />
                  </div>
                ) : (
                  <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center flex-shrink-0 text-2xl">🎨</div>
                )}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {formattedDate && <p className="text-sm font-semibold text-gray-800 mb-1">{formattedDate.main}</p>}
                      {item.style ? (
                        <p className="text-base font-bold text-pink-600">🎨 {PROFILE_STYLE_LABEL[item.style]}</p>
                      ) : <p className="text-sm text-gray-400">생성 중</p>}
                      {item.wittyOneLiner && <p className="text-xs text-gray-500 mt-1 truncate">{item.wittyOneLiner}</p>}
                    </div>
                    <DeleteMenu onDelete={(e) => handleDeleteAiProfile(e, item.id)} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* 나이 시뮬레이션 */}
      {ageSimulations.length > 0 && (
        <div className="mb-1">
          <div className="px-5 pt-4 pb-1"><span className="text-sm font-semibold text-gray-400 tracking-wide">나이 시뮬레이션</span></div>
          {ageSimulations.map((item) => {
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
                    <DeleteMenu onDelete={(e) => handleDeleteAgeSimulation(e, item.id)} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* MBTI 매칭 */}
      {mbtiMatches.length > 0 && (
        <div className="mb-1">
          <div className="px-5 pt-4 pb-1"><span className="text-sm font-semibold text-gray-400 tracking-wide">MBTI 매칭</span></div>
          {mbtiMatches.map((item) => {
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
                    <DeleteMenu onDelete={(e) => handleDeleteMbtiMatch(e, item.id)} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────

type TabId = 'skin' | 'face-reading' | 'past-life' | 'studio'

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: 'skin', label: '피부 분석' },
  { id: 'face-reading', label: '관상' },
  { id: 'past-life', label: '전생/후생' },
  { id: 'studio', label: '스튜디오' },
]

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('skin')

  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">기록</h1>
        <p className="text-sm text-gray-400 mt-0.5">나의 분석 히스토리</p>
      </div>

      <div className="flex border-b border-gray-100 overflow-x-auto">
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
      {activeTab === 'past-life' && <PastFutureTab />}
      {activeTab === 'studio' && <StudioTab />}
    </div>
  )
}
