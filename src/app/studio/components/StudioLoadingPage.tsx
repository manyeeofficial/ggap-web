'use client'

import { useEffect, useRef, useState, Suspense, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Progress } from '@/app/components/ui/progress'
import type { LucideIcon } from 'lucide-react'

export interface StudioLoadingConfig {
  gradient: string
  steps: { icon: LucideIcon; text: string }[]
  tips: string[] | ((params: URLSearchParams) => string[])
  subtitle: string
  estimatedTime: string
  progressMode?: 'fast' | 'slow'  // fast: 10s decay, slow: 18s decay (image gen)
  rotateDuration?: number          // default 2
  pollFn: (id: number) => Promise<{ status: string; errorMessage?: string }>
  resultPath: (id: number) => string
  entryPath: string
  overlay?: ReactNode
  iconColor?: string  // default 'text-white'
}

function StudioLoadingContent({ config }: { config: StudioLoadingConfig }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    gradient, steps, subtitle, estimatedTime,
    progressMode = 'fast', rotateDuration = 2,
    pollFn, resultPath, entryPath,
    overlay, iconColor = 'text-white',
  } = config

  const tips = typeof config.tips === 'function'
    ? config.tips(searchParams as unknown as URLSearchParams)
    : config.tips

  // 팁 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [tips.length])

  // 폴링
  useEffect(() => {
    if (!id) {
      router.replace(entryPath)
      return
    }
    const interval = setInterval(async () => {
      try {
        const res = await pollFn(id)
        if (res.status === 'COMPLETED') {
          clearInterval(interval)
          pollingRef.current = null
          setCompleted(true)
        } else if (res.status === 'FAILED') {
          clearInterval(interval)
          pollingRef.current = null
          const { toast } = await import('sonner')
          toast.error(res.errorMessage || '분석에 실패했습니다.')
          router.replace(entryPath)
        }
      } catch {
        clearInterval(interval)
        pollingRef.current = null
        const { toast } = await import('sonner')
        toast.error('분석 상태 확인에 실패했습니다.')
        router.replace(entryPath)
      }
    }, 2000)
    pollingRef.current = interval
    return () => clearInterval(interval)
  }, [id])

  // 프로그레스 애니메이션
  useEffect(() => {
    if (completed) return
    const isSlow = progressMode === 'slow'
    const MAX = isSlow ? 85 : 88
    const decay = isSlow ? 18 : 10
    const jumpBaseDelay = isSlow ? 2000 : 1200
    const jumpDelayRange = isSlow ? 2000 : 1000
    const jumpExtraMax = isSlow ? 15 : 18
    const jumpExtraRandom = isSlow ? 2 : 3

    const startTime = Date.now()
    let extraProgress = 0
    let lastJumpTime = Date.now()
    let nextJumpDelay = jumpBaseDelay + Math.random() * jumpDelayRange
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
        extraProgress = Math.min(extraProgress + 1 + Math.random() * jumpExtraRandom, jumpExtraMax)
        lastJumpTime = now
        nextJumpDelay = (isSlow ? 2000 : 1500) + Math.random() * (isSlow ? 3000 : 2000)
      }
      const base = MAX * (1 - Math.exp(-secs / decay))
      const p = Math.min(base + extraProgress, MAX)
      setProgress(p)
      setCurrentStep(getStep(p))
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [completed, progressMode])

  // 완료 처리
  useEffect(() => {
    if (!completed) return
    setCurrentStep(steps.length - 1)
    setProgress(100)
    const timeout = setTimeout(() => {
      router.push(resultPath(id))
    }, 600)
    return () => clearTimeout(timeout)
  }, [completed, id])

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className={`fixed inset-0 ${gradient} flex items-center justify-center p-6`}>
      {overlay}
      <div className="max-w-md w-full relative">
        <motion.div key={currentStep} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-12 flex justify-center">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: rotateDuration, repeat: Infinity, ease: 'linear' }} className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center">
              <CurrentIcon className={`w-16 h-16 ${iconColor}`} />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: rotateDuration, repeat: Infinity }}
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
          <p className="text-white/80 text-sm">{subtitle}</p>
        </motion.div>

        <div className="mt-8">
          <p className="text-white/50 text-xs text-center mb-3">예상 소요 시간: {estimatedTime}</p>
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

export function StudioLoadingPage({ config }: { config: StudioLoadingConfig }) {
  return (
    <Suspense>
      <StudioLoadingContent config={config} />
    </Suspense>
  )
}
