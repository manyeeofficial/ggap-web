'use client'

import { ScanFace, Palette, ImagePlus, CheckCircle2 } from 'lucide-react'
import { aiProfileApi } from '@/lib/api'
import type { ProfileStyle } from '@/lib/types'
import { StudioLoadingPage } from '@/app/studio/components/StudioLoadingPage'

const STYLE_TIPS: Record<ProfileStyle, string[]> = {
  ID_PHOTO: [
    '증명사진은 밝은 조명과 중립적인 표정이 핵심이에요',
    '흰 배경에 정면 구도로 단정한 인상을 연출해요',
    '이 증명사진이면 면접관이 서류 먼저 통과시킬 비주얼',
  ],
  CELEBRITY: [
    '패션 에디터가 \'커버 감이다\' 고개 끄덕이는 화보를 생성 중이에요',
    '글래머러스한 조명과 자신감 있는 포즈로 연출해요',
    '매니저가 \'아직 스케줄 남았어요\'라고 말릴 것 같은 화보',
  ],
  WEBTOON: [
    '국내 최대 플랫폼 목요 연재 주인공 포스로 변신 중이에요',
    '큰 눈과 선명한 선화가 특징인 웹툰 스타일로 변환해요',
    '네이버 목요 웹툰 주인공 공석 하나 채울 비주얼',
  ],
  GHIBLI: [
    '미야자키 감독이 직접 스케치했을 법한 따뜻함으로 변환 중이에요',
    '부드러운 수채화 질감과 따뜻한 색감이 적용돼요',
    '바람이 불면 피아노 BGM 깔리는 그 장면',
  ],
  YEARBOOK: [
    '세대를 초월한 클래식 학창 시절의 순수함으로 변환 중이에요',
    '소프트한 보케 배경과 따뜻한 스튜디오 조명이 적용돼요',
    '하버드 옆 동네 졸업이라도 이 사진이면 충분해요',
  ],
  POP_ART: [
    '앤디 워홀이 선택했을 강렬한 색감의 아이콘으로 변환 중이에요',
    '굵은 윤곽선과 대담한 원색으로 팝아트 특유의 감성을 연출해요',
    'MoMA에 걸어도 \'오, 누구지?\' 반응 나올 작품',
  ],
  WATERCOLOR: [
    '미술관 특별전 초청 작가 인물화 수준으로 변환 중이에요',
    '수채화 물감이 번지는 듯한 부드러운 질감이 적용돼요',
    '\'이 모델 누구예요?\' 질문 받을 초상화',
  ],
  RETRO_90S: [
    '시간을 거스르는 빈티지 필름 감성으로 변환 중이에요',
    '필름 그레인과 특유의 색감으로 90년대 분위기를 연출해요',
    '선배한테 \'너 몇 반이야?\' 들을 비주얼',
  ],
  THREE_D_AVATAR: [
    '픽사 스튜디오 애니메이션 주인공급 입체감으로 변환 중이에요',
    '부드러운 3D 렌더링과 생동감 넘치는 색감이 적용돼요',
    '픽사에서 캐스팅 제의 올 법한 3D 비주얼',
  ],
  BW_CLASSIC: [
    '시대를 관통하는 자서전 표지감의 품격으로 변환 중이에요',
    '강렬한 명암 대비와 고전적인 조명 기법이 적용돼요',
    '자서전 표지에 써도 될 클래식한 한 장',
  ],
}

const DEFAULT_TIPS = [
  'AI가 원본 사진의 특징을 최대한 살려서 생성해요',
  '세로형 3:4 비율로 프로필 사진에 최적화된 비율이에요',
  '생성된 이미지는 고화질 원본으로도 저장할 수 있어요',
]

export default function AiProfileLoadingPage() {
  return (
    <StudioLoadingPage config={{
      gradient: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500',
      steps: [
        { icon: ScanFace, text: '얼굴 특징 분석 중...' },
        { icon: Palette, text: '스타일 적용 중...' },
        { icon: ImagePlus, text: '이미지 생성 중...' },
        { icon: CheckCircle2, text: '마무리 중...' },
      ],
      tips: (params) => {
        const style = params.get('style') as ProfileStyle | null
        return style && STYLE_TIPS[style] ? STYLE_TIPS[style] : DEFAULT_TIPS
      },
      discoveries: [
        '얼굴 비율 분석 완료',
        '최적 조명 각도 파악 중',
        '스타일 요소 매핑 중',
        '세부 특징 반영 중',
      ],
      showFaceScan: true,
      subtitle: 'AI 프로필을 생성하고 있어요',
      estimatedTime: '30-60초',
      progressMode: 'slow',
      pollFn: (id) => aiProfileApi.getStatus(id),
      resultPath: (id) => `/studio/ai-profile/result?id=${id}`,
      entryPath: '/studio/ai-profile',
    }} />
  )
}
