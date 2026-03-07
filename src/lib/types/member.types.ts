// Member Request/Response Types

export interface LoginRequest {
  emailAddress?: string
  phoneNumber?: string
  password: string
}

export type MobileCarrier = 'SKT' | 'KT' | 'LGU' | 'SKT_MVNO' | 'KT_MVNO' | 'LGU_MVNO'

export interface SignupRequest {
  phoneNumber: string
  emailAddress: string
  password: string
  nickname?: string
  birthYear?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  mobileCarrier?: MobileCarrier
  agreeMarketing?: boolean
}

export interface VerificationCodeRequest {
  phoneNumber: string
}

export interface VerificationCodeVerifyRequest {
  phoneNumber: string
  code: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  member: Member
}

// Apple 인증 세션 (GET /apple-auth/session/{sessionId} 응답)
export interface AppleAuthSession {
  requiresPhoneNumber: boolean
  tempToken?: string
  email?: string
  nickname?: string
  accessToken?: string
  refreshToken?: string
}

// Apple 회원가입 완료 요청 (POST /apple-auth/complete-signup)
export interface AppleCompleteSignupRequest {
  tempToken: string
  phoneNumber: string
  agreeMarketing?: boolean
}

// 소셜 로그인 콜백 응답 (Kakao / Naver)
export interface SocialCallbackResponse {
  requiresPhoneNumber: boolean
  tempToken?: string
  email?: string
  naverAccessToken?: string
  profileImageUrl?: string
}

// 소셜 회원가입 완료 요청
export interface SocialCompleteSignupRequest {
  tempToken: string
  phoneNumber: string
  mobileCarrier?: MobileCarrier
  birthYear?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  naverAccessToken?: string
  agreeMarketing?: boolean
  profileImageUrl?: string
}

export interface Member {
  nickname: string
  emailAddress: string
  phoneNumber: string
  profileImage?: string
  birthYear?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
}

export interface MemberUpdateRequest {
  nickname?: string
  phoneNumber?: string
  emailAddress: string
  password: string
  birthYear?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
}
