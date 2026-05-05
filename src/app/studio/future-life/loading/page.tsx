'use client'

import { Rocket, Cpu, Globe, Zap } from 'lucide-react'
import { futureLifeApi } from '@/lib/api'
import { StudioLoadingPage } from '@/app/studio/components/StudioLoadingPage'

export default function FutureLifeLoadingPage() {
  return (
    <StudioLoadingPage config={{
      gradient: 'bg-gradient-to-br from-violet-950 via-cyan-950 to-slate-900',
      overlay: (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      ),
      steps: [
        { icon: Rocket, text: '미래를 향해 발사 중...' },
        { icon: Cpu, text: 'AI가 미래 데이터를 분석 중...' },
        { icon: Globe, text: '미래 이미지를 생성하고 있습니다...' },
        { icon: Zap, text: '미래의 당신을 완성하는 중...' },
      ],
      tips: [
        '불교에서는 현재의 업보가 다음 생의 형태를 결정한다고 해요',
        '인간으로 태어나는 것은 수많은 생명 중에서도 귀한 인연이에요',
        '동물로 태어난다면 어떤 동물이 되고 싶으신가요?',
        '미래 존재의 형태는 지금의 삶의 방식이 반영될 수 있어요',
        '후생 분석은 현재 나를 돌아보는 재미있는 여정이에요',
      ],
      subtitle: '다음 생의 존재를 탐색하는 중...',
      estimatedTime: '20-40초',
      progressMode: 'slow',
      iconColor: 'text-cyan-300',
      pollFn: (id) => futureLifeApi.getStatus(id),
      resultPath: (id) => `/studio/future-life/result?id=${id}`,
      entryPath: '/studio/future-life',
    }} />
  )
}
