import { axiosInstance } from './client'
import type { AnimalFace, AnimalFaceStatus } from '@/lib/types'

export const animalFaceApi = {
  async getStatus(id: number): Promise<AnimalFaceStatus> {
    const r = await axiosInstance.get<AnimalFaceStatus>(`/animal-face/${id}/status`)
    return r.data
  },
  async create(params: { skinAnalysisId?: number; image?: File }): Promise<AnimalFace> {
    const formData = new FormData()
    if (params.skinAnalysisId) formData.append('skinAnalysisId', String(params.skinAnalysisId))
    if (params.image) formData.append('image', params.image)
    const r = await axiosInstance.post<AnimalFace>('/animal-face', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return r.data
  },
  async getById(id: number): Promise<AnimalFace> {
    const r = await axiosInstance.get<AnimalFace>(`/animal-face/${id}`)
    return r.data
  },
  async getList(): Promise<AnimalFace[]> {
    const r = await axiosInstance.get<AnimalFace[]>('/animal-face')
    return r.data
  },
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/animal-face/${id}`)
  },
}
