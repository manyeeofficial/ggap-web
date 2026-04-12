'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Progress } from '@/app/components/ui/progress'
import { Scroll, Sparkles, Clock, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { pastLifeApi } from '@/lib/api'
import type { PastEra } from '@/lib/types'
import { Suspense } from 'react'

const POLL_INTERVAL = 2000

const ERA_LABEL: Record<PastEra, string> = {
  THREE_KINGDOMS: '삼국시대',
  GORYEO: '고려시대',
  JOSEON: '조선시대',
  RETRO_60S: '1960년대',
  RETRO_80S: '1980년대',
}

const steps = [
  { icon: Clock, text: '시간의 흐름을 거슬러 올라가는 중...' },
  { icon: Scroll, text: '전생의 기억을 찾고 있습니다...' },
  { icon: Sparkles, text: 'AI가 전생 이미지를 생성 중...' },
  { icon: Wand2, text: '전생 이야기를 완성하는 중...' },
]

function PastLifeLoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const eraParam = searchParams.get('era') as PastEra | null
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) {
      router.replace('/playground/past-life')
      return
    }
    startPolling(id)
    return () => stopPolling()
  }, [id])

  const startPolling = (pastLifeId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await pastLifeApi.getStatus(pastLifeId)
        if (status.status === 'COMPLETED') {
          stopPolling()
          setCompleted(true)
        } else if (status.status === 'FAILED') {
          stopPolling()
          toast.error(status.errorMessage || '전생 이미지 생성에 실패했습니다.')
          router.replace('/playground/past-life')
        }
      } catch {
        stopPolling()
        toast.error('분석 상태 확인에 실패했습니다.')
        router.replace('/playground/past-life')
      }
    }, POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // 프로그레스 애니메이션
  useEffect(() => {
    if (completed) return
    const MAX = 88
    const startTime = Date.now()
    let extraProgress = 0
    let lastJumpTime = Date.now()
    let nextJumpDelay = 1200 + Math.random() * 1000
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
        extraProgress = Math.min(extraProgress + 1 + Math.random() * 3, 18)
        lastJumpTime = now
        nextJumpDelay = 1500 + Math.random() * 2000
      }

      const base = MAX * (1 - Math.exp(-secs / 10))
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
      router.push(`/playground/past-life/result?id=${id}`)
    }, 600)
    return () => clearTimeout(timeout)
  }, [completed, id, router])

  const CurrentIcon = steps[currentStep].icon
  const eraLabel = eraParam ? ERA_LABEL[eraParam] : '전생'

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 flex items-center justify-center p-6">
      {/* 한지 느낌 오버레이 */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="max-w-md w-full relative">
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-12 flex justify-center"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center">
              <CurrentIcon className="w-16 h-16 text-amber-200" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-amber-400/30"
            />
          </motion.div>
        </motion.div>

        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-white/30" />
          <p className="text-amber-200 text-center mt-3 font-medium">{Math.round(progress)}%</p>
        </div>

        <motion.div
          key={`text-${currentStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white text-xl font-semibold mb-2">
            AI가 당신의 전생을 찾고 있습니다...
          </p>
          <p className="text-amber-300/90 text-sm">{eraLabel}로 떠나는 중...</p>
        </motion.div>

        <div className="mt-6 text-center">
          <p className="text-amber-200/70 text-sm font-medium">{steps[currentStep].text}</p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-amber-200/50 text-xs">예상 소요 시간: 20-40초</p>
        </div>
      </div>
    </div>
  )
}

export default function PastLifeLoadingPage() {
  return (
    <Suspense>
      <PastLifeLoadingContent />
    </Suspense>
  )
}
