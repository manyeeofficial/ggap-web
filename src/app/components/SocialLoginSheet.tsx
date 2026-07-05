'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/app/components/ui/drawer'

/** 마지막으로 로그인한 플랫폼을 기억하는 localStorage 키 */
const LAST_LOGIN_KEY = 'lastLoginProvider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SocialLoginSheet({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState<'kakao' | 'naver' | null>(null)
  const [lastProvider, setLastProvider] = useState<'kakao' | 'naver' | null>(null)

  // 바텀시트가 열릴 때 마지막 로그인 플랫폼을 읽어온다 (SSR hydration 회피)
  useEffect(() => {
    if (!open) return
    const saved = localStorage.getItem(LAST_LOGIN_KEY)
    setLastProvider(saved === 'kakao' || saved === 'naver' ? saved : null)
  }, [open])

  const handleLogin = async (provider: 'kakao' | 'naver') => {
    setLoading(provider)
    try {
      const authUrl =
        provider === 'kakao'
          ? await memberApi.getKakaoSigninUrl()
          : await memberApi.getNaverSigninUrl()
      // 마지막 로그인 플랫폼 기록 (같은 도메인 redirect 이후에도 유지)
      localStorage.setItem(LAST_LOGIN_KEY, provider)
      window.location.href = authUrl
    } catch {
      toast.error(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인에 실패했습니다.`)
      setLoading(null)
    }
  }

  /**
   * 버튼 중앙에 붙는 "마지막 로그인" 말풍선.
   * placement="top": 버튼 위 / placement="bottom": 버튼 아래 (위쪽 설명 영역 가림 방지)
   */
  const LastLoginBadge = ({ placement }: { placement: 'top' | 'bottom' }) => (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none ${
        placement === 'top' ? 'bottom-full translate-y-2' : 'top-full -translate-y-2'
      }`}
    >
      <div className="relative">
        {/* 꼬리 — 본체와 같은 색 회전 사각형 (버튼 쪽을 향함) */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 rotate-45 ${
            placement === 'top' ? '-bottom-0.5' : '-top-0.5'
          }`}
          aria-hidden="true"
        />
        {/* 본체 */}
        <div className="relative bg-slate-900 rounded-md px-2.5 py-1.5 shadow-lg flex items-center justify-center">
          <span className="text-white text-[10px] font-semibold whitespace-nowrap leading-none">
            마지막 로그인
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-base font-bold">
            로그인하고 더 많은 기능을 이용하세요
          </DrawerTitle>
          <p className="text-center text-xs text-gray-500 mt-1">관상·MBTI·나이 시뮬레이션 등 다양한 기능 무료 이용</p>
        </DrawerHeader>

        <div className="px-5 pb-8 pt-3 space-y-3">
          <div className="relative">
            {lastProvider === 'kakao' && <LastLoginBadge placement="top" />}
            <button
              onClick={() => handleLogin('kakao')}
              disabled={!!loading}
              className="w-full h-12 rounded-2xl bg-[#FEE500] hover:bg-[#FDD835] disabled:opacity-60 flex items-center justify-center gap-2 font-semibold text-gray-900 transition-colors"
            >
              {loading === 'kakao' ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.43 4.68 7.07l-1.23 4.47c-.07.27.18.5.44.4l5.42-2.35c.89.13 1.8.2 2.69.2 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                </svg>
              )}
              카카오로 1초 로그인
            </button>
          </div>

          <div className="relative">
            {lastProvider === 'naver' && <LastLoginBadge placement="top" />}
            <button
              onClick={() => handleLogin('naver')}
              disabled={!!loading}
              className="w-full h-12 rounded-2xl bg-[#03C75A] hover:bg-[#02B350] disabled:opacity-60 flex items-center justify-center gap-2 font-semibold text-white transition-colors"
            >
              {loading === 'naver' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
                </svg>
              )}
              네이버로 1초 로그인
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
