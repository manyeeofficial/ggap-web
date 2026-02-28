'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Progress } from '@/app/components/ui/progress'
import { Upload, ScanFace, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { skinAnalysisApi } from '@/lib/api'

const POLL_INTERVAL = 2500

const steps = [
  { icon: Upload, text: '이미지 업로드 중...', duration: 20 },
  { icon: ScanFace, text: '피부 타입 분석 중...', duration: 30 },
  { icon: Sparkles, text: '문제점 감지 중...', duration: 25 },
  { icon: CheckCircle2, text: '맞춤 솔루션 추천 중...', duration: 25 },
]

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mime })
}

export default function AnalysisLoadingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const apiCalledRef = useRef(false)
  const analysisIdRef = useRef<number | null>(null)
  const [completed, setCompleted] = useState(false)

  // 1. 이미지 업로드 → PENDING 상태로 즉시 반환 → long polling 시작
  useEffect(() => {
    if (apiCalledRef.current) return
    apiCalledRef.current = true

    const imageData = sessionStorage.getItem('capturedImage')
    if (!imageData) {
      toast.error('촬영된 이미지가 없습니다.')
      router.replace('/camera')
      return
    }

    const file = dataUrlToFile(imageData, 'skin-analysis.jpg')
    sessionStorage.removeItem('capturedImage')

    skinAnalysisApi
      .analyze(file)
      .then((result) => {
        analysisIdRef.current = result.id
        startPolling(result.id)
      })
      .catch((err) => {
        console.error('Upload error:', err)
        toast.error(err.response?.data?.message || '이미지 업로드에 실패했습니다.')
        router.replace('/camera')
      })
  }, [router])

  // 2. Long polling: 2.5초마다 상태 조회
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startPolling = (id: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await skinAnalysisApi.getStatus(id)

        if (status.status === 'COMPLETED') {
          stopPolling()
          setCompleted(true)
        } else if (status.status === 'FAILED') {
          stopPolling()
          toast.error(status.errorMessage || '피부 분석에 실패했습니다.')
          router.replace('/camera')
        }
        // PENDING, PROCESSING → 계속 대기
      } catch (err) {
        console.error('Polling error:', err)
        stopPolling()
        toast.error('분석 상태 확인에 실패했습니다.')
        router.replace('/camera')
      }
    }, POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  // 3. 프로그레스 애니메이션 - 지수 감쇠 커브 + 랜덤 점프로 다이나믹하게
  useEffect(() => {
    if (completed) return

    // progress 구간별 step 인덱스
    const getStep = (p: number) => {
      if (p < 22) return 0
      if (p < 50) return 1
      if (p < 72) return 2
      return 3
    }

    const MAX = 88
    const startTime = Date.now()
    let extraProgress = 0
    let lastJumpTime = Date.now()
    let nextJumpDelay = 1200 + Math.random() * 1000
    let rafId: number

    const tick = () => {
      const now = Date.now()
      const secs = (now - startTime) / 1000

      // 1.5~3.5초마다 1~4% 랜덤 점프 (작업이 진행되는 느낌)
      if (now - lastJumpTime >= nextJumpDelay) {
        extraProgress = Math.min(extraProgress + 1 + Math.random() * 3, 18)
        lastJumpTime = now
        nextJumpDelay = 1500 + Math.random() * 2000
      }

      // 지수 감쇠 기반 베이스: 빠르게 시작 → 점점 감속 → MAX에 점근
      // t=5s≈39%, t=10s≈63%, t=15s≈78%, t=20s≈86%, 절대 MAX에 도달 안 함
      const base = MAX * (1 - Math.exp(-secs / 10))
      const p = Math.min(base + extraProgress, MAX)

      setProgress(p)
      setCurrentStep(getStep(p))

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [completed])

  // 4. COMPLETED 시 100% → 결과 페이지 이동
  useEffect(() => {
    if (!completed) return

    setCurrentStep(steps.length - 1)
    setProgress(100)

    const timeout = setTimeout(() => {
      router.push(`/analysis-result?id=${analysisIdRef.current}`)
    }, 600)

    return () => clearTimeout(timeout)
  }, [completed, router])

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div key={currentStep} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-12 flex justify-center">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center">
              <CurrentIcon className="w-16 h-16 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
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
          <p className="text-white/80 text-sm">잠시만 기다려주세요</p>
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-white/60 text-xs">예상 소요 시간: 10-30초</p>
        </div>
      </div>
    </div>
  )
}
