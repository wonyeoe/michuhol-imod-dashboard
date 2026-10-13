import { ANALYSIS_SOURCES } from './analysis-sources'
import { buildZones } from './zones'
import { DataValidationError, EmptyDataError, loadOverviewTables, parseTable } from './overview'
import type { CsvRow, SourceTables } from '../types/data'
import type { Zone } from '../types/zones'

export type AnalysisKey = keyof typeof ANALYSIS_SOURCES
export type AnalysisTables = Record<AnalysisKey, CsvRow[]>
export interface Cluster { id: number; count: number; share: number; dailyRiders: number; dailyOperations: number; mismatch: number }
export interface AnalysisZone extends Zone { medianRank: number }
export interface AnalysisData {
  summary: { days: number; groups: number; located: number; unlocated: number; pool: number; units: number; multi: number; single: number; candidates: number }
  clusters: Cluster[]
  models: { name: string; silhouette: number; dimensions: number; counts: number[] }[]
  eligibility: { key: string; cutoff: number; count: number }[]
  spatial: { method: string; units: number; multi: number; single: number; diameter: number }[]
  zones: AnalysisZone[]
  candidates: AnalysisZone[]
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new DataValidationError(message) }
function num(row: CsvRow, field: string, min = 0, max = Infinity, integer = false) {
  check(row[field]?.trim(), `${field} 값이 없습니다. 결측은 0으로 바꾸지 않습니다.`)
  const n = Number(row[field]); check(Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)), `${field} 값이 올바르지 않습니다.`); return n
}
function unique(rows: CsvRow[], key: string) {
  const map = new Map<string, CsvRow>()
  for (const r of rows) { check(r[key]?.trim() && !map.has(r[key]), `${key}: 누락 또는 중복이 있습니다.`); map.set(r[key], r) }
  return map
}
export function buildAnalysis(base: SourceTables, extra: AnalysisTables): AnalysisData {
  for (const [key, rows] of Object.entries(extra)) if (!rows.length) throw new EmptyDataError(`${ANALYSIS_SOURCES[key as AnalysisKey].title} 자료가 비어 있습니다.`)
  const data = buildZones(base)
  const groups = unique(base.groups, 'stop_group_id'), labels = unique(extra.assignments, 'stop_group_id')
  unique(extra.assignments, 'station_name')
  check(labels.size === groups.size, '군집 할당과 분석 그룹 수가 다릅니다.')
  const counts = { KMeans_FULL8: [0, 0, 0], GMM_ROUTE6: [0, 0, 0] }
  for (const r of labels.values()) {
    check(groups.get(r.stop_group_id)?.station_name === r.station_name, '그룹 ID와 정류장명의 대응이 다릅니다.')
    for (const key of ['KMeans_FULL8', 'GMM_ROUTE6'] as const) counts[key][num(r, key, 0, 2, true)]++
  }
  const profiles = unique(extra.profiles, 'KMeans_FULL8')
  check(profiles.size === 3, 'K-means 군집 프로필 수가 다릅니다.')
  const clusters = [0, 1, 2].map((id): Cluster => {
    const r = profiles.get(String(id)); check(r, 'K-means 프로필이 누락되었습니다.')
    const count = num(r, 'count', 1, groups.size, true)
    check(count === counts.KMeans_FULL8[id], '군집별 개수가 프로필과 다릅니다.')
    return { id, count, share: count / groups.size * 100, dailyRiders: num(r, 'avg_daily_passengers'), dailyOperations: num(r, 'avg_daily_operations'), mismatch: num(r, 'temporal_mismatch', 0, 1) }
  })
  const metrics = unique(extra.metrics, 'model')
  check(metrics.size === 2, '최종 해석 모델 지표 수가 다릅니다.')
  const models = (['KMeans_FULL8', 'GMM_ROUTE6'] as const).map((name) => {
    const r = metrics.get(name); check(r, `${name} 모델 지표가 없습니다.`)
    const expected = [...counts[name]].sort((a, b) => a - b)
    check(r.cluster_sizes === expected.join('/') && num(r, 'min_cluster', 1, groups.size, true) === expected[0], '모델 지표와 군집 개수가 다릅니다.')
    return { name, silhouette: num(r, 'silhouette_in_PCA', -1, 1), dimensions: num(r, 'pca_components', 1, 8, true), counts: counts[name] }
  })
  let located = 0
  for (const r of groups.values()) {
    const hasLat = !!r.representative_latitude?.trim(), hasLon = !!r.representative_longitude?.trim()
    check(hasLat === hasLon, '그룹 대표 좌표가 불완전합니다.')
    if (hasLat) { num(r, 'representative_latitude', 37, 38); num(r, 'representative_longitude', 126, 127); located++ }
  }
  const cuts = unique(extra.eligibility, 'scenario')
  check(cuts.size === 3, 'STEP 4 수요 기준 수가 다릅니다.')
  const eligibility = ['all_286', 'demand_ge_p25', 'demand_ge_median'].map((key) => {
    const r = cuts.get(key); check(r, 'STEP 4 수요 기준이 누락되었습니다.')
    return { key, cutoff: num(r, 'cutoff'), count: num(r, 'eligible_count', 1, groups.size, true) }
  })
  check(eligibility[0].count === groups.size, '전체 수요 기준의 그룹 수가 다릅니다.')
  unique(extra.spatial.map((r) => ({ ...r, key: `${r.method}/${r.radius_m}` })), 'key')
  const spatial = ['DBSCAN', 'Complete'].map((method) => {
    const r = extra.spatial.find((r) => r.method === method && r.radius_m === '500'); check(r, '500m 공간 비교 자료가 없습니다.')
    const units = num(r, 'n_groups', 1, 40, true), multi = num(r, 'n_multistop', 0, 40, true), single = num(r, 'n_singletons', 0, 40, true)
    check(units === multi + single, '공간 비교 단위 합계가 다릅니다.')
    return { method, units, multi, single, diameter: num(r, 'max_group_diameter_m') }
  })
  const multi = data.zones.filter((z) => z.members.length > 1).length, single = data.zones.length - multi
  check(spatial[1].units === data.zones.length && spatial[1].multi === multi && spatial[1].single === single, '공간 비교와 실제 권역 구성이 다릅니다.')
  const scores = unique(base.scores, 'zone_id')
  const zones = data.zones.map((z): AnalysisZone => {
    const medianRank = num(scores.get(z.zoneId)!, 'median_rank', 1, data.zones.length)
    const ranks = Object.values(z.scenarios).map((s) => s.rank).sort((a, b) => a - b)
    check(Math.abs(medianRank - (ranks[1] + ranks[2]) / 2) < 1e-8, '시나리오 순위 중앙값이 다릅니다.')
    const final = base.candidates.find((r) => r.zone_id === z.zoneId)
    if (final) check(num(final, 'median_rank', 1, data.zones.length) === medianRank, '최종 후보의 순위 중앙값이 다릅니다.')
    return { ...z, medianRank }
  })
  return { summary: { days: data.observedDays, groups: groups.size, located, unlocated: groups.size - located, pool: base.memberships.length, units: zones.length, multi, single, candidates: data.candidates.length }, clusters, models, eligibility, spatial, zones, candidates: zones.filter((z) => z.reviewOrder !== null) }
}
export async function loadAnalysis(signal: AbortSignal) {
  const [base, entries] = await Promise.all([loadOverviewTables(signal), Promise.all((Object.keys(ANALYSIS_SOURCES) as AnalysisKey[]).map(async (key) => {
    const source = ANALYSIS_SOURCES[key]
    const response = await fetch(`${import.meta.env.BASE_URL}data/${source.file}`, { signal })
    if (!response.ok) throw new Error(`${source.title}: HTTP ${response.status}`)
    return [key, parseTable(await response.text(), { title: source.title, columns: [...source.columns] })] as const
  }))])
  return buildAnalysis(base, Object.fromEntries(entries) as AnalysisTables)
}
