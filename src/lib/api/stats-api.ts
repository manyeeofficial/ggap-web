import { axiosInstance } from './client'

export interface ServiceStats {
  totalMembers: number
  totalAnalyses: number
}

export const statsApi = {
  async getStats(): Promise<ServiceStats> {
    const response = await axiosInstance.get<ServiceStats>('/stats')
    return response.data
  },
}
