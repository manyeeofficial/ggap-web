'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface LegalHeaderProps {
  title: string
}

export default function LegalHeader({ title }: LegalHeaderProps) {
  const router = useRouter()
  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="p-2 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="w-10" />
      </div>
    </div>
  )
}
