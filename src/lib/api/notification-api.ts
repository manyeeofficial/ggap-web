import { axiosInstance } from './client'
import type { NotificationSetting } from '@/lib/types'

export const notificationApi = {
  // 알림 설정 조회
  async get(): Promise<NotificationSetting> {
    const response = await axiosInstance.get<NotificationSetting>('/notification-settings')
    return response.data
  },

  // 알림 설정 생성/수정
  async upsert(data: NotificationSetting): Promise<NotificationSetting> {
    const response = await axiosInstance.put<NotificationSetting>('/notification-settings', data)
    return response.data
  },
}
