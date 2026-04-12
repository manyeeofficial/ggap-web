export type FacePart =
  | 'FOREHEAD'
  | 'EYES'
  | 'NOSE'
  | 'MOUTH'
  | 'CHIN'
  | 'EARS'
  | 'CHEEKBONES'
  | 'PHILTRUM'
  | 'GLABELLA'

export type FaceReadingType =
  | 'WEALTH'
  | 'LEADER'
  | 'ARTIST'
  | 'SCHOLAR'
  | 'PEOPLE_LUCK'
  | 'OFFICIAL'
  | 'NOBLE'
  | 'PEACH_BLOSSOM'
  | 'LONGEVITY'
  | 'VIRTUE'
  | 'GUARDIAN'
  | 'ENTREPRENEUR'
  | 'DIPLOMAT'
  | 'HEALER'
  | 'ADVENTURER'
  | 'SAGE'

export type FortunePeriod = 'EARLY' | 'MID' | 'LATE' | 'OVERALL'

export interface PeriodFortune {
  period: FortunePeriod
  score: number
  summary: string
  keywords: string[]
  ohaengNote?: string
}

export interface FacePartReading {
  facePart: FacePart
  period: FortunePeriod
  score: number
  fortune: string
  keywords: string[]
  ohaengNote?: string
}

export type OhaengType = 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER'

export interface OhaengData {
  ilganHanja: string
  ilganKor: string
  ilganOhaeng: OhaengType
  distribution: Record<OhaengType, number>
  fusionPattern?: string
  synergyNote?: string
  complementTip?: string
}

export type FaceReadingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface FaceReading {
  id: number
  status: FaceReadingStatus
  errorMessage?: string
  imageUrl?: string
  fortunes: PeriodFortune[]
  readings: FacePartReading[]
  overallType?: FaceReadingType
  overallSummary?: string
  luckyColor?: string
  luckyNumber?: number
  shareCaption?: string
  ohaengData?: OhaengData
  createdAt?: string
}

export interface FaceReadingStatusResponse {
  id: number
  status: FaceReadingStatus
  errorMessage?: string
}
