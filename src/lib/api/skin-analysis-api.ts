import { axiosInstance } from './client'
import type { AnonymousSkinAnalysis, SkinAnalysis, SkinAnalysisStatus } from '@/lib/types'

async function convertHeicToJpeg(file: File): Promise<File> {
  if (!file.name.toLowerCase().match(/\.heic?$/)) return file
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
  const filename = file.name.replace(/\.heic?$/i, '.jpg')
  return new File([blob as Blob], filename, { type: 'image/jpeg' })
}

export const skinAnalysisApi = {
  // 피부 분석 상태 조회 (비동기 처리 폴링용)
  async getStatus(id: number): Promise<SkinAnalysisStatus> {
    const response = await axiosInstance.get<SkinAnalysisStatus>(`/skin-analysis/${id}/status`)
    return response.data
  },

  // 비회원 피부 분석 생성 (인증 불필요)
  async analyzeAnonymous(imageFile: File): Promise<AnonymousSkinAnalysis> {
    const file = await convertHeicToJpeg(imageFile)
    const formData = new FormData()
    formData.append('image', file)

    const response = await axiosInstance.post<AnonymousSkinAnalysis>(
      '/skin-analysis/anonymous',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  // 비회원 분석 결과를 로그인한 회원에게 연결
  async claimAnalysis(id: number, token: string): Promise<SkinAnalysis> {
    const response = await axiosInstance.post<SkinAnalysis>(
      `/skin-analysis/${id}/claim`,
      null,
      { params: { token } }
    )
    return response.data
  },

  // 비회원 분석 결과 조회 (token 필요)
  async getByIdWithToken(id: number, token: string): Promise<SkinAnalysis> {
    const response = await axiosInstance.get<SkinAnalysis>(`/skin-analysis/${id}`, {
      params: { token },
    })
    return response.data
  },

  // 피부 분석 생성
  async analyze(imageFile: File): Promise<SkinAnalysis> {
    const file = await convertHeicToJpeg(imageFile)
    const formData = new FormData()
    formData.append('image', file)

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
