'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/app/components/ui/card'
import { Switch } from '@/app/components/ui/switch'
import { Label } from '@/app/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { notificationApi } from '@/lib/api'
import type { NotificationSetting } from '@/lib/types'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationSetting>({
    analysisEnabled: true,
    recommendationEnabled: true,
    promotionEnabled: false,
    updateEnabled: true,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await notificationApi.get()
        setNotifications(data)
      } catch {
        toast.error('알림 설정을 불러오는데 실패했습니다.')
      } finally {
        setIsLoaded(true)
      }
    }
    fetchSettings()
  }, [])

  const handleToggle = async (key: keyof NotificationSetting) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key]
    }
    setNotifications(updated)

    try {
      await notificationApi.upsert(updated)
    } catch {
      setNotifications(notifications)
      toast.error('알림 설정 저장에 실패했습니다.')
    }
  }

  if (!isLoaded) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">알림 설정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card className="divide-y">
          <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="analysis-notif" className="font-medium text-gray-900">
                분석 완료 알림
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                얼굴 분석이 완료되면 알림을 받습니다
              </p>
            </div>
            <Switch
              id="analysis-notif"
              checked={notifications.analysisEnabled}
              onCheckedChange={() => handleToggle('analysisEnabled')}
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="recommendation-notif" className="font-medium text-gray-900">
                추천 제품 알림
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                새로운 추천 제품이 있을 때 알림을 받습니다
              </p>
            </div>
            <Switch
              id="recommendation-notif"
              checked={notifications.recommendationEnabled}
              onCheckedChange={() => handleToggle('recommendationEnabled')}
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="promotion-notif" className="font-medium text-gray-900">
                프로모션 알림
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                할인 및 이벤트 소식을 받습니다
              </p>
            </div>
            <Switch
              id="promotion-notif"
              checked={notifications.promotionEnabled}
              onCheckedChange={() => handleToggle('promotionEnabled')}
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="update-notif" className="font-medium text-gray-900">
                앱 업데이트 알림
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                새로운 기능 및 업데이트 소식을 받습니다
              </p>
            </div>
            <Switch
              id="update-notif"
              checked={notifications.updateEnabled}
              onCheckedChange={() => handleToggle('updateEnabled')}
            />
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-700">
            💡 <strong>알림 권한:</strong> 기기 설정에서 ㅇㄱㄱ의 알림 권한이 허용되어 있는지 확인하세요.
          </p>
        </Card>
      </div>
    </div>
  )
}
