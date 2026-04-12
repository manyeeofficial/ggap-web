'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, RotateCcw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { faceReadingApi } from '@/lib/api'
import type { FaceReading, FacePart, FaceReadingType, FortunePeriod } from '@/lib/types'
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

// ─── 공유 카드 그리기 ─────────────────────────────────

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function drawFaceReadingShareCard(result: FaceReading): Promise<Blob> {
  const S = 2
  const W = 390 * S
  const H = 580 * S

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 배경
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#2e1065')
  bgGrad.addColorStop(1, '#4c1d95')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // 동양풍 장식선
  ctx.strokeStyle = 'rgba(167,139,250,0.25)'
  ctx.lineWidth = S
  ctx.strokeRect(24 * S, 24 * S, (390 - 48) * S, (580 - 48) * S)

  const pad = 40 * S
  let y = 60 * S

  // 앱 이름
  ctx.font = `600 ${13 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(196,181,253,0.8)'
  ctx.textAlign = 'left'
  ctx.fillText('ㅇㄱㄱ 관상보기', pad, y)
  y += 52 * S

  // 메인 카피 — "나는 ○○할 상"
  const caption = result.shareCaption ?? (result.overallType ? TYPE_LABEL[result.overallType] : '특별한 관상')
  const mainCopy = `"나는 ${caption}"`
  ctx.font = `700 ${22 * S}px -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'

  // 긴 텍스트 줄 바꿈
  const maxWidth = (390 - 80) * S
  const words = mainCopy.split(' ')
  let line = ''
  const lines: string[] = []
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  for (const l of lines) {
    ctx.fillText(l, pad, y)
    y += 32 * S
  }
  y += 8 * S

  // 유형명 서브
  if (result.overallType) {
    ctx.font = `500 ${14 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(196,181,253,0.9)'
    ctx.fillText(`🔮 ${TYPE_LABEL[result.overallType]}`, pad, y)
    y += 40 * S
  }

  // 구분선
  ctx.strokeStyle = 'rgba(167,139,250,0.3)'
  ctx.lineWidth = S
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 28 * S

  // 인생 그래프 (미니 라인)
  const earlyScore = result.fortunes.find(f => f.period === 'EARLY')?.score ?? 0
  const midScore = result.fortunes.find(f => f.period === 'MID')?.score ?? 0
  const lateScore = result.fortunes.find(f => f.period === 'LATE')?.score ?? 0
  const graphPoints = [
    { label: '초년', score: earlyScore },
    { label: '중년', score: midScore },
    { label: '말년', score: lateScore },
  ]

  ctx.font = `500 ${11 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(196,181,253,0.7)'
  ctx.fillText('인생 그래프', pad, y)
  y += 16 * S

  const gW = (390 - 80) * S
  const gH = 50 * S
  const gX = pad
  const gY = y

  // 그래프 배경 라인
  ctx.strokeStyle = 'rgba(167,139,250,0.15)'
  ctx.lineWidth = S * 0.5
  for (const perc of [0.25, 0.5, 0.75]) {
    const lineY = gY + gH * (1 - perc)
    ctx.beginPath()
    ctx.moveTo(gX, lineY)
    ctx.lineTo(gX + gW, lineY)
    ctx.stroke()
  }

  // 라인
  ctx.strokeStyle = 'rgba(167,139,250,0.9)'
  ctx.lineWidth = 2 * S
  ctx.lineJoin = 'round'
  ctx.beginPath()
  graphPoints.forEach(({ score }, i) => {
    const px = gX + (i / (graphPoints.length - 1)) * gW
    const py = gY + gH * (1 - score / 100)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()

  // 점 + 라벨
  graphPoints.forEach(({ label, score }, i) => {
    const px = gX + (i / (graphPoints.length - 1)) * gW
    const py = gY + gH * (1 - score / 100)
    ctx.fillStyle = '#a78bfa'
    ctx.beginPath()
    ctx.arc(px, py, 4 * S, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = `600 ${10 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.textAlign = 'center'
    ctx.fillText(`${label} ${score}`, px, py - 8 * S)
  })
  ctx.textAlign = 'left'
  y += gH + 36 * S

  // 구분선
  ctx.strokeStyle = 'rgba(167,139,250,0.3)'
  ctx.lineWidth = S
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 28 * S

  // 총운 점수 + 행운 색/숫자
  const overallScore = result.fortunes.find(f => f.period === 'OVERALL')?.score ?? 0
  ctx.font = `700 ${18 * S}px -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`총운 ${overallScore}점`, pad, y)
  y += 28 * S

  const infoItems: string[] = []
  if (result.luckyColor) infoItems.push(`🎨 ${result.luckyColor}`)
  if (result.luckyNumber != null) infoItems.push(`🔢 ${result.luckyNumber}`)
  if (infoItems.length > 0) {
    ctx.font = `500 ${13 * S}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(196,181,253,0.85)'
    ctx.fillText(infoItems.join('  '), pad, y)
    y += 36 * S
  }

  // 하단 CTA
  y = H - 52 * S
  ctx.font = `500 ${12 * S}px -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(196,181,253,0.6)'
  ctx.fillText('나도 해보기 → ggap.ai', pad, y)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    )
  })
}

// ─── 메인 컴포넌트 ────────────────────────────────────

function FaceReadingResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [result, setResult] = useState<FaceReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FortunePeriod>('OVERALL')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!id) {
      router.replace('/playground/face-reading')
      return
    }
    faceReadingApi
      .getById(id)
      .then(setResult)
      .catch(() => {
        toast.error('결과를 불러오는 데 실패했습니다.')
        router.replace('/playground/face-reading')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
    if (!result) return
    setSharing(true)
    try {
      const blob = await drawFaceReadingShareCard(result)
      const file = new File([blob], 'face-reading.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 관상 결과 공개 🔮' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'face-reading.png'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('이미지를 저장했습니다.')
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error('공유에 실패했습니다.')
      }
    } finally {
      setSharing(false)
    }
  }

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
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">관상 결과</h1>
      </div>

      {/* 인트로 — 2단 */}
      <div className="px-5 mb-5">
        <p className="text-2xl font-bold text-gray-900 leading-snug">
          {' '}
          <span className="text-violet-600">
            {result.shareCaption ?? (result.overallType ? TYPE_LABEL[result.overallType] : '특별한 관상')}
          </span>
        </p>
        <p className="text-xs text-gray-400 font-medium mb-1">{introText}</p>
      </div>

      {/* 종합 유형 카드 */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg">
          <div className="mb-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">나의 관상 유형</p>
            <h2 className="text-2xl font-bold">{overallTypeLabel}</h2>
            <p className="text-white/70 text-sm mt-0.5">종합 점수 {overallScore}점</p>
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
        </div>
      </div>

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
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 font-semibold"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {sharing ? '생성 중...' : '공유하기'}
          </Button>
          <Button
            onClick={() => router.push('/playground/face-reading')}
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
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
