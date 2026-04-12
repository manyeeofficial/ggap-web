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
  createdAt?: string
}

export interface MbtiMatchStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
}
