import { axiosInstance } from './client'
import type { FaceReading, FaceReadingStatusResponse } from '@/lib/types'

export const faceReadingApi = {
  async create(params: { skinAnalysisId?: number; image?: File }): Promise<FaceReading> {
    const formData = new FormData()
    if (params.skinAnalysisId != null) {
      formData.append('skinAnalysisId', String(params.skinAnalysisId))
    }
    if (params.image) {
      formData.append('image', params.image)
    }
    const response = await axiosInstance.post<FaceReading>('/face-reading', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getStatus(id: number): Promise<FaceReadingStatusResponse> {
    const response = await axiosInstance.get<FaceReadingStatusResponse>(`/face-reading/${id}/status`)
    return response.data
  },

  async getById(id: number): Promise<FaceReading> {
    const response = await axiosInstance.get<FaceReading>(`/face-reading/${id}`)
    return response.data
  },

  async getList(): Promise<FaceReading[]> {
    const response = await axiosInstance.get<FaceReading[]>('/face-reading')
    return response.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/face-reading/${id}`)
  },
}
