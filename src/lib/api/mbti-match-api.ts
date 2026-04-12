import { axiosInstance } from './client'
import type { MbtiMatch, MbtiMatchStatus } from '@/lib/types'

export const mbtiMatchApi = {
  async getStatus(id: number): Promise<MbtiMatchStatus> {
    const r = await axiosInstance.get<MbtiMatchStatus>(`/mbti-match/${id}/status`)
    return r.data
  },
  async create(params: { mbti: string; skinAnalysisId?: number; faceReadingId?: number }): Promise<MbtiMatch> {
    const formData = new FormData()
    formData.append('mbti', params.mbti)
    if (params.skinAnalysisId) formData.append('skinAnalysisId', String(params.skinAnalysisId))
    if (params.faceReadingId) formData.append('faceReadingId', String(params.faceReadingId))
    const r = await axiosInstance.post<MbtiMatch>('/mbti-match', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return r.data
  },
  async getById(id: number): Promise<MbtiMatch> {
    const r = await axiosInstance.get<MbtiMatch>(`/mbti-match/${id}`)
    return r.data
  },
  async getList(): Promise<MbtiMatch[]> {
    const r = await axiosInstance.get<MbtiMatch[]>('/mbti-match')
    return r.data
  },
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/mbti-match/${id}`)
  },
}
