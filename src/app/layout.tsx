import type { Metadata } from 'next'
import './globals.css'
import { AuthGuard } from './components/AuthGuard'
import { BottomNavWrapper } from './components/BottomNavWrapper'
import { MemberProvider } from '@/lib/store/member-store'
import { SkinProfileProvider } from '@/lib/store/skin-profile-store'
import { Toaster } from './components/ui/sonner'

export const metadata: Metadata = {
  title: 'ㅇㄱㄱ - AI 피부 분석 서비스',
  description: 'AI 기반 얼굴 피부 분석 및 맞춤 제품 추천 서비스',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <MemberProvider>
          <SkinProfileProvider>
            <AuthGuard>
              <BottomNavWrapper>{children}</BottomNavWrapper>
            </AuthGuard>
          </SkinProfileProvider>
        </MemberProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
