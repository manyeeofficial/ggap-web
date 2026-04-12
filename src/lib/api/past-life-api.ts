import { axiosInstance } from './client'
import type { PastLife, PastLifeStatusResponse, PastEra } from '@/lib/types'

export const pastLifeApi = {
  async create(params: { era: PastEra; skinAnalysisId?: number; image?: File }): Promise<PastLife> {
    const formData = new FormData()
    formData.append('era', params.era)
    if (params.skinAnalysisId != null) {
      formData.append('skinAnalysisId', String(params.skinAnalysisId))
    }
    if (params.image) {
      formData.append('image', params.image)
    }
    const response = await axiosInstance.post<PastLife>('/past-life', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getStatus(id: number): Promise<PastLifeStatusResponse> {
    const response = await axiosInstance.get<PastLifeStatusResponse>(`/past-life/${id}/status`)
    return response.data
  },

  async getById(id: number): Promise<PastLife> {
    const response = await axiosInstance.get<PastLife>(`/past-life/${id}`)
    return response.data
  },

  async getList(): Promise<PastLife[]> {
    const response = await axiosInstance.get<PastLife[]>('/past-life')
    return response.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/past-life/${id}`)
  },
}
