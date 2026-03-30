export type InvitationStatus = 'SENT' | 'ACCEPTED' | 'REWARDED' | 'EXPIRED'

export interface InviteCreateResponse {
  inviteCode: string
  shareUrl: string
  expiresAt: string
}

export interface InviteAcceptResponse {
  valid: boolean
  inviterNickname: string
}

export interface InviteLandingInfo {
  inviteCode: string
  inviterNickname: string
  valid: boolean
}

export interface InviteHistoryItem {
  inviteCode: string
  status: InvitationStatus
  sentAt: string
  expiresAt: string
  rewardedAt: string | null
}

export interface InviteHistory {
  totalInvited: number
  rewarded: number
  pending: number
  items: InviteHistoryItem[]
}
