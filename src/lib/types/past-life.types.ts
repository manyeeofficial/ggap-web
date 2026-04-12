export type EraRegion = 'KOREA' | 'WORLD'

export type PastEra =
  // 한국사
  | 'THREE_KINGDOMS'
  | 'GORYEO'
  | 'JOSEON'
  | 'RETRO_60S'
  | 'RETRO_80S'
  // 세계사
  | 'ANCIENT_EGYPT'
  | 'ANCIENT_GREECE'
  | 'ROMAN_EMPIRE'
  | 'MEDIEVAL_EUROPE'
  | 'RENAISSANCE'
  | 'SILK_ROAD'
  | 'OTTOMAN_EMPIRE'
  | 'AFRICAN_KINGDOM'
  | 'VICTORIAN_ERA'
  | 'JAZZ_AGE'

export type LifeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface PastLife {
  id: number
  status: LifeStatus
  errorMessage?: string
  sourceImageUrl?: string
  generatedImageUrl?: string
  era: PastEra
  region: EraRegion
  story?: string
  characterName?: string
  occupation?: string
  personality?: string
  wittyOneLiner?: string
  createdAt?: string
}

export interface PastLifeStatusResponse {
  id: number
  status: LifeStatus
  errorMessage?: string
}
