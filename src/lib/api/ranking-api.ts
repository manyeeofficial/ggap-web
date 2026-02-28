import { axiosInstance } from './client'
import type { RankingResult } from '@/lib/types'

export const rankingApi = {
  async getMyRanking(): Promise<RankingResult> {
    const response = await axiosInstance.get<RankingResult>('/ranking/me')
    return response.data
  },
}
