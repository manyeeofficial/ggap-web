export type ProfileStyle = 'ID_PHOTO' | 'CELEBRITY' | 'WEBTOON' | 'GHIBLI' | 'YEARBOOK' | 'POP_ART' | 'WATERCOLOR' | 'RETRO_90S' | 'THREE_D_AVATAR' | 'BW_CLASSIC'

export interface AiProfile {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  style?: ProfileStyle
  sourceImageUrl?: string
  originalImageUrl?: string
  generatedImageUrl?: string
  generatedImageHdUrl?: string
  wittyOneLiner?: string
  recommendedStyles: ProfileStyle[]
  similarityScore?: number
  generationAttempts?: number
  createdAt?: string
}

export interface AiProfileStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
}
