'use client'

import type { Metadata } from 'next'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import Image from 'next/image'
import logo from '@/assets/logo/logo2.png'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding')
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center flex flex-col items-center"
      >
        <h1 className="text-5xl font-bold text-white mb-3">
          <Image src={logo} alt="로고" height={100} className="invert" />
        </h1>
        <p className="text-white/100 text-2xl">
          당신의 진짜 얼굴값을<br/>확인하는 시간
        </p>
      </motion.div>
    </div>
  )
}
