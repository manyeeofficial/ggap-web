import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthGuard } from './components/AuthGuard'
import { BottomNavWrapper } from './components/BottomNavWrapper'
import { MemberProvider } from '@/lib/store/member-store'
import { SkinProfileProvider } from '@/lib/store/skin-profile-store'
import { Toaster } from './components/ui/sonner'

export const metadata: Metadata = {
  metadataBase: new URL('https://ggap.ai'),
  title: {
    default: 'ㅇㄱㄱ - 얼굴값 췍! 상위 몇 %인지 궁금하다면?',
    template: '%s | ㅇㄱㄱ',
  },
  description: 'AI가 분석하는 내 얼굴값. 셀카 한 장으로 피부 타입과 트러블을 진단하고 전국 랭킹에서 상위 몇 %인지 확인해보세요.',
  keywords: ['얼굴값', 'AI 피부 분석', '피부 타입 분석', '얼굴 랭킹', '피부 진단', '셀카 분석', '피부 관리', '얼굴값 계산', 'ggap', 'ㅇㄱㄱ'],
  authors: [{ name: 'ggap', url: 'https://ggap.ai' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://ggap.ai',
  },
  /*icons: {
    icon: '/logo/logo.png',
    apple: '/logo/logo.png',
  },*/
  openGraph: {
    title: 'ㅇㄱㄱ - 얼굴값 췍! 상위 몇 %인지 궁금하다면?',
    description: 'AI가 분석하는 내 얼굴값. 셀카 한 장으로 피부 타입과 트러블을 진단하고 전국 랭킹에서 상위 몇 %인지 확인해보세요.',
    url: 'https://ggap.ai',
    siteName: 'ㅇㄱㄱ',
    images: [{ url: '/og/banner.png', width: 1200, height: 630, alt: 'ㅇㄱㄱ - 얼굴값 췍!' }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ㅇㄱㄱ - 얼굴값 췍! 상위 몇 %인지 궁금하다면?',
    description: 'AI가 분석하는 내 얼굴값. 셀카 한 장으로 피부 타입과 트러블을 진단하고 전국 랭킹에서 상위 몇 %인지 확인해보세요.',
    images: ['/og/banner.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-GGVKGQ0FX0" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GGVKGQ0FX0');
          `}
        </Script>
      </head>
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
