'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card } from '@/app/components/ui/card'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b p-6">
          <button onClick={() => router.push('/login')} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일을 확인하세요</h2>
            <p className="text-gray-600 mb-6">
              <strong>{email}</strong>로<br />비밀번호 재설정 링크를 보냈습니다.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">💡 <strong>메일을 받지 못하셨나요?</strong></p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>스팸 메일함을 확인해주세요</li>
                <li>이메일 주소를 정확히 입력했는지 확인해주세요</li>
                <li>5분 후에도 받지 못했다면 다시 시도해주세요</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Button onClick={() => router.push('/login')} className="w-full bg-indigo-600 hover:bg-indigo-700">
                로그인으로 돌아가기
              </Button>
              <Button variant="outline" onClick={() => setIsSubmitted(false)} className="w-full">
                다시 보내기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b p-6">
        <button onClick={() => router.push('/login')} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 찾기</h1>
            <p className="text-gray-600">
              가입하신 이메일 주소를 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="face@ggap.ai"
                className="mt-2 h-12"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" disabled={!email}>
              재설정 링크 보내기
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
