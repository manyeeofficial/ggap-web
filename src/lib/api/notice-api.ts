import { axiosInstance } from './client'
import type { Notice } from '@/lib/types'

export const noticeApi = {
  async list(): Promise<Notice[]> {
    const response = await axiosInstance.get<Notice[]>('/notices')
    return response.data
  },

  async detail(id: number): Promise<Notice> {
    const response = await axiosInstance.get<Notice>(`/notices/${id}`)
    return response.data
  },
}
