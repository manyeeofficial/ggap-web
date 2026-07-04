'use client'

import { useEffect, useRef, useState, Suspense, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

export interface StudioLoadingConfig {
  gradient: string
  steps: { icon: LucideIcon; text: string }[]
  tips: string[] | ((params: URLSearchParams) => string[])
  subtitle: string | ((params: URLSearchParams) => string)
  estimatedTime: string
  progressMode?: 'fast' | 'slow'
  rotateDuration?: number
  pollFn: (id: number) => Promise<{ status: string; errorMessage?: string }>
  /** id: 분석 ID, token: 비회원 토큰(선택). router.replace 로 결과 페이지로 이동함. */
  resultPath: (id: number, token?: string) => string
  entryPath: string
  overlay?: ReactNode
  iconColor?: string
  showFaceScan?: boolean
  discoveries?: string[]
  /**
   * URL ?id= 파라미터 없이 직접 API를 호출해 ID를 획득하는 경우 사용.
   * (예: 피부 분석 — 이미지 업로드 후 ID를 받아야 함)
   * 에러 발생 시 initFn 내부에서 toast + router.replace 처리 후 throw.
   */
  initFn?: () => Promise<{ id: number; token?: string }>
  /** 폴링 간격(ms). 기본값 2000. */
  pollInterval?: number
}

function FaceScanVisual() {
  return (
    <div className="relative w-44 h-44">
      <svg width="176" height="176" viewBox="0 0 176 176" fill="none" className="absolute inset-0">
        {/* 얼굴 윤곽 */}
        <ellipse cx="88" cy="88" rx="56" ry="70" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="rgba(255,255,255,0.05)" />
        {/* 눈 */}
        <ellipse cx="64" cy="74" rx="9" ry="6" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="112" cy="74" rx="9" ry="6" fill="rgba(255,255,255,0.18)" />
        {/* 코 */}
        <path d="M88 84 L82 108 L94 108Z" fill="rgba(255,255,255,0.1)" />
        {/* 입 */}
        <path d="M68 128 Q88 137 108 128" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 코너 브라켓 */}
        <path d="M22 46 L22 28 L40 28" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M154 46 L154 28 L136 28" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 130 L22 148 L40 148" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M154 130 L154 148 L136 148" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* 스캔라인 */}
      <motion.div
        className="absolute left-8 right-8 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
        }}
        animate={{ top: ['16%', '84%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
      />
    </div>
  )
}

function DiscoveryCard({ discoveries }: { discoveries: string[] }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % discoveries.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [discoveries.length])

  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-white/65 text-xs">방금 발견했어요</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-white font-medium text-base"
        >
          {discoveries[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function StudioLoadingContent({ config }: { config: StudioLoadingConfig }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    gradient, steps, estimatedTime,
    progressMode = 'fast', rotateDuration = 2,
    pollFn, resultPath, entryPath,
    overlay, iconColor = 'text-white',
    showFaceScan, discoveries,
    pollInterval = 2000,
  } = config

  const tips = typeof config.tips === 'function'
    ? config.tips(searchParams as unknown as URLSearchParams)
    : config.tips

  const subtitle = typeof config.subtitle === 'function'
    ? config.subtitle(searchParams as unknown as URLSearchParams)
    : config.subtitle

  // initFn 모드: ID가 URL에 없고, API 호출로 획득
  // URL 모드: ?id= 파라미터로 ID 획득
  const urlId = config.initFn ? 0 : Number(searchParams.get('id'))
  const [resolvedId, setResolvedId] = useState(urlId)
  const [resolvedToken, setResolvedToken] = useState<string | undefined>(undefined)
  const initCalledRef = useRef(false)

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 팁 회전
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [tips.length])

  // initFn 모드: 마운트 시 1회 API 호출로 ID 획득
  useEffect(() => {
    if (!config.initFn || initCalledRef.current) return
    initCalledRef.current = true
    let mounted = true
    config.initFn()
      .then(({ id, token }) => {
        if (!mounted) return
        setResolvedId(id)
        if (token !== undefined) setResolvedToken(token)
      })
      .catch(() => {
        // initFn 내부에서 이미 toast + router.replace 처리
      })
    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // URL 모드: ID 유효성 검사
  useEffect(() => {
    if (config.initFn) return
    if (!urlId) router.replace(entryPath)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 폴링 (resolvedId가 설정된 후 시작)
  useEffect(() => {
    if (!resolvedId) return
    const interval = setInterval(async () => {
      try {
        const res = await pollFn(resolvedId)
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
    }, pollInterval)
    pollingRef.current = interval
    return () => clearInterval(interval)
  }, [resolvedId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 프로그레스 애니메이션 (완료 전까지 지속)
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

  // 완료: 결과 페이지로 이동 (router.replace — 로딩 페이지를 히스토리에서 제거)
  useEffect(() => {
    if (!completed || !resolvedId) return
    setCurrentStep(steps.length - 1)
    setProgress(100)
    const timeout = setTimeout(() => {
      router.replace(resultPath(resolvedId, resolvedToken))
    }, 600)
    return () => clearTimeout(timeout)
  }, [completed]) // eslint-disable-line react-hooks/exhaustive-deps

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className={`fixed inset-0 ${gradient} flex flex-col`}>
      {overlay}

      {/* 비주얼 */}
      <div className="flex-1 flex items-center justify-center">
        {showFaceScan ? (
          <FaceScanVisual />
        ) : (
          <motion.div
            key={currentStep}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: rotateDuration, repeat: Infinity, ease: 'linear' }}
              className="relative"
            >
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
        )}
      </div>

      {/* 하단 정보 */}
      <div className="px-6 pb-12 flex flex-col gap-3">
        {/* 단계 라벨 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <p className="text-white font-semibold text-lg">{steps[currentStep].text}</p>
            <p className="text-white/60 text-sm mt-0.5">{subtitle}</p>
          </motion.div>
        </AnimatePresence>

        {/* 진행바 */}
        <div>
          <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <p className="text-white/40 text-xs">{estimatedTime}</p>
            <p className="text-white/60 text-xs">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* 발견 카드 */}
        {discoveries && discoveries.length > 0 && (
          <DiscoveryCard discoveries={discoveries} />
        )}

        {/* 팁 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
          >
            <p className="text-white/85 text-sm text-center leading-relaxed">💡 {tips[tipIndex]}</p>
          </motion.div>
        </AnimatePresence>
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
