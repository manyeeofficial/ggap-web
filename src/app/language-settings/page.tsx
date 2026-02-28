'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/app/components/ui/card'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const languages = [
  { code: 'ko', name: '한국어', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
]

export default function LanguageSettingsPage() {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState('ko')

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code)
    setTimeout(() => {
      router.back()
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">언어 설정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-6">
        <Card className="divide-y">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900">{language.nativeName}</p>
                <p className="text-sm text-gray-500">{language.name}</p>
              </div>

              {selectedLanguage === language.code && (
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          ))}
        </Card>
      </div>
    </div>
  )
}
