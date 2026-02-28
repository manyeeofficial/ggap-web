export interface GroupRanking {
  topPercent: number
  totalCount: number
  label: string | null
}

export interface RankingResult {
  overall: GroupRanking | null
  byGender: GroupRanking | null
  byAge: GroupRanking | null
  byGenderAge: GroupRanking | null
}
