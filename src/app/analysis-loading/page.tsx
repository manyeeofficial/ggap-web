'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'

const POLL_INTERVAL = 2500
const TIP_INTERVAL = 4000

const STEP_LABELS = [
  { range: [0, 25] as [number, number], text: '이미지 업로드 중...' },
  { range: [25, 55] as [number, number], text: '피부 특징 분석 중...' },
  { range: [55, 80] as [number, number], text: '피부 타입 판별 중...' },
  { range: [80, 100] as [number, number], text: '결과 정리 중...' },
]

const TIPS = [
  '클렌징 후 3분 이내에 보습제를 바르면 수분 증발을 막을 수 있어요',
  '자외선 차단제는 실내에서도 매일 바르는 습관이 중요해요',
  '충분한 수면이 피부 재생 호르몬 분비를 도와줘요',
  '하루 2리터 수분 섭취가 피부 탄력 유지의 기본이에요',
  '비타민 C 성분이 피부 콜라겐 합성과 미백에 도움을 줘요',
  '스트레스는 활성산소를 늘려 피부 노화를 가속화해요',
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

function getStep(p: number) {
  return STEP_LABELS.findIndex((s) => p >= s.range[0] && p < s.range[1])
}

export default function AnalysisLoadingPage() {
  const router = useRouter()
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [tipIdx, setTipIdx] = useState(0)
  const apiCalledRef = useRef(false)

  const analysisIdRef = useRef<number | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  useEffect(() => {
    if (!isLoaded) return
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

    const apiCall = member
      ? skinAnalysisApi.analyze(file)
      : skinAnalysisApi.analyzeAnonymous(file)

    apiCall
      .then((result) => {
        analysisIdRef.current = result.id
        if ('token' in result && result.token) {
          sessionStorage.setItem('analysisToken', result.token)
        }
        startPolling(result.id)
      })
      .catch((err) => {
        console.error('Upload error:', err)
        toast.error(err.response?.data?.message || '이미지 업로드에 실패했습니다.')
        router.replace('/camera')
      })
  }, [isLoaded, member, router]) // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => () => stopPolling(), [])

  // 프로그레스 애니메이션
  useEffect(() => {
    if (completed) return
    const MAX = 88
    const startTime = Date.now()
    let extraProgress = 0
    let lastJumpTime = Date.now()
    let nextJumpDelay = 1200 + Math.random() * 1000
    let rafId: number

    const tick = () => {
      const now = Date.now()
      const secs = (now - startTime) / 1000
      if (now - lastJumpTime >= nextJumpDelay) {
        extraProgress = Math.min(extraProgress + 1 + Math.random() * 3, 18)
        lastJumpTime = now
        nextJumpDelay = 1500 + Math.random() * 2000
      }
      const p = Math.min(MAX * (1 - Math.exp(-secs / 10)) + extraProgress, MAX)
      setProgress(p)
      const s = getStep(p)
      if (s >= 0) setStepIdx(s)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [completed])

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length)
    }, TIP_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!completed) return
    setProgress(100)
    setStepIdx(STEP_LABELS.length - 1)
    const timeout = setTimeout(() => {
      const token = sessionStorage.getItem('analysisToken')
      sessionStorage.removeItem('analysisToken')
      const url = token
        ? `/analysis-result?id=${analysisIdRef.current}&token=${token}`
        : `/analysis-result?id=${analysisIdRef.current}`
      router.push(url)
    }, 600)
    return () => clearTimeout(timeout)
  }, [completed, router])

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-600 to-violet-700 flex flex-col">
      {/* 1. 일러스트 + 스캔라인 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-44 h-44">
          <svg width="176" height="176" viewBox="0 0 176 176" fill="none" className="absolute inset-0">
            <ellipse cx="88" cy="88" rx="56" ry="70" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="rgba(255,255,255,0.05)" />
            <ellipse cx="64" cy="74" rx="9" ry="6" fill="rgba(255,255,255,0.18)" />
            <ellipse cx="112" cy="74" rx="9" ry="6" fill="rgba(255,255,255,0.18)" />
            <path d="M88 84 L82 108 L94 108Z" fill="rgba(255,255,255,0.1)" />
            <path d="M68 128 Q88 137 108 128" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M22 46 L22 28 L40 28" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M154 46 L154 28 L136 28" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 130 L22 148 L40 148" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M154 130 L154 148 L136 148" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
      </div>

      {/* 2. 진행 상태 + 3. 팁 */}
      <div className="px-6 pb-12 flex flex-col gap-5">
        {/* 단계 라벨 + 진행바 */}
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-white font-semibold text-lg text-center mb-3"
            >
              {STEP_LABELS[stepIdx].text}
            </motion.p>
          </AnimatePresence>

          <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
          <div className="flex justify-end mt-1.5">
            <p className="text-white/60 text-xs">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* 팁 — 보조 영역 (4초 회전) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
          >
            <p className="text-white/85 text-sm text-center leading-relaxed">💡 {TIPS[tipIdx]}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
