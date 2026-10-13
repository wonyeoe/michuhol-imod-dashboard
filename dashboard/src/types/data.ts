export interface GroupMember {
  groupId: string
  name: string
}
export interface Candidate {
  zoneId: string
  reviewOrder: number
  names: string[]
  members: GroupMember[]
  dailyDemand: number
  top6Frequency: number
  peakHour: number
  type: 'single' | 'multi'
  latitude: number
  longitude: number
}
export interface OverviewData {
  summary: { groupCount: number; observedDays: number; zoneCount: number; candidateCount: number }
  candidates: Candidate[]
}
export type CsvRow = Record<string, string>
export type SourceKey = 'groups' | 'memberships' | 'profiles' | 'scores' | 'candidates' | 'audit'
export type SourceTables = Record<SourceKey, CsvRow[]>
