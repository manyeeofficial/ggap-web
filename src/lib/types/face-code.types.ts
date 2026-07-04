// 낯빛코드 `/face-code` API 응답 타입 (백엔드가 산출·저장한 정본 값)

export type FaceCodeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface FaceCodeAxis {
  letter: string // 해/청/또 …
  keyword: string // 따뜻/열정/결단 …
  score: number // 0~100
  evidence: string // 근거 1줄
}

export interface FaceCodeAxes {
  temp: FaceCodeAxis
  mood: FaceCodeAxis
  def: FaceCodeAxis
}

export interface FaceCodeMeta {
  code: string // '차진또'
  nickname: string // '레드카펫 디바상'
  catchphrase: string
  temperament: string
  strengths: string
  caution: string
  jobFit: string
  matchCode: string // 궁합 코드
  matchNickname: string
}

export interface FaceCodeAnalysis {
  id: number
  status: FaceCodeStatus
  errorMessage?: string
  imageUrl?: string
  faceCode?: string
  meta?: FaceCodeMeta
  axes?: FaceCodeAxes
  lowConfidence: boolean
  createdAt?: string
}

export interface FaceCodeStatusResponse {
  id: number
  status: FaceCodeStatus
  errorMessage?: string
}
