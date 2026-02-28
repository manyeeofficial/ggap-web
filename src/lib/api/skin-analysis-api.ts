import { axiosInstance } from './client'
import type { SkinAnalysis, SkinAnalysisStatus } from '@/lib/types'

export const skinAnalysisApi = {
  // 피부 분석 상태 조회 (비동기 처리 폴링용)
  async getStatus(id: number): Promise<SkinAnalysisStatus> {
    const response = await axiosInstance.get<SkinAnalysisStatus>(`/skin-analysis/${id}/status`)
    return response.data
  },

  // 피부 분석 생성
  async analyze(imageFile: File): Promise<SkinAnalysis> {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await axiosInstance.post<SkinAnalysis>(
      '/skin-analysis',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  // 피부 분석 상세 조회
  async getById(id: number): Promise<SkinAnalysis> {
    const response = await axiosInstance.get<SkinAnalysis>(`/skin-analysis/${id}`)
    return response.data
  },

  // 피부 분석 목록 조회
  async getList(page = 0, size = 20): Promise<SkinAnalysis[]> {
    const response = await axiosInstance.get<SkinAnalysis[]>('/skin-analysis', {
      params: { page, size },
    })
    return response.data
  },

  // 피부 분석 삭제
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/skin-analysis/${id}`)
  },
}
