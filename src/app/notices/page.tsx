'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pin, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { toast } from 'sonner'
import { noticeApi } from '@/lib/api'
import { UnauthenticatedError } from '@/lib/api/client'
import type { Notice } from '@/lib/types'

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

function formatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function NoticesPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await noticeApi.list()
        setNotices(data)
      } catch (err) {
        if (err instanceof UnauthenticatedError) return
        toast.error('공지사항을 불러오는데 실패했습니다.')
      } finally {
        setIsLoaded(true)
      }
    }
    fetchNotices()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="relative flex items-center justify-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">공지사항</h1>
        </div>
      </div>

      {!isLoaded ? (
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-sm text-gray-400">공지사항이 없습니다.</p>
        </div>
      ) : (
        <div>
          {notices.map((notice) => (
            <button
              key={notice.id}
              className="w-full px-5 py-4 flex items-start gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 text-left"
              onClick={() => router.push(`/notices/${notice.id}`)}
            >
              {notice.isPinned && (
                <Pin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{notice.title}</h3>
                  {isNew(notice.createdAt) && (
                    <span className="flex-shrink-0 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      N
                    </span>
                  )}
                </div>
                {notice.content && (
                  <p className="text-sm text-gray-500 line-clamp-1 mb-1">{notice.content}</p>
                )}
                <p className="text-xs text-gray-400">{formatDate(notice.createdAt)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
