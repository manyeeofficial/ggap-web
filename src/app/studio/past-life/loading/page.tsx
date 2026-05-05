'use client'

import { Clock, Scroll, Sparkles, Wand2 } from 'lucide-react'
import { pastLifeApi } from '@/lib/api'
import type { PastEra } from '@/lib/types'
import { StudioLoadingPage } from '@/app/studio/components/StudioLoadingPage'

const ERA_LABEL: Record<PastEra, string> = {
  THREE_KINGDOMS: '삼국시대',
  GORYEO: '고려시대',
  JOSEON: '조선시대',
  RETRO_60S: '1960년대',
  RETRO_80S: '1980년대',
  ANCIENT_EGYPT: '고대 이집트',
  ANCIENT_GREECE: '고대 그리스',
  ROMAN_EMPIRE: '로마 제국',
  MEDIEVAL_EUROPE: '중세 유럽',
  RENAISSANCE: '르네상스',
  SILK_ROAD: '실크로드',
  OTTOMAN_EMPIRE: '오스만 제국',
  AFRICAN_KINGDOM: '아프리카 왕국',
  VICTORIAN_ERA: '빅토리아 시대',
  JAZZ_AGE: '재즈 시대',
}

export default function PastLifeLoadingPage() {
  return (
    <StudioLoadingPage config={{
      gradient: 'bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900',
      overlay: (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      ),
      steps: [
        { icon: Clock, text: '시간의 흐름을 거슬러 올라가는 중...' },
        { icon: Scroll, text: '전생의 기억을 찾고 있습니다...' },
        { icon: Sparkles, text: 'AI가 전생 이미지를 생성 중...' },
        { icon: Wand2, text: '전생 이야기를 완성하는 중...' },
      ],
      tips: [
        '조선시대는 유교를 국가 이념으로 삼은 500년 역사의 왕조예요',
        '고려시대는 불교 문화가 꽃피고 청자가 발달한 시대예요',
        '삼국시대는 고구려·백제·신라가 경쟁하던 역동적인 시기예요',
        '윤회 사상에서는 현재의 삶이 전생의 업보를 반영한다고 해요',
        '전생 분석은 현재 나의 특성을 새로운 시각으로 볼 기회예요',
      ],
      subtitle: (params) => {
        const era = params.get('era') as PastEra | null
        const label = era && ERA_LABEL[era] ? ERA_LABEL[era] : '전생'
        return `${label}로 떠나는 중...`
      },
      estimatedTime: '20-40초',
      progressMode: 'slow',
      rotateDuration: 3,
      iconColor: 'text-amber-200',
      pollFn: (id) => pastLifeApi.getStatus(id),
      resultPath: (id) => `/studio/past-life/result?id=${id}`,
      entryPath: '/studio/past-life',
    }} />
  )
}
