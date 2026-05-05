'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { memberApi } from '@/lib/api'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/app/components/ui/drawer'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SocialLoginSheet({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState<'kakao' | 'naver' | null>(null)

  const handleLogin = async (provider: 'kakao' | 'naver') => {
    setLoading(provider)
    try {
      const authUrl =
        provider === 'kakao'
          ? await memberApi.getKakaoSigninUrl()
          : await memberApi.getNaverSigninUrl()
      window.location.href = authUrl
    } catch {
      toast.error(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인에 실패했습니다.`)
      setLoading(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-base font-bold">
            로그인하고 더 많은 기능을 이용하세요
          </DrawerTitle>
          <p className="text-center text-xs text-gray-500 mt-1">관상·동물상·AI프로필 등 6가지 기능 무료 이용</p>
        </DrawerHeader>

        <div className="px-5 pb-8 pt-3 space-y-3">
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
      </DrawerContent>
    </Drawer>
  )
}
