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
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now() + 30 * 1000
  } catch {
    return true
  }
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

// 인증 없이 호출 가능한 공개 API 패턴
const PUBLIC_API_PATTERNS: Array<{ url: RegExp; method?: string }> = [
  { url: /^\/member$/, method: 'get' },          // 로그인 여부 확인
  { url: /^\/member$/, method: 'post' },          // 회원가입
  { url: /^\/member\/login$/ },                   // 로그인
  { url: /^\/member\/refresh-token$/ },           // 토큰 갱신
  { url: /^\/member\/verification-code/ },        // 전화번호 인증
  { url: /^\/apple-auth\// },                     // Apple 인증
  { url: /^\/kakao-auth\// },                     // Kakao 인증
  { url: /^\/naver-auth\// },                     // Naver 인증
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
  refreshToken: string
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
      const responseRefreshToken = response.data?.refreshToken

      if (responseAccessToken) {
        setCookie('Authorization', responseAccessToken, 900)
      }

      if (responseRefreshToken) {
        setCookie('Refresh-token', responseRefreshToken, 1209600)
      }

      const newAccessToken = getCookie('Authorization')
      if (!newAccessToken) {
        this.redirectToLogin()
        return Promise.reject(new Error('Token refresh failed'))
      }

      this.refreshSubscribers.forEach((cb) => cb(newAccessToken))
      this.refreshSubscribers = []

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
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
      window.location.href = '/login'
    }
  }
}

export const apiClient = new ApiClient()
export const axiosInstance = apiClient.client
