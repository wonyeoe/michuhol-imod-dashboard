import { buildOverview, DataValidationError, EmptyDataError, loadOverviewTables, parseTable } from './overview'
import type { Candidate, CsvRow, SourceTables } from '../types/data'

const step7 = 'STEP별 결과 파일/Michuhol_IMOD_STEP7_Operational_Screening_Results'
export const TEMPORAL_SOURCES = {
  hourly: { file: 'hourly-zone-shares.csv', title: 'STEP 7 시간별 권역 비중', source: `${step7}/03_hourly_zone_shares.csv`, columns: ['zone_id', 'hour', 'passenger_count', 'operation_count', 'demand_share', 'supply_share', 'relative_gap'] },
  monthly: { file: 'monthly-zone-profiles.csv', title: 'STEP 7 월별 권역 특성', source: `${step7}/02_monthly_zone_profiles.csv`, columns: ['zone_id', 'month', 'riders', 'operations', 'observed_days', 'daily_riders', 'daily_operations'] },
}
export interface HourPoint { hour: number; riders: number; operations: number; demand: number; supply: number; gap: number }
export interface MonthPoint { month: number; days: number; riders: number; operations: number; dailyRiders: number; dailyOperations: number }
export interface TemporalZone { candidate: Candidate; hours: HourPoint[]; months: MonthPoint[]; peak: HourPoint; totalRiders: number; totalOperations: number }
export interface TemporalData { zones: TemporalZone[] }
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new DataValidationError(message) }
function num(row: CsvRow, key: string) {
  assert(row[key]?.trim(), `${row.zone_id}: ${key} 값이 없습니다. 결측값은 0으로 대체하지 않습니다.`)
  const value = Number(row[key]); assert(Number.isFinite(value), `${row.zone_id}: ${key} 값이 유효하지 않습니다.`); return value
}
function close(a: number, b: number, label: string, tolerance = 1e-8) { assert(Math.abs(a - b) <= tolerance, `${label}: STEP 7 값과 계산 결과가 다릅니다.`) }
function validateKeys(rows: CsvRow[], key: string, allowed: Set<string>) {
  const seen = new Set<string>()
  for (const row of rows) {
    assert(allowed.has(row.zone_id), `${row.zone_id}: 권역 연결 자료가 없습니다.`)
    const value = num(row, key)
    assert(Number.isInteger(value) && (key === 'hour' ? value >= 0 && value <= 23 : [4, 5, 6].includes(value)), `${key}: 범위가 올바르지 않습니다.`)
    const id = `${row.zone_id}/${value}`; assert(!seen.has(id), `${id}: 중복 행이 있습니다.`); seen.add(id)
  }
}
export function buildTemporal(tables: SourceTables, hourly: CsvRow[], monthly: CsvRow[]): TemporalData {
  const overview = buildOverview(tables)
  if (!hourly.length || !monthly.length) throw new EmptyDataError('시간별 또는 월별 분석 자료가 비어 있습니다.')
  const allowed = new Set(tables.scores.map((r) => r.zone_id))
  validateKeys(hourly, 'hour', allowed); validateKeys(monthly, 'month', allowed)
  const zones = overview.candidates.map((candidate): TemporalZone => {
    const id = candidate.zoneId
    const h = hourly.filter((r) => r.zone_id === id).sort((a, b) => Number(a.hour) - Number(b.hour))
    const m = monthly.filter((r) => r.zone_id === id).sort((a, b) => Number(a.month) - Number(b.month))
    assert(h.length === 24 && m.length === 3, `${id}: 24시간·3개월 자료가 완전하지 않습니다. 누락값은 0으로 채우지 않습니다.`)
    const hours = h.map((r) => ({ hour: num(r, 'hour'), riders: num(r, 'passenger_count'), operations: num(r, 'operation_count'), demand: num(r, 'demand_share') * 100, supply: num(r, 'supply_share') * 100, gap: num(r, 'relative_gap') * 100 }))
    const totalRiders = hours.reduce((s, r) => s + r.riders, 0), totalOperations = hours.reduce((s, r) => s + r.operations, 0)
    assert(totalRiders > 0 && totalOperations > 0, `${id}: 비중 분모가 0입니다.`)
    for (const r of hours) {
      assert(Number.isInteger(r.riders) && r.riders >= 0 && Number.isInteger(r.operations) && r.operations >= 0, `${id}: 누적 건수 범위가 올바르지 않습니다.`)
      close(r.demand, r.riders / totalRiders * 100, `${id} 승차 비중`)
      close(r.supply, r.operations / totalOperations * 100, `${id} 운행 비중`)
      close(r.gap, r.demand - r.supply, `${id} 상대 격차`)
    }
    close(hours.reduce((s, r) => s + r.demand, 0), 100, `${id} 승차 비중 합`)
    close(hours.reduce((s, r) => s + r.supply, 0), 100, `${id} 운행 비중 합`)
    const peak = hours.reduce((a, b) => b.gap > a.gap ? b : a)
    assert(peak.hour === candidate.peakHour, `${id}: 최대 상대 격차 시간이 STEP 7과 다릅니다.`)
    for (const row of [tables.candidates.find((r) => r.zone_id === id)!, tables.scores.find((r) => r.zone_id === id)!]) {
      close(peak.gap, num(row, 'peak_hour_gap') * 100, `${id} 최대 격차`)
      close(peak.riders, num(row, 'peak_hour_riders_90d'), `${id} 최대 격차 시간 승차량`)
      close(peak.operations, num(row, 'peak_hour_ops_90d'), `${id} 최대 격차 시간 운행`)
    }
    const months = m.map((r) => ({ month: num(r, 'month'), days: num(r, 'observed_days'), riders: num(r, 'riders'), operations: num(r, 'operations'), dailyRiders: num(r, 'daily_riders'), dailyOperations: num(r, 'daily_operations') }))
    for (const r of months) {
      assert(r.days === ({ 4: 30, 5: 31, 6: 29 } as Record<number, number>)[r.month], `${id}: 월별 관측일이 STEP 7과 다릅니다.`)
      assert(r.riders >= 0 && r.operations >= 0, `${id}: 월별 합계가 음수입니다.`)
      close(r.dailyRiders, r.riders / r.days, `${id} 월별 일평균 승차량`)
      close(r.dailyOperations, r.operations / r.days, `${id} 월별 일평균 운행`)
    }
    close(months.reduce((s, r) => s + r.riders, 0), totalRiders, `${id} 월별·시간별 승차 총량`)
    close(months.reduce((s, r) => s + r.operations, 0), totalOperations, `${id} 월별·시간별 운행 총량`)
    close(totalRiders / overview.summary.observedDays, candidate.dailyDemand, `${id} 일평균 승차량`, 1e-5)
    return { candidate, hours, months, peak, totalRiders, totalOperations }
  })
  return { zones }
}
export async function loadTemporal(signal: AbortSignal): Promise<TemporalData> {
  const [tables, hourly, monthly] = await Promise.all([loadOverviewTables(signal), ...Object.values(TEMPORAL_SOURCES).map(async (source) => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${source.file}`, { signal })
    if (!response.ok) throw new Error(`${source.title}: HTTP ${response.status}`)
    return parseTable(await response.text(), source)
  })])
  return buildTemporal(tables, hourly, monthly)
}
