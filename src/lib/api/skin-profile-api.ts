import { axiosInstance } from './client'
import { AxiosError } from 'axios'
import type { SkinProfile, SkinProfileRequest } from '@/lib/types'

export const skinProfileApi = {
  // 피부 프로필 조회
  async get(): Promise<SkinProfile | null> {
    try {
      const response = await axiosInstance.get<SkinProfile>('/skin-profiles')
      return response.data
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // 피부 프로필 생성/수정
  async upsert(data: SkinProfileRequest): Promise<SkinProfile> {
    const response = await axiosInstance.put<SkinProfile>('/skin-profiles', data)
    return response.data
  },
}
