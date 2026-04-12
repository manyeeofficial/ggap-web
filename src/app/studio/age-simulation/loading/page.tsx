'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Progress } from '@/app/components/ui/progress'
import { ScanFace, Timer, ImagePlus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { ageSimulationApi } from '@/lib/api'
import { Suspense } from 'react'

const POLL_INTERVAL = 2000

const steps = [
  { icon: ScanFace, text: '얼굴 특징 분석 중...' },
  { icon: Timer, text: '나이 변화 계산 중...' },
  { icon: ImagePlus, text: '이미지 생성 중...' },
  { icon: CheckCircle2, text: '마무리 중...' },
]

const tips = [
  '자외선 차단제가 피부 노화 방지의 가장 중요한 단계예요',
  '충분한 수면이 피부 재생 호르몬 분비를 도와줘요',
  '하루 2리터 수분 섭취가 피부 탄력 유지의 기본이에요',
  '스트레스는 활성산소를 늘려 피부 노화를 가속화해요',
  '비타민 C 성분이 피부 콜라겐 합성에 도움을 줘요',
]

function AgeSimulationLoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!id) {
      router.replace('/studio/age-simulation')
      return
    }
    startPolling(id)
    return () => stopPolling()
  }, [id])

  const startPolling = (simId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await ageSimulationApi.getStatus(simId)
        if (status.status === 'COMPLETED') {
          stopPolling()
          setCompleted(true)
        } else if (status.status === 'FAILED') {
          stopPolling()
          toast.error(status.errorMessage || '나이 시뮬레이션에 실패했습니다.')
          router.replace('/studio/age-simulation')
        }
      } catch {
        stopPolling()
        toast.error('생성 상태 확인에 실패했습니다.')
        router.replace('/studio/age-simulation')
      }
    }, POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // 프로그레스 애니메이션 — 느리게
  useEffect(() => {
    if (completed) return
    const MAX = 85
    const startTime = Date.now()
    let extraProgress = 0
    let lastJumpTime = Date.now()
    let nextJumpDelay = 2000 + Math.random() * 2000
    let rafId: number

    const getStep = (p: number) => {
      if (p < 22) return 0
      if (p < 50) return 1
      if (p < 72) return 2
      return 3
    }

    const tick = () => {
      const now = Date.now()
      const secs = (now - startTime) / 1000

      if (now - lastJumpTime >= nextJumpDelay) {
        extraProgress = Math.min(extraProgress + 1 + Math.random() * 2, 15)
        lastJumpTime = now
        nextJumpDelay = 2000 + Math.random() * 3000
      }

      const base = MAX * (1 - Math.exp(-secs / 18))
      const p = Math.min(base + extraProgress, MAX)

      setProgress(p)
      setCurrentStep(getStep(p))
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [completed])

  useEffect(() => {
    if (!completed) return
    setCurrentStep(steps.length - 1)
    setProgress(100)
    const timeout = setTimeout(() => {
      router.push(`/studio/age-simulation/result?id=${id}`)
    }, 600)
    return () => clearTimeout(timeout)
  }, [completed, id, router])

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div key={currentStep} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-12 flex justify-center">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center">
              <CurrentIcon className="w-16 h-16 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-white/30"
            />
          </motion.div>
        </motion.div>

        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-white/30" />
          <p className="text-white text-center mt-3 font-medium">{Math.round(progress)}%</p>
        </div>

        <motion.div key={`text-${currentStep}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-white text-xl font-semibold mb-2">{steps[currentStep].text}</p>
          <p className="text-white/80 text-sm">나이 시뮬레이션 이미지를 생성하고 있어요</p>
        </motion.div>

        <div className="mt-8">
          <p className="text-white/50 text-xs text-center mb-3">예상 소요 시간: 30-60초</p>
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
          >
            <p className="text-white/90 text-xs text-center leading-relaxed">💡 {tips[tipIndex]}</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function AgeSimulationLoadingPage() {
  return (
    <Suspense>
      <AgeSimulationLoadingContent />
    </Suspense>
  )
}
