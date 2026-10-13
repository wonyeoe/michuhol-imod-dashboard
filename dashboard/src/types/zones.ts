import type { GroupMember } from './data'

export const SCENARIOS = [
  { key: 'balanced', label: '균형형' },
  { key: 'demand_priority', label: '수요 우선형' },
  { key: 'time_priority', label: '시간 우선형' },
  { key: 'robustness_priority', label: '강건성 우선형' },
] as const
export type ScenarioKey = typeof SCENARIOS[number]['key']
export interface Coordinates { latitude: number; longitude: number }
export interface ZoneMember extends GroupMember { coordinates: Coordinates | null }
export interface Zone extends Coordinates {
  zoneId: string
  names: string[]
  members: ZoneMember[]
  // Only membership in STEP 7 top6 gives a final review order. IDs are never ranks.
  reviewOrder: number | null
  dailyDemand: number
  dailyOperations: number
  peakHour: number
  peakGap: number // percentage points
  positiveGapSum: number // original ratio, 0–1; not median_mismatch
  monthlyCv: number // sample standard deviation / mean of monthly daily boardings
  monthlyMinMaxRatio: number
  diameter: number // existing STEP 6 diameter_m, no geometry recomputation
  top6Frequency: number
  scenarios: Record<ScenarioKey, { score: number; rank: number; top6: boolean }>
}
export interface ZonesData { zones: Zone[]; candidates: Zone[]; observedDays: number }
export type ZoneFilter = 'all' | 'final' | 'other'
