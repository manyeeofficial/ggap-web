'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'

const POLL_INTERVAL = 2500
const FEATURE_INTERVAL = 3500

const features = [
  { emoji: '🔮', name: '관상보기', desc: '얼굴로 알아보는 나의 운명과 성격', color: 'from-violet-500 to-purple-600' },
  { emoji: '🐯', name: '동물상', desc: '나를 닮은 동물이 뭔지 알아봐요', color: 'from-amber-500 to-orange-600' },
  { emoji: '🧬', name: 'MBTI 매칭', desc: '얼굴에서 읽는 나의 MBTI 유형', color: 'from-cyan-500 to-blue-600' },
  { emoji: '📸', name: 'AI 프로필', desc: '10가지 스타일의 AI 프로필 사진', color: 'from-rose-500 to-pink-600' },
  { emoji: '⏳', name: '나이 시뮬레이션', desc: '10년 후, 20년 후 내 얼굴은?', color: 'from-emerald-500 to-teal-600' },
  { emoji: '✨', name: '전생 / 후생', desc: '나는 전생에 누구였을까?', color: 'from-indigo-500 to-violet-600' },
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
  const { member, isLoaded, fetchMember } = useMemberStore()
  const [progress, setProgress] = useState(0)
  const [featureIdx, setFeatureIdx] = useState(0)
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
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [completed])

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIdx((i) => (i + 1) % features.length)
    }, FEATURE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!completed) return
    setProgress(100)
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

  const feature = features[featureIdx]

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-between px-6 pt-16 pb-12">
      {/* 상단: 진행 바 */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white/50 text-xs">피부 분석 중...</p>
          <p className="text-white/40 text-xs">{Math.round(progress)}%</p>
        </div>
        <div className="w-full bg-white/10 rounded-full h-0.5">
          <motion.div
            className="h-0.5 rounded-full bg-white"
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      </div>

      {/* 중단: 기능 홍보 카드 */}
      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center gap-5">
        <p className="text-white/30 text-xs uppercase tracking-widest">이런 기능도 있어요</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={featureIdx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className={`rounded-2xl bg-gradient-to-br ${feature.color} p-7`}>
              <div className="text-5xl mb-5">{feature.emoji}</div>
              <p className="text-white text-xl font-bold mb-1.5">{feature.name}</p>
              <p className="text-white/75 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 도트 인디케이터 */}
        <div className="flex gap-1.5">
          {features.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === featureIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 하단 */}
      <p className="text-white/20 text-xs">분석 완료 시 자동으로 이동합니다</p>
    </div>
  )
}
