import type { Metadata } from 'next'
import { Suspense } from 'react'
import AnalysisResultContent from './AnalysisResultContent'

export const metadata: Metadata = {
  title: '내 얼굴값 공개 🔥 | 077.co.kr',
  description: 'AI가 분석한 나의 얼굴값! 당신의 얼굴값은 얼마일까요? 077.co.kr에서 지금 확인해보세요.',
  openGraph: {
    title: '내 얼굴값 공개 🔥',
    description: 'AI가 분석한 나의 얼굴값! 당신의 얼굴값은 얼마일까요? 077.co.kr에서 지금 확인해보세요.',
    type: 'website',
    siteName: '077.co.kr',
  },
  twitter: {
    card: 'summary_large_image',
    title: '내 얼굴값 공개 🔥',
    description: 'AI가 분석한 나의 얼굴값! 당신의 얼굴값은 얼마일까요? 077.co.kr에서 지금 확인해보세요.',
  },
}

export default function AnalysisResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="h-14 border-b border-gray-100" />
          <div className="h-80 bg-gray-200 animate-pulse" />
          <div className="p-5 space-y-4">
            <div className="h-10 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
            <div className="h-48 bg-gray-100 animate-pulse rounded-2xl" />
          </div>
        </div>
      }
    >
      <AnalysisResultContent />
    </Suspense>
  )
}
