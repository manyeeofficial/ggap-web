// Skin Analysis Request/Response Types

// POST /skin-analysis/anonymous 응답
export interface AnonymousSkinAnalysis {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  token: string
}

// GET /skin-analysis/{id}/status 응답
export interface SkinAnalysisStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  imageUrl?: string
}

export type PersonalColor =
  | 'SPRING_PALE' | 'SPRING_LIGHT' | 'SPRING_BRIGHT' | 'SPRING_TRUE'
  | 'SUMMER_PALE' | 'SUMMER_LIGHT' | 'SUMMER_MUTE' | 'SUMMER_TRUE'
  | 'AUTUMN_SOFT' | 'AUTUMN_MUTE' | 'AUTUMN_DEEP' | 'AUTUMN_TRUE'
  | 'WINTER_BRIGHT' | 'WINTER_DEEP' | 'WINTER_TRUE' | 'WINTER_PALE'

export interface SkinAnalysis {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  imageUrl?: string
  skinType?: SkinType
  personalColor?: PersonalColor
  estimatedSkinAge?: number
  troubles: TroubleDetail[]
  confidenceScore?: number
  aiSummary?: string
  totalFaceValue?: number
  faceValueBreakdown?: FaceValueBreakdown
  createdAt?: string
}

export type SkinType = 'OILY' | 'DRY' | 'COMBINATION' | 'SENSITIVE' | 'NORMAL'

export type TroubleType =
  | 'WRINKLE' | 'PIGMENTATION' | 'ACNE' | 'PORE' | 'REDNESS'
  | 'ELASTICITY' | 'TEXTURE' | 'HYDRATION' | 'DARK_CIRCLE'

export type Severity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE'

export interface TroubleDetail {
  troubleType: TroubleType
  severity: Severity
  score: number
  description?: string
}

export interface FaceValueBreakdown {
  baseValue: number
  skinValue: number
  harmonyValue: number
  impressionValue: number
  ageBonus: number
  rarityBonus: number
  deductions: number
}
