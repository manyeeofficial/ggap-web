import type { LifeStatus } from './past-life.types'

export type RebirthCategory = 'HUMAN' | 'ANIMAL' | 'INSECT' | 'ALIEN' | 'PLANT' | 'OBJECT'

export interface FutureLife {
  id: number
  status: LifeStatus
  errorMessage?: string
  sourceImageUrl?: string
  generatedImageUrl?: string
  category?: RebirthCategory
  rebirthType?: string
  rebirthReason?: string
  story?: string
  personality?: string
  specialty?: string
  wittyOneLiner?: string
  createdAt?: string
}

export interface FutureLifeStatusResponse {
  id: number
  status: LifeStatus
  errorMessage?: string
}
