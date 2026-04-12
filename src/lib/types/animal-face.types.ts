export type AnimalType = 'DOG' | 'CAT' | 'FOX' | 'RABBIT' | 'BEAR' | 'DEER' | 'WOLF' | 'HAMSTER'
export type AnimalCategory = 'FIRST_IMPRESSION' | 'PERSONALITY' | 'ROMANCE' | 'HIDDEN_CHARM'

export interface AnimalMatchRate {
  animalType: AnimalType
  subType: string
  rate: number
}

export interface AnimalAnalysis {
  category: AnimalCategory
  summary: string
  wittyLine: string
  keywords: string[]
}

export interface AnimalFace {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  sourceImageUrl?: string
  animalType?: AnimalType
  subType?: string
  matchRates: AnimalMatchRate[]
  analyses: AnimalAnalysis[]
  bestMatch?: AnimalType
  worstMatch?: AnimalType
  wittyOneLiner?: string
  createdAt?: string
}

export interface AnimalFaceStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
}
