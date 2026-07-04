export type MbtiAxis = 'EI' | 'SN' | 'TF' | 'JP'
export type MatchLevel = 'SPOILER' | 'HONEST' | 'SUBTLE' | 'DOUBLE_LIFE' | 'FRAUD'

export interface AxisMatch {
  axis: MbtiAxis
  faceResult: string
  faceConfidence: number
  mbtiResult: string
  isMatch: boolean
  wittyLine: string
}

export interface MbtiMatch {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  mbti: string
  overallMatchRate?: number
  matchLevel?: MatchLevel
  axisMatches: AxisMatch[]
  story?: string
  wittyOneLiner?: string
  faceCode?: string // 겉 인상 = 낯빛코드 (관상 결과가 있을 때만)
  outerVsInnerNote?: string // 겉(낯빛코드) vs 속(MBTI) 갭 해설
  createdAt?: string
}

export interface MbtiMatchStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
}
