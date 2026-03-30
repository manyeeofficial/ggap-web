import { axiosInstance } from './client'
import type { CreditInfo } from '@/lib/types'

export const creditApi = {
  async getCredit(): Promise<CreditInfo> {
    const res = await axiosInstance.get<CreditInfo>('/credits')
    return res.data
  },
}
