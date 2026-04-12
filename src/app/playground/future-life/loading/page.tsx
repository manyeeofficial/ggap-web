'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Progress } from '@/app/components/ui/progress'
import { Rocket, Cpu, Globe, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { futureLifeApi } from '@/lib/api'
import { Suspense } from 'react'

const POLL_INTERVAL = 2000

const steps = [
  { icon: Rocket, text: '미래를 향해 발사 중...' },
  { icon: Cpu, text: 'AI가 미래 데이터를 분석 중...' },
  { icon: Globe, text: '미래 이미지를 생성하고 있습니다...' },
  { icon: Zap, text: '미래의 당신을 완성하는 중...' },
]

function FutureLifeLoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) {
      router.replace('/playground/future-life')
      return
    }
    startPolling(id)
    return () => stopPolling()
  }, [id])

  const startPolling = (futureLifeId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await futureLifeApi.getStatus(futureLifeId)
        if (status.status === 'COMPLETED') {
          stopPolling()
          setCompleted(true)
        } else if (status.status === 'FAILED') {
          stopPolling()
          toast.error(status.errorMessage || '후생 이미지 생성에 실패했습니다.')
          router.replace('/playground/future-life')
        }
      } catch {
        stopPolling()
        toast.error('분석 상태 확인에 실패했습니다.')
        router.replace('/playground/future-life')
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
      router.push(`/playground/future-life/result?id=${id}`)
    }, 600)
    return () => clearTimeout(timeout)
  }, [completed, id, router])

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-cyan-950 to-slate-900 flex items-center justify-center p-6">
      {/* 사이버펑크 격자 오버레이 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-md w-full relative">
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-12 flex justify-center"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-full bg-cyan-500/20 backdrop-blur-lg flex items-center justify-center border border-cyan-500/30">
              <CurrentIcon className="w-16 h-16 text-cyan-300" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-400/20"
            />
          </motion.div>
        </motion.div>

        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-white/20" />
          <p className="text-cyan-300 text-center mt-3 font-medium">{Math.round(progress)}%</p>
        </div>

        <motion.div
          key={`text-${currentStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white text-xl font-semibold mb-2">
            AI가 미래의 당신을 그리고 있습니다...
          </p>
          <p className="text-cyan-300/90 text-sm">다음 생의 존재를 탐색하는 중...</p>
        </motion.div>

        <div className="mt-6 text-center">
          <p className="text-cyan-200/70 text-sm font-medium">{steps[currentStep].text}</p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-cyan-200/50 text-xs">예상 소요 시간: 20-40초</p>
        </div>
      </div>
    </div>
  )
}

export default function FutureLifeLoadingPage() {
  return (
    <Suspense>
      <FutureLifeLoadingContent />
    </Suspense>
  )
}
