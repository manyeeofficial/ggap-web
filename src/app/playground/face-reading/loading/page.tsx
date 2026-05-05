'use client'

import { Eye, Sparkles, CheckCircle2, ScanFace } from 'lucide-react'
import { faceReadingApi } from '@/lib/api'
import { StudioLoadingPage } from '@/app/studio/components/StudioLoadingPage'

export default function FaceReadingLoadingPage() {
  return (
    <StudioLoadingPage config={{
      gradient: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700',
      steps: [
        { icon: ScanFace, text: '얼굴 부위 인식 중...' },
        { icon: Eye, text: '관상 특징 분석 중...' },
        { icon: Sparkles, text: '운세 해석 중...' },
        { icon: CheckCircle2, text: '결과 정리 중...' },
      ],
      tips: [
        '관상학은 수천 년의 역사를 가진 동양의 전통 학문이에요',
        '이마는 초년운과 지성, 부모와의 인연을 상징해요',
        '눈썹의 모양과 위치는 재물운과 형제 인연을 나타내요',
        '코는 재물과 중년운을 나타내는 핵심 부위예요',
        '입술이 도톰하고 선명할수록 인복이 많다고 해요',
      ],
      discoveries: [
        '이마 인상선 파악 완료',
        '눈매 형태 분석 중',
        '코끝 특징 측정 중',
        '전체 관상 종합 중',
      ],
      showFaceScan: true,
      subtitle: '관상을 해석하고 있어요',
      estimatedTime: '15-30초',
      pollFn: (id) => faceReadingApi.getStatus(id),
      resultPath: (id) => `/playground/face-reading/result?id=${id}`,
      entryPath: '/playground/face-reading',
    }} />
  )
}
