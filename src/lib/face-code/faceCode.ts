/**
 * 낯빛코드(페이스코드) — "얼굴이 말하는 MBTI" 12유형 분류
 *
 * 기획: `기획_분석_및_개선안.md` 3장.
 * 핵심: 관상 9부위 점수(이미 산출됨)만으로 **결정론적·설명가능**하게 코드를 뽑는다.
 *       추가 AI 호출 0회 · 크레딧 0 — 관상/얼굴값 결과에 무료로 얹는 정체성 레이어.
 *
 * 3축: 온도(해/차) × 무드(청/중/진) × 선명도(또/유) = 2×3×2 = 12유형
 */
import type { FaceReading, FacePart, FacePartReading } from '@/lib/types'

// ─── 코드 타입 ────────────────────────────────────────
export type Temp = '해' | '차' // 온도: 따뜻 / 시크
export type Mood = '청' | '중' | '진' // 무드: 맑음 / 균형 / 진함
export type Def = '또' | '유' // 선명도: 또렷 / 순함
export type FaceCode = `${Temp}${Mood}${Def}` // '해청또' … 12종

export interface AxisResult {
  axis: '온도' | '무드' | '선명도'
  letter: string // 해 / 청 / 또 …
  keyword: string // 따뜻 / 열정 / 결단 …
  score?: number // 0~100 (프론트 산출 시에만. 저장값 파싱 시 undefined)
  evidence: string // 한 줄 근거
}

export interface FaceCodeMeta {
  code: FaceCode
  nickname: string // 별명: '레드카펫 디바상'
  catch: string // "입장하면 카메라가 따라가는 상"
  summary: string // 성격 풀이
  strength: string // 강점
  caution: string // 주의
  work: string // 어울리는 일
  match: FaceCode // 끌리는 궁합 코드
}

export interface FaceCodeResult {
  code: FaceCode
  meta: FaceCodeMeta
  axisKeywords: [string, string, string] // ['시크','열정','결단']
  axes: { temp: AxisResult; mood: AxisResult; def: AxisResult }
  gradient: string // Tailwind 그라데이션 클래스
}

// ─── 산출 로직 ────────────────────────────────────────

const ALL_PARTS: FacePart[] = [
  'FOREHEAD', 'EYES', 'NOSE', 'MOUTH', 'CHIN',
  'EARS', 'CHEEKBONES', 'PHILTRUM', 'GLABELLA',
]

const avg = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
const clamp = (n: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, n))

/** 9부위 점수 맵 (누락 부위는 평균으로 보정해 편향 방지) */
function byPart(readings: FacePartReading[]): Record<FacePart, number> {
  const present = readings
    .map((r) => r.score)
    .filter((s): s is number => typeof s === 'number')
  const mean = present.length ? avg(present) : 70
  const map = {} as Record<FacePart, number>
  for (const part of ALL_PARTS) {
    const matches = readings
      .filter((r) => r.facePart === part)
      .map((r) => r.score)
      .filter((s): s is number => typeof s === 'number')
    map[part] = matches.length ? avg(matches) : mean
  }
  return map
}

/**
 * 관상 데이터에서 낯빛코드를 산출한다.
 * @param r        관상 결과 (readings = 9부위 점수)
 * @param symmetry 대칭값(얼굴값 분석에서 올 때). 없으면 부위 점수만으로 산출.
 * @returns        readings 가 비어 있으면 null
 */
export function deriveFaceCode(
  r: Pick<FaceReading, 'readings'>,
  symmetry?: number,
): FaceCodeResult | null {
  if (!r.readings || r.readings.length === 0) return null

  const p = byPart(r.readings)
  const base = avg(ALL_PARTS.map((k) => p[k])) // 얼굴 내부 평균 = 양분 기준점

  // 온도 — 입꼬리·눈매의 부드러움 (해: 따뜻 / 차: 시크)
  const warmth = avg([p.MOUTH, p.EYES])
  const tempScore = clamp(50 + (warmth - base) * 1.6)
  const temp: Temp = tempScore >= 50 ? '해' : '차'

  // 무드 — 이목구비 대비 + 도화 강도 (청<40 / 중 / 진>60)
  const contrastParts = [p.EYES, p.NOSE, p.MOUTH, p.CHEEKBONES]
  const range = Math.max(...contrastParts) - Math.min(...contrastParts)
  const intensity = avg([p.EYES, p.MOUTH]) // 도화 느낌
  const moodScore = clamp(40 + (range - 12) * 1.4 + (intensity - base) * 0.8)
  const mood: Mood = moodScore < 40 ? '청' : moodScore > 60 ? '진' : '중'

  // 선명도 — 미간·코·턱 또렷함 (+대칭값) (또: 결단 / 유: 순함)
  const sharpParts =
    typeof symmetry === 'number'
      ? [p.GLABELLA, p.NOSE, p.CHIN, symmetry]
      : [p.GLABELLA, p.NOSE, p.CHIN]
  const sharp = avg(sharpParts)
  const defScore = clamp(50 + (sharp - base) * 1.6)
  const def: Def = defScore >= 50 ? '또' : '유'

  const code = `${temp}${mood}${def}` as FaceCode

  const axes = {
    temp: {
      axis: '온도' as const,
      letter: temp,
      keyword: TEMP_KW[temp],
      score: Math.round(tempScore),
      evidence: TEMP_EVIDENCE[temp],
    },
    mood: {
      axis: '무드' as const,
      letter: mood,
      keyword: MOOD_KW[mood],
      score: Math.round(moodScore),
      evidence: MOOD_EVIDENCE[mood],
    },
    def: {
      axis: '선명도' as const,
      letter: def,
      keyword: DEF_KW[def],
      score: Math.round(defScore),
      evidence: DEF_EVIDENCE[def],
    },
  }

  return {
    code,
    meta: FACE_CODE_META[code],
    axisKeywords: [TEMP_KW[temp], MOOD_KW[mood], DEF_KW[def]],
    axes,
    gradient: gradientFor(code),
  }
}

/**
 * 저장된 코드 문자열("차진또")로부터 표시용 결과를 구성한다.
 * 백엔드가 산출·저장한 값(canonical)을 그대로 렌더할 때 사용 — 재산출하지 않아 드리프트가 없다.
 * @returns 코드가 12유형에 없으면 null
 */
export function parseFaceCode(raw: string): FaceCodeResult | null {
  const meta = FACE_CODE_META[raw as FaceCode]
  if (!meta) return null
  const temp = raw[0] as Temp
  const mood = raw[1] as Mood
  const def = raw[2] as Def
  return {
    code: raw as FaceCode,
    meta,
    axisKeywords: [TEMP_KW[temp], MOOD_KW[mood], DEF_KW[def]],
    axes: {
      temp: { axis: '온도', letter: temp, keyword: TEMP_KW[temp], evidence: TEMP_EVIDENCE[temp] },
      mood: { axis: '무드', letter: mood, keyword: MOOD_KW[mood], evidence: MOOD_EVIDENCE[mood] },
      def: { axis: '선명도', letter: def, keyword: DEF_KW[def], evidence: DEF_EVIDENCE[def] },
    },
    gradient: gradientFor(raw as FaceCode),
  }
}

// ─── 축 라벨 / 근거 ───────────────────────────────────

const TEMP_KW: Record<Temp, string> = { 해: '따뜻', 차: '시크' }
const MOOD_KW: Record<Mood, string> = { 청: '맑음', 중: '균형', 진: '열정' }
const DEF_KW: Record<Def, string> = { 또: '결단', 유: '순함' }

const TEMP_EVIDENCE: Record<Temp, string> = {
  해: '입꼬리·눈매가 부드러워 먼저 다가가는 따뜻한 인상',
  차: '또렷한 눈매에 차분한 거리감, 시크한 인상',
}
const MOOD_EVIDENCE: Record<Mood, string> = {
  청: '이목구비 대비가 옅어 맑고 담백한 인상',
  중: '대비가 균형 잡혀 상황에 유연한 인상',
  진: '짙은 대비와 도화 기운으로 강렬하고 몰입도 높은 인상',
}
const DEF_EVIDENCE: Record<Def, string> = {
  또: '미간·코·턱이 또렷해 주관과 결단이 분명한 인상',
  유: '윤곽이 부드러워 수용적이고 편안한 인상',
}

/** 온도(따뜻/시크) × 무드(맑음→진함) 기준 그라데이션 */
function gradientFor(code: FaceCode): string {
  const temp = code[0] as Temp
  const mood = code[1] as Mood
  if (temp === '해') {
    return mood === '청'
      ? 'from-amber-400 to-rose-400'
      : mood === '중'
        ? 'from-orange-400 to-pink-500'
        : 'from-rose-500 to-fuchsia-600'
  }
  return mood === '청'
    ? 'from-sky-500 to-indigo-500'
    : mood === '중'
      ? 'from-indigo-500 to-violet-600'
      : 'from-violet-600 to-slate-800'
}

// ─── 12유형 메타 테이블 ───────────────────────────────
// 기획서 3.3 분석 프로필 그대로.

export const FACE_CODE_META: Record<FaceCode, FaceCodeMeta> = {
  해청또: {
    code: '해청또',
    nickname: '맑은 첫사랑상',
    catch: '첫인사만 해도 호감 적립되는 상',
    summary:
      '따뜻하게 다가가면서도 줏대가 뚜렷한 사람. 솔직해서 속이 얼굴에 다 드러나요. 연애는 직진형이라 밀당을 못 합니다.',
    strength: '첫인상 신뢰도 최상',
    caution: '거절을 어려워함',
    work: '영업·교육·MD 등 사람 상대 직군',
    match: '차진유',
  },
  해청유: {
    code: '해청유',
    nickname: '포근 청순상',
    catch: '혼나다가도 용서받는 무해력의 상',
    summary:
      '맑고 부드러워 곁을 편하게 만드는 사람. 갈등을 싫어하고 늘 분위기를 살핍니다.',
    strength: '누구와도 무난',
    caution: '자기 의견을 미룸',
    work: '케어·서비스·HR',
    match: '차중또',
  },
  해중또: {
    code: '해중또',
    nickname: '다정한 밸런스 리더상',
    catch: '다들 자연스럽게 따르게 되는 상',
    summary:
      '따뜻함과 결단을 겸비해 상황에 따라 톤을 조절하는 균형형. 신뢰가 자연스럽게 모입니다.',
    strength: '신뢰받는 리드',
    caution: '다 챙기다 본인이 소진',
    work: '팀장·기획·중재역',
    match: '차중유',
  },
  해중유: {
    code: '해중유',
    nickname: '편안한 단짝상',
    catch: '10년 친구처럼 편한 상',
    summary: '모나지 않고 두루 잘 맞춰 어디서나 편안한 사람. 함께 있으면 긴장이 풀립니다.',
    strength: '적응력·친화력',
    caution: '존재감이 묻힐 수 있음',
    work: '협업·운영·코디네이터',
    match: '차진또',
  },
  해진또: {
    code: '해진또',
    nickname: '따뜻한 관능 보스상',
    catch: '다정한데 분위기까지 있는 상',
    summary: '따뜻한 카리스마에 몰입력·추진력까지. 한번 정하면 끝까지 갑니다.',
    strength: '사람을 끌고 가는 힘',
    caution: '페이스가 빨라 주변이 따라오기 벅참',
    work: '대표·디렉터·세일즈리드',
    match: '차청유',
  },
  해진유: {
    code: '해진유',
    nickname: '무르익은 무드상',
    catch: '가만있어도 분위기 흐르는 상',
    summary: '따뜻하고 깊은 정서로 부드럽게 사람을 끌어안는 타입. 곁이 편안하고 안정적입니다.',
    strength: '깊은 유대·정서 안정',
    caution: '감정 소모가 큼',
    work: '상담·크리에이티브·브랜딩',
    match: '차청또',
  },
  차청또: {
    code: '차청또',
    nickname: '청순 아이돌상',
    catch: '무표정인데 자꾸 쳐다보게 되는 상',
    summary: '시크하고 맑은 인상에 또렷한 주관. 거리감과 청량함이 공존합니다.',
    strength: '시선을 끄는 존재감',
    caution: '차가워 보여 오해받음',
    work: '디자인·기획·전문직',
    match: '해진유',
  },
  차청유: {
    code: '차청유',
    nickname: '청초 미스터리상',
    catch: '말 안 하면 신비, 말하면 반전인 상',
    summary: '조용하고 맑은데 알수록 반전 매력. 천천히 마음을 엽니다.',
    strength: '신비로운 매력·깊이',
    caution: '속을 잘 안 보여줌',
    work: '연구·창작·기록',
    match: '해진또',
  },
  차중또: {
    code: '차중또',
    nickname: '도시적 프로상',
    catch: '회의실 들어오면 공기 바뀌는 상',
    summary: '시크하고 균형 잡힌 인상에 결단력까지. 프로페셔널한 분위기가 흐릅니다.',
    strength: '신뢰감·실행력',
    caution: '사무적으로 보임',
    work: '컨설팅·금융·전략',
    match: '해청유',
  },
  차중유: {
    code: '차중유',
    nickname: '차분한 큐레이터상',
    catch: '조용한데 안목 있어 보이는 상',
    summary: '차분하고 유연해 균형감이 돋보이는 사람. 고른 시야로 사이를 잡아줍니다.',
    strength: '안정감·심미안',
    caution: '먼저 나서지 않음',
    work: '큐레이션·에디터·기획',
    match: '해중또',
  },
  차진또: {
    code: '차진또',
    nickname: '레드카펫 디바상',
    catch: '입장하면 카메라가 따라가는 상',
    summary: '강렬한 분위기에 또렷함과 시크함의 정점. 존재감이 최강입니다.',
    strength: '압도적 임팩트·추진력',
    caution: '다가가기 전엔 차가워 보임',
    work: '무대·크리에이티브 디렉터·창업',
    match: '해청유',
  },
  차진유: {
    code: '차진유',
    nickname: '고혹 우아상',
    catch: '화 안 내는데 다들 조용해질 상',
    summary: '깊고 우아한 분위기를 부드럽게 두르는 타입. 조용한 카리스마가 있습니다.',
    strength: '품격·정서적 흡인력',
    caution: '속내를 늦게 드러냄',
    work: '브랜드·예술·고급 서비스',
    match: '해청또',
  },
}

/** 12유형 전체 목록 (도감·수집 등에서 재사용) */
export const FACE_CODE_LIST: FaceCodeMeta[] = Object.values(FACE_CODE_META)

// ─── 표시용 헬퍼 (서버 응답·클라 산출 공통) ────────────

/** 코드 문자열(서버 저장값 등 임의 문자열)로 Tailwind 그라데이션 반환 */
export function gradientForCode(code: string): string {
  return gradientFor(code as FaceCode)
}

/** 코드별 캐릭터(빛 정령) 이모지 — 정식 일러스트 전 플레이스홀더 */
const CHARACTER: Record<string, string> = {
  해청또: '💗', 해청유: '🧸', 해중또: '🌻', 해중유: '🍀',
  해진또: '👑', 해진유: '🍷', 차청또: '⭐', 차청유: '🎭',
  차중또: '💼', 차중유: '🖼️', 차진또: '✨', 차진유: '🦢',
}
export function characterFor(code: string): string {
  return CHARACTER[code] ?? '🔮'
}

/** Canvas 공유 카드용 그라데이션 hex [from, to] — `gradientFor`(Tailwind)와 동일 매핑 */
export function gradientHexFor(code: string): [string, string] {
  const temp = code[0]
  const mood = code[1]
  if (temp === '해') {
    return mood === '청' ? ['#fbbf24', '#fb7185'] // amber-400 → rose-400
      : mood === '중' ? ['#fb923c', '#ec4899'] // orange-400 → pink-500
      : ['#f43f5e', '#c026d3'] // rose-500 → fuchsia-600
  }
  return mood === '청' ? ['#0ea5e9', '#6366f1'] // sky-500 → indigo-500
    : mood === '중' ? ['#6366f1', '#7c3aed'] // indigo-500 → violet-600
    : ['#7c3aed', '#1e293b'] // violet-600 → slate-800
}
