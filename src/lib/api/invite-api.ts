import { axiosInstance } from './client'
import type { InviteCreateResponse, InviteAcceptResponse, InviteHistory, InviteLandingInfo } from '@/lib/types'

export const inviteApi = {
  async createInvite(): Promise<InviteCreateResponse> {
    const res = await axiosInstance.post<InviteCreateResponse>('/invite/create')
    return res.data
  },

  async acceptInvite(inviteCode: string): Promise<InviteAcceptResponse> {
    const res = await axiosInstance.post<InviteAcceptResponse>('/invite/accept', null, {
      params: { inviteCode },
    })
    return res.data
  },

  async getHistory(): Promise<InviteHistory> {
    const res = await axiosInstance.get<InviteHistory>('/invite/history')
    return res.data
  },

  async getLandingInfo(code: string): Promise<InviteLandingInfo> {
    const res = await axiosInstance.get<InviteLandingInfo>(`/invite/landing/${code}`)
    return res.data
  },
}
