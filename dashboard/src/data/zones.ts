import { buildOverview, DataValidationError, EmptyDataError, loadOverviewTables } from './overview'
import { SCENARIOS, type Coordinates, type Zone, type ZoneFilter, type ZonesData } from '../types/zones'
import type { CsvRow, SourceTables } from '../types/data'

export const ZONE_SCORE_COLUMNS = ['daily_ops', 'positive_gap_sum', 'peak_hour_gap', 'monthly_cv', 'monthly_min_max_ratio', ...SCENARIOS.flatMap(({ key }) => [`score_${key}`, `rank_${key}`, `top6_${key}`])]
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new DataValidationError(message) }
function number(row: CsvRow, field: string, min: number, max = Infinity, integer = false) {
  check(row[field]?.trim(), `${row.zone_id}: ${field} 값이 없습니다. 결측은 0으로 대체하지 않습니다.`)
  const value = Number(row[field])
  check(Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)), `${row.zone_id}: ${field} 값의 범위가 올바르지 않습니다.`)
  return value
}
function coordinates(row: CsvRow, lat: string, lon: string): Coordinates {
  return { latitude: number(row, lat, 37, 38), longitude: number(row, lon, 126, 127) }
}
function sameNames(names: string[], members: { name: string }[]) {
  return names.length === members.length && new Set(names).size === names.length && names.every((name) => members.some((m) => m.name === name))
}
export function buildZones(tables: SourceTables): ZonesData {
  if (!tables.profiles.length || !tables.scores.length) throw new EmptyDataError('표시할 공간 평가 단위가 없습니다.')
  // Reuse the overview contract for audit counts, unique IDs, references and final order.
  const overview = buildOverview(tables)
  const final = new Map(overview.candidates.map((c) => [c.zoneId, c]))
  const profiles = new Map(tables.profiles.map((p) => [p.zone_id, p]))
  const zones = tables.scores.map((row): Zone => {
    check(/^Z\d{2}$/.test(row.zone_id), '권역 ID 형식이 올바르지 않습니다.')
    const profile = profiles.get(row.zone_id)
    check(profile, `${row.zone_id}: STEP 6 대표 좌표가 없습니다.`)
    const members = tables.memberships.filter((m) => m.zone_id === row.zone_id).map((m) => {
      const latMissing = !m.representative_latitude?.trim(), lonMissing = !m.representative_longitude?.trim()
      check(latMissing === lonMissing, `${row.zone_id}: 구성 그룹의 대표 좌표가 불완전합니다.`)
      return { groupId: m.stop_group_id, name: m.station_name, coordinates: latMissing ? null : coordinates(m, 'representative_latitude', 'representative_longitude') }
    })
    const names = row.names.split('|').map((n) => n.trim())
    check(sameNames(names, members) && sameNames(profile.names.split('|').map((n) => n.trim()), members), `${row.zone_id}: 구성 정류장명 그룹이 STEP 6·7 사이에서 다릅니다.`)
    check(number(row, 'n_stops', 1, 40, true) === members.length, `${row.zone_id}: 구성 그룹 수가 다릅니다.`)
    const location = coordinates(profile, 'lat', 'lon')
    // Validate existing representative points against the documented mean; never replace them.
    if (members.every((m) => m.coordinates)) {
      for (const field of ['latitude', 'longitude'] as const) check(Math.abs(members.reduce((s, m) => s + m.coordinates![field], 0) / members.length - location[field]) < 1e-8, `${row.zone_id}: 권역 대표 좌표가 구성 그룹 평균과 다릅니다.`)
    }
    const candidate = final.get(row.zone_id)
    if (candidate) {
      const finalRow = tables.candidates.find((c) => c.zone_id === row.zone_id)!
      for (const field of ZONE_SCORE_COLUMNS) check(row[field] === finalRow[field], `${row.zone_id}: ${field} 값이 최종 후보 CSV와 다릅니다.`)
    }
    const scenarios = Object.fromEntries(SCENARIOS.map(({ key }) => {
      const score = number(row, `score_${key}`, 0, 100)
      const rank = number(row, `rank_${key}`, 1, tables.scores.length, true)
      check(['True', 'False'].includes(row[`top6_${key}`]), `${row.zone_id}: 시나리오 상위 6위 값이 올바르지 않습니다.`)
      const top6 = row[`top6_${key}`] === 'True'
      check(top6 === (rank <= 6), `${row.zone_id}: 시나리오 순위와 포함 여부가 다릅니다.`)
      return [key, { score, rank, top6 }]
    })) as Zone['scenarios']
    const top6Frequency = number(row, 'top6_frequency', 0, 4, true)
    check(Object.values(scenarios).filter((s) => s.top6).length === top6Frequency, `${row.zone_id}: 시나리오 포함 횟수가 다릅니다.`)
    return { zoneId: row.zone_id, names, members, ...location, reviewOrder: candidate?.reviewOrder ?? null,
      dailyDemand: number(row, 'daily_demand', 0), dailyOperations: number(row, 'daily_ops', 0),
      peakHour: number(row, 'peak_hour', 0, 23, true), peakGap: number(row, 'peak_hour_gap', 0, 1) * 100,
      positiveGapSum: number(row, 'positive_gap_sum', 0, 1), monthlyCv: number(row, 'monthly_cv', 0), monthlyMinMaxRatio: number(row, 'monthly_min_max_ratio', 0, 1),
      diameter: number(profile, 'diameter_m', 0, 500.1), top6Frequency, scenarios,
    }
  }).sort((a, b) => {
    if (a.reviewOrder !== null && b.reviewOrder !== null) return a.reviewOrder - b.reviewOrder
    if (a.reviewOrder !== null) return -1
    if (b.reviewOrder !== null) return 1
    return a.zoneId.localeCompare(b.zoneId)
  })
  return { zones, candidates: zones.filter((z) => z.reviewOrder !== null), observedDays: overview.summary.observedDays }
}
export function filterZones(zones: Zone[], filter: ZoneFilter, query: string) {
  const term = query.trim().toLocaleLowerCase('ko-KR')
  return zones.filter((z) => (filter === 'all' || (filter === 'final' ? z.reviewOrder !== null : z.reviewOrder === null)) && (!term || [z.zoneId, ...z.names].some((s) => s.toLocaleLowerCase('ko-KR').includes(term))))
}
export async function loadZones(signal: AbortSignal) { return buildZones(await loadOverviewTables(signal)) }
