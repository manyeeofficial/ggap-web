import { axiosInstance } from './client'
import type { FaceCodeAnalysis, FaceCodeStatusResponse } from '@/lib/types'

export const faceCodeApi = {
  async create(params: { skinAnalysisId?: number; image?: File }): Promise<FaceCodeAnalysis> {
    const formData = new FormData()
    if (params.skinAnalysisId != null) {
      formData.append('skinAnalysisId', String(params.skinAnalysisId))
    }
    if (params.image) {
      formData.append('image', params.image)
    }
    const response = await axiosInstance.post<FaceCodeAnalysis>('/face-code', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getStatus(id: number): Promise<FaceCodeStatusResponse> {
    const response = await axiosInstance.get<FaceCodeStatusResponse>(`/face-code/${id}/status`)
    return response.data
  },

  async getById(id: number): Promise<FaceCodeAnalysis> {
    const response = await axiosInstance.get<FaceCodeAnalysis>(`/face-code/${id}`)
    return response.data
  },

  async getList(): Promise<FaceCodeAnalysis[]> {
    const response = await axiosInstance.get<FaceCodeAnalysis[]>('/face-code')
    return response.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/face-code/${id}`)
  },
}
