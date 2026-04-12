import { axiosInstance } from './client'
import type { AiProfile, AiProfileStatus } from '@/lib/types'

export const aiProfileApi = {
  async getStatus(id: number): Promise<AiProfileStatus> {
    const r = await axiosInstance.get<AiProfileStatus>(`/ai-profile/${id}/status`)
    return r.data
  },
  async create(params: { skinAnalysisId?: number; image?: File; style: string }): Promise<AiProfile> {
    const formData = new FormData()
    formData.append('style', params.style)
    if (params.skinAnalysisId) formData.append('skinAnalysisId', String(params.skinAnalysisId))
    if (params.image) formData.append('image', params.image)
    const r = await axiosInstance.post<AiProfile>('/ai-profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return r.data
  },
  async getById(id: number): Promise<AiProfile> {
    const r = await axiosInstance.get<AiProfile>(`/ai-profile/${id}`)
    return r.data
  },
  async getList(): Promise<AiProfile[]> {
    const r = await axiosInstance.get<AiProfile[]>('/ai-profile')
    return r.data
  },
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/ai-profile/${id}`)
  },
}
