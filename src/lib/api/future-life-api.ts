import { axiosInstance } from './client'
import type { FutureLife, FutureLifeStatusResponse } from '@/lib/types'

export const futureLifeApi = {
  async create(params: { skinAnalysisId?: number; image?: File }): Promise<FutureLife> {
    const formData = new FormData()
    if (params.skinAnalysisId != null) {
      formData.append('skinAnalysisId', String(params.skinAnalysisId))
    }
    if (params.image) {
      formData.append('image', params.image)
    }
    const response = await axiosInstance.post<FutureLife>('/future-life', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getStatus(id: number): Promise<FutureLifeStatusResponse> {
    const response = await axiosInstance.get<FutureLifeStatusResponse>(`/future-life/${id}/status`)
    return response.data
  },

  async getById(id: number): Promise<FutureLife> {
    const response = await axiosInstance.get<FutureLife>(`/future-life/${id}`)
    return response.data
  },

  async getList(): Promise<FutureLife[]> {
    const response = await axiosInstance.get<FutureLife[]>('/future-life')
    return response.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/future-life/${id}`)
  },
}
