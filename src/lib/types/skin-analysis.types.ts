// Skin Analysis Request/Response Types

// GET /skin-analysis/{id}/status 응답
export interface SkinAnalysisStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
}

export interface SkinAnalysis {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  imageUrl?: string
  skinType?: SkinType
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
