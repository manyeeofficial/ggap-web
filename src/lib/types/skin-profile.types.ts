// Skin Profile Request/Response Types
import { SkinType } from './skin-analysis.types'

export type SkinConcern =
  | 'WRINKLE' | 'PIGMENTATION' | 'ACNE' | 'PORE' | 'REDNESS'
  | 'ELASTICITY' | 'TEXTURE' | 'HYDRATION' | 'DARK_CIRCLE'

export type SkinGoal =
  | 'ANTI_AGING' | 'BRIGHTENING' | 'ACNE_CARE' | 'PORE_CARE'
  | 'SOOTHING' | 'FIRMING' | 'HYDRATING' | 'EVEN_TONE'

export interface SkinProfile {
  skinType?: SkinType
  concerns: SkinConcern[]
  goals: SkinGoal[]
}

export interface SkinProfileRequest {
  skinType?: SkinType
  concerns: SkinConcern[]
  goals: SkinGoal[]
}
