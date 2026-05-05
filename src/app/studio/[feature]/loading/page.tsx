'use client'

import { use } from 'react'
import { Brain, ScanFace, Heart, Sparkles, Eye, CheckCircle2, Timer, ImagePlus } from 'lucide-react'
import { faceReadingApi, mbtiMatchApi, ageSimulationApi } from '@/lib/api'
import { StudioLoadingPage, type StudioLoadingConfig } from '@/app/studio/components/StudioLoadingPage'

const CONFIGS: Record<string, StudioLoadingConfig> = {
  'face-reading': {
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
    subtitle: '관상을 해석하고 있어요',
    estimatedTime: '15-30초',
    pollFn: (id) => faceReadingApi.getStatus(id),
    resultPath: (id) => `/studio/face-reading/result?id=${id}`,
    entryPath: '/studio/face-reading',
  },
  'mbti-match': {
    gradient: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700',
    steps: [
      { icon: Brain, text: 'MBTI 분석 중...' },
      { icon: ScanFace, text: '얼굴 특징 대조 중...' },
      { icon: Heart, text: '궁합 계산 중...' },
      { icon: Sparkles, text: '위트 생성 중...' },
    ],
    tips: [
      'MBTI는 16가지 유형으로 사람의 인식과 판단 방식을 분류해요',
      'E(외향)는 사람들과 어울리며, I(내향)는 혼자만의 시간에서 에너지를 얻어요',
      'T(사고)는 논리로, F(감정)는 가치관으로 결정을 내리는 경향이 있어요',
      '얼굴 인상이 성격과 일치할 수도, 전혀 다를 수도 있어요 — 그게 포인트!',
      'J(판단)는 계획적이고, P(인식)는 즉흥적인 경향이 있어요',
    ],
    subtitle: 'MBTI와 얼굴의 궁합을 분석하고 있어요',
    estimatedTime: '15-30초',
    pollFn: (id) => mbtiMatchApi.getStatus(id),
    resultPath: (id) => `/studio/mbti-match/result?id=${id}`,
    entryPath: '/studio/mbti-match',
  },
  'age-simulation': {
    gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600',
    steps: [
      { icon: ScanFace, text: '얼굴 특징 분석 중...' },
      { icon: Timer, text: '나이 변화 계산 중...' },
      { icon: ImagePlus, text: '이미지 생성 중...' },
      { icon: CheckCircle2, text: '마무리 중...' },
    ],
    tips: [
      '자외선 차단제가 피부 노화 방지의 가장 중요한 단계예요',
      '충분한 수면이 피부 재생 호르몬 분비를 도와줘요',
      '하루 2리터 수분 섭취가 피부 탄력 유지의 기본이에요',
      '스트레스는 활성산소를 늘려 피부 노화를 가속화해요',
      '비타민 C 성분이 피부 콜라겐 합성에 도움을 줘요',
    ],
    subtitle: '나이 시뮬레이션 이미지를 생성하고 있어요',
    estimatedTime: '30-60초',
    progressMode: 'slow',
    rotateDuration: 2.5,
    pollFn: (id) => ageSimulationApi.getStatus(id),
    resultPath: (id) => `/studio/age-simulation/result?id=${id}`,
    entryPath: '/studio/age-simulation',
  },
}

export default function StudioFeatureLoadingPage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = use(params)
  const config = CONFIGS[feature]

  if (!config) return null

  return <StudioLoadingPage config={config} />
}
