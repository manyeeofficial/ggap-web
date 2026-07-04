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
  { url: /^\/stats$/, method: 'get' },              // 서비스 통계 (공개)
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

    // Request interceptor - 호출 전 토큰 만료를 판단해 필요 시 선제 갱신
    this.client.interceptors.request.use(
      async (config) => {
        const accessToken = getCookie('Authorization')
        const refreshToken = getCookie('Refresh-token')
        const isPublic = isPublicApiUrl(config.url, config.method)

        // 유효한 accessToken → 그대로 사용
        if (accessToken && !isTokenExpired(accessToken)) {
          config.headers.Authorization = `Bearer ${accessToken}`
          return config
        }

        // accessToken 만료/부재 + refreshToken 존재 → 요청을 보내기 전에 선제 갱신
        if (refreshToken) {
          try {
            const newToken = await this.performRefresh()
            config.headers.Authorization = `Bearer ${newToken}`
            return config
          } catch {
            // 갱신 실패: 공개 API는 인증 없이 진행, 그 외에는 로그인으로 이동
            if (!isPublic) {
              this.redirectToLogin()
              return Promise.reject(new UnauthenticatedError())
            }
            return config
          }
        }

        // 토큰이 전혀 없음
        if (!isPublic) {
          this.redirectToLogin()
          return Promise.reject(new UnauthenticatedError())
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
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isPublicApiUrl(originalRequest.url, originalRequest.method)
        ) {
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

  /**
   * 단일 비행(single-flight) 토큰 갱신.
   * 동시에 여러 요청이 갱신을 필요로 해도 실제 refresh 호출은 1회만 수행하고 결과를 공유한다.
   * 성공 시 새 accessToken 을 반환, 실패 시 throw (redirect 는 호출부에서 처리).
   */
  private performRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.refreshSubscribers.push((token) =>
          token ? resolve(token) : reject(new Error('Token refresh failed'))
        )
      })
    }

    this.isRefreshing = true

    return (async () => {
      const refreshToken = getCookie('Refresh-token')
      if (!refreshToken) {
        this.refreshSubscribers.forEach((cb) => cb(''))
        this.refreshSubscribers = []
        throw new Error('No refresh token')
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

        const token = response.data?.accessToken
        if (!token) throw new Error('Token refresh failed')

        this.refreshSubscribers.forEach((cb) => cb(token))
        this.refreshSubscribers = []
        return token
      } catch (e) {
        this.refreshSubscribers.forEach((cb) => cb(''))
        this.refreshSubscribers = []
        throw e
      } finally {
        this.isRefreshing = false
      }
    })()
  }

  // Response interceptor 의 401 재시도 경로. 선제 갱신이 실패했거나 서버가 토큰을 무효화한 경우 대비.
  private async handleTokenRefresh(originalRequest: any) {
    try {
      const token = await this.performRefresh()
      originalRequest.headers.Authorization = `Bearer ${token}`
      return this.client(originalRequest)
    } catch (e) {
      this.redirectToLogin()
      return Promise.reject(e)
    }
  }

  private redirectToLogin() {
    if (typeof window !== 'undefined') {
      deleteCookies()
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
  }
}

export const apiClient = new ApiClient()
export const axiosInstance = apiClient.client
