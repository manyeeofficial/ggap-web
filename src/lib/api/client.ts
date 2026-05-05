import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiResponse } from '@/lib/types'

export class UnauthenticatedError extends Error {
  constructor() {
    super('unauthenticated')
    this.name = 'UnauthenticatedError'
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp('(?:^|; )' + escapedName + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now() + 30 * 1000
  } catch {
    return true
  }
}

function getDomainStr(): string {
  if (typeof window === 'undefined') return ''
  return window.location.hostname.endsWith('ggap.ai') ? '; domain=.ggap.ai' : ''
}

export function deleteCookies() {
  if (typeof document === 'undefined') return
  const domainStr = getDomainStr()
  // domain 지정 쿠키 삭제
  document.cookie = `Authorization=; path=/; max-age=0; samesite=lax${domainStr}`
  document.cookie = `Refresh-token=; path=/; max-age=0; samesite=lax${domainStr}`
  // domain 없이 저장된 쿠키도 함께 삭제
  if (domainStr) {
    document.cookie = 'Authorization=; path=/; max-age=0; samesite=lax'
    document.cookie = 'Refresh-token=; path=/; max-age=0; samesite=lax'
  }
}

// 인증 없이 호출 가능한 공개 API 패턴
const PUBLIC_API_PATTERNS: Array<{ url: RegExp; method?: string }> = [
  { url: /^\/member$/, method: 'get' },          // 로그인 여부 확인
  { url: /^\/member$/, method: 'post' },          // 회원가입
  { url: /^\/member\/login$/ },                   // 로그인
  { url: /^\/member\/refresh-token$/ },           // 토큰 갱신
  { url: /^\/member\/check-duplicate$/, method: 'get' }, // 중복 확인
  { url: /^\/member\/verification-code/ },        // 전화번호 인증
  { url: /^\/apple-auth\// },                     // Apple 인증
  { url: /^\/kakao-auth\// },                     // Kakao 인증
  { url: /^\/naver-auth\// },                     // Naver 인증
  { url: /^\/products\/trending$/, method: 'get' }, // 트렌딩 상품 (공개)
  { url: /^\/skin-analysis\/anonymous$/, method: 'post' }, // 비회원 분석
  { url: /^\/skin-analysis\/\d+\/status$/, method: 'get' }, // 분석 상태 폴링
  { url: /^\/skin-analysis\/\d+$/, method: 'get' }, // 분석 결과 조회 (token 파라미터로 비회원 접근)
]

function isPublicApiUrl(url?: string, method?: string): boolean {
  if (!url) return false
  return PUBLIC_API_PATTERNS.some(
    (pattern) =>
      pattern.url.test(url) &&
      (pattern.method == null || pattern.method === method?.toLowerCase())
  )
}

interface RefreshTokenResponse {
  accessToken: string
}

class ApiClient {
  public client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    // Request interceptor - 토큰 사전 확인 후 Authorization 헤더 추가
    this.client.interceptors.request.use(
      (config) => {
        const accessToken = getCookie('Authorization')
        const refreshToken = getCookie('Refresh-token')

        if (!accessToken && !refreshToken && !isPublicApiUrl(config.url, config.method)) {
          this.redirectToLogin()
          return Promise.reject(new UnauthenticatedError())
        }

        if (accessToken && !isTokenExpired(accessToken)) {
          config.headers.Authorization = `Bearer ${accessToken}`
        } else if (accessToken) {
          // 만료된 accessToken이라도 헤더에 담아 보내면
          // response interceptor가 refresh 후 재시도
          config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - 401 시 토큰 갱신
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse<any>>) => {
        const originalRequest = error.config as any
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          return this.handleTokenRefresh(originalRequest)
        }
        if (
          error.response?.status === 500 &&
          originalRequest?.url === '/member' &&
          originalRequest?.method?.toLowerCase() === 'get'
        ) {
          const domainStr = getDomainStr()
          document.cookie = `Refresh-token=; path=/; max-age=0; samesite=lax${domainStr}`
          if (domainStr) {
            document.cookie = 'Refresh-token=; path=/; max-age=0; samesite=lax'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private async handleTokenRefresh(originalRequest: any) {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(this.client(originalRequest))
        })
      })
    }

    this.isRefreshing = true
    const refreshToken = getCookie('Refresh-token')

    if (!refreshToken) {
      this.redirectToLogin()
      return Promise.reject(new Error('No refresh token'))
    }

    try {
      const response = await axios.post<RefreshTokenResponse>(
        `${BASE_URL}/member/refresh-token`,
        null,
        {
          headers: { 'Refresh-Token': refreshToken },
          withCredentials: true,
        }
      )

      const responseAccessToken = response.data?.accessToken

      if (!responseAccessToken) {
        this.redirectToLogin()
        return Promise.reject(new Error('Token refresh failed'))
      }

      this.refreshSubscribers.forEach((cb) => cb(responseAccessToken))
      this.refreshSubscribers = []

      originalRequest.headers.Authorization = `Bearer ${responseAccessToken}`
      return this.client(originalRequest)
    } catch {
      this.redirectToLogin()
      return Promise.reject(new Error('Token refresh failed'))
    } finally {
      this.isRefreshing = false
    }
  }

  private redirectToLogin() {
    if (typeof window !== 'undefined') {
      deleteCookies()
      window.location.href = '/'
    }
  }
}

export const apiClient = new ApiClient()
export const axiosInstance = apiClient.client
