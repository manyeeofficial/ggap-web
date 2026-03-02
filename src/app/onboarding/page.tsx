'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/app/components/ui/button'
import { Sparkles, ChevronRight, Camera, TrendingUp } from 'lucide-react'
import Image from 'next/image'

const slides = [
  {
    icon: <Sparkles className="w-20 h-20" />,
    title: 'AI가 분석하는\n내 얼굴값',
    description: 'AI 기반으로 정확하게 분석합니다',
    color: 'from-purple-400 to-pink-400',
  },
  {
    icon: <Camera className="w-20 h-20" />,
    title: '딱 맞는 제품 추천',
    description: '당신의 피부에 꼭 맞는 솔루션을 제공합니다',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    icon: <TrendingUp className="w-20 h-20" />,
    title: '시간에 따른\n얼굴값 변화 추적',
    description: '피부 개선 과정을 한눈에 확인하세요',
    color: 'from-green-400 to-emerald-400',
  },
]

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-6 flex justify-end">
        <Button variant="ghost" onClick={() => router.push('/login')} className="text-gray-500">
          건너뛰기
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center w-full max-w-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`w-40 h-40 mx-auto mb-12 rounded-3xl bg-gradient-to-br ${slides[currentSlide].color} flex items-center justify-center text-white shadow-2xl`}
            >
              {slides[currentSlide].icon}
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4 whitespace-pre-line">
              {slides[currentSlide].title}
            </h2>
            <p className="text-gray-600 text-lg">{slides[currentSlide].description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        <Button onClick={handleNext} className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700">
          {currentSlide === slides.length - 1 ? '시작하기' : '다음'}
          <ChevronRight className="ml-2" />
        </Button>
      </div>
    </div>
  )
}
