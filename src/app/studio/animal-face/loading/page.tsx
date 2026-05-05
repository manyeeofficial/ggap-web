'use client'

import { ScanFace, Feather, Sparkles, CheckCircle2 } from 'lucide-react'
import { animalFaceApi } from '@/lib/api'
import { StudioLoadingPage } from '@/app/studio/components/StudioLoadingPage'

export default function AnimalFaceLoadingPage() {
  return (
    <StudioLoadingPage config={{
      gradient: 'bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600',
      steps: [
        { icon: ScanFace, text: '얼굴 특징 분석 중...' },
        { icon: Feather, text: '동물상 매칭 중...' },
        { icon: Sparkles, text: '성격 해석 중...' },
        { icon: CheckCircle2, text: '결과 정리 중...' },
      ],
      tips: [
        '동물상은 눈 모양, 코끝, 입술 비율의 조합으로 결정돼요',
        '강아지상은 처진 눈꼬리와 둥근 인상이 특징이에요',
        '고양이상은 올라간 눈꼬리와 날카로운 이목구비가 매력이에요',
        '여우상은 갸름한 얼굴형과 영리한 눈빛이 포인트예요',
        '곰상은 넓은 이마와 편안하고 듬직한 인상이에요',
      ],
      discoveries: [
        '눈꼬리 각도 측정 완료',
        '코끝 형태 파악 중',
        '이목구비 비율 분석 중',
        '동물상 유형 대조 중',
      ],
      showFaceScan: true,
      subtitle: '동물상을 분석하고 있어요',
      estimatedTime: '15-30초',
      pollFn: (id) => animalFaceApi.getStatus(id),
      resultPath: (id) => `/studio/animal-face/result?id=${id}`,
      entryPath: '/studio/animal-face',
    }} />
  )
}
