import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiResponse } from '@/lib/types'

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

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
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

    // Request interceptor - 쿠키의 accessToken을 Authorization 헤더에 추가
    this.client.interceptors.request.use(
      (config) => {
        const token = getCookie('Authorization')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
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
