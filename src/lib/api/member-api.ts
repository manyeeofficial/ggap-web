import { axiosInstance } from './client'
import type {
  Member,
  MemberUpdateRequest,
  AppleAuthSession,
  AppleCompleteSignupRequest,
  SocialCallbackResponse,
  SocialCompleteSignupRequest,
} from '@/lib/types'

export const memberApi = {
  // Apple 로그인 URL 조회
  async getAppleSigninUrl(): Promise<string> {
    const response = await axiosInstance.get<{ authUrl: string }>('/apple-auth/signin-url')
    return response.data.authUrl
  },

  // Apple 인증 세션 조회 (Apple 콜백 후 session 파라미터로 호출)
  async getAppleAuthSession(sessionId: string): Promise<AppleAuthSession> {
    const response = await axiosInstance.get<AppleAuthSession>(`/apple-auth/session/${sessionId}`)
    return response.data
  },

  // Apple 회원가입 완료 (전화번호 입력 필요한 경우)
  async completeAppleSignup(data: AppleCompleteSignupRequest): Promise<string> {
    const response = await axiosInstance.post<string>('/apple-auth/complete-signup', data)
    return response.data
  },

  // Kakao 로그인 URL 조회
  async getKakaoSigninUrl(): Promise<string> {
    const response = await axiosInstance.get<{ authUrl: string }>('/kakao-auth/signin-url')
    return response.data.authUrl
  },

  // Kakao OAuth 콜백 처리
  async kakaoCallback(code: string): Promise<SocialCallbackResponse> {
    const response = await axiosInstance.post<SocialCallbackResponse>('/kakao-auth/callback', { code })
    return response.data
  },

  // Kakao 회원가입 완료
  async kakaoCompleteSignup(data: SocialCompleteSignupRequest): Promise<string> {
    const response = await axiosInstance.post<string>('/kakao-auth/complete-signup', data)
    return response.data
  },

  // Naver 로그인 URL 조회
  async getNaverSigninUrl(): Promise<string> {
    const response = await axiosInstance.get<{ authUrl: string }>('/naver-auth/signin-url')
    return response.data.authUrl
  },

  // Naver OAuth 콜백 처리
  async naverCallback(code: string, state?: string): Promise<SocialCallbackResponse> {
    const response = await axiosInstance.post<SocialCallbackResponse>('/naver-auth/callback', { code, state })
    return response.data
  },

  // Naver 회원가입 완료
  async naverCompleteSignup(data: SocialCompleteSignupRequest): Promise<string> {
    const response = await axiosInstance.post<string>('/naver-auth/complete-signup', data)
    return response.data
  },

  // 로그아웃 (서버가 쿠키를 만료시킴)
  async logout(): Promise<void> {
    await axiosInstance.post('/member/logout')
  },

  // 회원 정보 조회
  async getMe(): Promise<Member> {
    const response = await axiosInstance.get<Member>('/member')
    return response.data
  },

  // 회원 정보 수정
  async updateProfile(data: MemberUpdateRequest): Promise<Member> {
    const response = await axiosInstance.put<Member>('/member', data)
    return response.data
  },

  // 프로필 이미지 수정
  async updateProfileImage(file: File): Promise<Member> {
    const formData = new FormData()
    formData.append('image', file)
    const response = await axiosInstance.patch<Member>('/member/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // 회원탈퇴
  async withdraw(): Promise<void> {
    await axiosInstance.delete('/member/withdrawal')
  },

  // MBTI 저장
  async updateMbti(mbti: string): Promise<void> {
    await axiosInstance.put('/member/mbti', { mbti })
  },

  // 생년월일 저장
  async updateBirthdate(birthdate: string, isLunar: boolean): Promise<void> {
    await axiosInstance.put('/member/birthdate', { birthdate, isLunar: String(isLunar) })
  },
}
