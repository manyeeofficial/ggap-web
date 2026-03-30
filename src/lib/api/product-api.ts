import { axiosInstance } from './client'
import type { TrendingProduct } from '@/lib/types'

export const productApi = {
  async getTrending(): Promise<TrendingProduct[]> {
    const response = await axiosInstance.get<TrendingProduct[]>('/products/trending')
    return response.data
  },
}
