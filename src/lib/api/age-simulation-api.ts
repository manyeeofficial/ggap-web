import { axiosInstance } from './client'
import type { AgeSimulation, AgeSimulationStatus } from '@/lib/types'

export const ageSimulationApi = {
  async getStatus(id: number): Promise<AgeSimulationStatus> {
    const r = await axiosInstance.get<AgeSimulationStatus>(`/age-simulation/${id}/status`)
    return r.data
  },
  async create(params: { skinAnalysisId?: number; image?: File; targetAge: number }): Promise<AgeSimulation> {
    const formData = new FormData()
    formData.append('targetAge', String(params.targetAge))
    if (params.skinAnalysisId) formData.append('skinAnalysisId', String(params.skinAnalysisId))
    if (params.image) formData.append('image', params.image)
    const r = await axiosInstance.post<AgeSimulation>('/age-simulation', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return r.data
  },
  async getById(id: number): Promise<AgeSimulation> {
    const r = await axiosInstance.get<AgeSimulation>(`/age-simulation/${id}`)
    return r.data
  },
  async getList(): Promise<AgeSimulation[]> {
    const r = await axiosInstance.get<AgeSimulation[]>('/age-simulation')
    return r.data
  },
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/age-simulation/${id}`)
  },
}
