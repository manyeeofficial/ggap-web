'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import { MoreVertical, Trash2, Camera } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { skinAnalysisApi } from '@/lib/api'
import type { SkinAnalysis, SkinType, TroubleType } from '@/lib/types'

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

  return {
    main: `${month}월 ${day}일 ${dayName}요일`,
    sub: `${ampm} ${displayHour}:${minute}`,
  }
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
  )
    return '지난 달'
  return `${year}년 ${month}월`
}

type AnalysisWithIndex = SkinAnalysis & { originalIndex: number }

export default function HistoryPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    skinAnalysisApi
      .getList()
      .then((data) => {
        setAnalyses(data.filter((a) => a.status === 'COMPLETED'))
      })
      .catch((err) => {
        console.error('Failed to load history:', err)
        toast.error('분석 기록을 불러오는 데 실패했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await skinAnalysisApi.delete(id)
      setAnalyses((prev) => prev.filter((a) => a.id !== id))
      toast.success('분석 기록이 삭제되었습니다.')
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-5 pt-8 pb-4 border-b border-gray-100">
          <Skeleton className="h-7 w-14 mb-1.5" />
          <Skeleton className="h-4 w-32" />
        </div>
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
      </div>
    )
  }

  // 월별 그룹핑 (원본 인덱스 유지)
  const groups: { label: string; items: AnalysisWithIndex[] }[] = []
  const groupMap: Record<string, AnalysisWithIndex[]> = {}

  analyses.forEach((item, index) => {
    const label = item.createdAt ? getMonthGroup(item.createdAt) : '기타'
    if (!groupMap[label]) {
      groupMap[label] = []
      groups.push({ label, items: groupMap[label] })
    }
    groupMap[label].push({ ...item, originalIndex: index })
  })

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-4 border-b border-gray-100">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">기록</h1>
          {analyses.length > 0 && (
            <span className="text-sm font-medium text-gray-400">{analyses.length}회</span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">나의 피부 변화 히스토리</p>
      </div>

      {analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-5">
            <Camera className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">아직 분석 기록이 없어요</p>
          <p className="text-sm text-gray-400 mb-8">첫 번째 피부 분석을 시작해보세요</p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-6"
            onClick={() => router.push('/camera')}
          >
            <Camera className="w-4 h-4 mr-2" />
            분석 시작하기
          </Button>
        </div>
      ) : (
        <div className="pb-10">
          {groups.map((group) => (
            <div key={group.label} className="mb-1">
              {/* 월별 섹션 헤더 */}
              <div className="px-5 pt-4 pb-1">
                <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
                  {group.label}
                </span>
              </div>

              {/* 리스트 아이템 */}
              <div>
                {group.items.map((item) => {
                  const faceValue = item.totalFaceValue ?? 0
                  const prevFaceValue =
                    item.originalIndex < analyses.length - 1
                      ? (analyses[item.originalIndex + 1].totalFaceValue ?? 0)
                      : null
                  const change = prevFaceValue !== null ? faceValue - prevFaceValue : null

                  const topTroubles = item.troubles
                    .filter((t) => t.severity !== 'NONE')
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 2)

                  const formattedDate = item.createdAt ? formatDate(item.createdAt) : null

                  return (
                    <button
                      key={item.id}
                      className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      onClick={() => router.push(`/analysis-result?id=${item.id}`)}
                    >
                      {/* 썸네일 */}
                      {item.imageUrl ? (
                        <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={item.imageUrl}
                            alt="분석 사진"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">
                          👤
                        </div>
                      )}

                      {/* 콘텐츠 */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {/* 날짜 */}
                            {formattedDate && (
                              <p className="text-sm font-semibold text-gray-800 mb-1">
                                {formattedDate.main}
                              </p>
                            )}

                            {/* 얼굴값 */}
                            <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                              {faceValue.toLocaleString()}원
                            </p>

                            {/* 등락 */}
                            {change !== null && change !== 0 && (
                              <p className={`text-xs font-semibold mt-0.5 ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {change > 0 ? '▲' : '▼'} {Math.abs(change).toLocaleString()}원
                              </p>
                            )}

                            {/* 태그 영역: 피부 타입 + 트러블 */}
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

                          {/* 액션 버튼 영역 */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
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
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={(e) => handleDelete(e, item.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 구분선 */}
              <div className="mx-5 border-b border-gray-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}