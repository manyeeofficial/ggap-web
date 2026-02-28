'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Card } from '@/app/components/ui/card'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/api'

const categories = [
  '분석 관련',
  '구독 및 결제',
  '계정 관리',
  '추천 제품',
  '기술적 문제',
  '기타',
]

const previousInquiries = [
  {
    id: 1,
    title: '분석 결과가 이상해요',
    category: '분석 관련',
    date: '2026-02-05',
    status: '답변 완료',
  },
]

export default function ContactPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await axiosInstance.post('/email/send', { category, title, content })

      toast.success('문의가 성공적으로 접수되었습니다.')
      setTitle('')
      setCategory('')
      setContent('')
    } catch {
      toast.error('문의 접수에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">1:1 문의</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* New Inquiry Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">새 문의 작성</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
                placeholder="문의 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full h-10 px-3 border rounded-md"
                required
              >
                <option value="">선택하세요</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2 min-h-[150px]"
                placeholder="문의 내용을 상세히 입력해주세요 (최대 500자)"
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{content.length}/500</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? '전송 중...' : '문의하기'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
