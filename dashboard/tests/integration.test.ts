import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { buildOverview, parseCsv, parseTable } from '../src/data/overview'
import { buildZones } from '../src/data/zones'
import { buildTemporal, TEMPORAL_SOURCES } from '../src/data/temporal'
import { DATA_SOURCES } from '../src/data/sources'
import type { SourceKey, SourceTables } from '../src/types/data'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
it('페이지 간 승차량·최대 시간·양의 차이 합과 월별 지표를 교차 검증한다', () => {
  const tables = Object.fromEntries((Object.keys(DATA_SOURCES) as SourceKey[]).map((k) => [k, parseCsv(read(DATA_SOURCES[k].source), k)])) as SourceTables
  const temporalTable = (key: keyof typeof TEMPORAL_SOURCES) => parseTable(read(TEMPORAL_SOURCES[key].source), TEMPORAL_SOURCES[key])
  const temporal = buildTemporal(tables, temporalTable('hourly'), temporalTable('monthly'))
  const overview = buildOverview(tables)
  const zones = buildZones(tables)
  for (const t of temporal.zones) {
    const o = overview.candidates.find((c) => c.zoneId === t.candidate.zoneId)!
    const z = zones.zones.find((c) => c.zoneId === o.zoneId)!
    expect(o.dailyDemand).toBe(z.dailyDemand)
    expect(o.dailyDemand).toBe(t.candidate.dailyDemand)
    expect(o.peakHour).toBe(t.peak.hour)
    expect(z.peakHour).toBe(t.peak.hour)
    expect(z.peakGap).toBeCloseTo(t.peak.gap, 8)
    expect(z.positiveGapSum).toBeCloseTo(t.hours.reduce((s, h) => s + Math.max(0, h.gap) / 100, 0), 8)
    const monthly = t.months.map((m) => m.dailyRiders)
    const mean = monthly.reduce((s, v) => s + v, 0) / 3
    expect(z.monthlyMinMaxRatio).toBeCloseTo(Math.min(...monthly) / Math.max(...monthly), 8)
    expect(z.monthlyCv).toBeCloseTo(Math.sqrt(monthly.reduce((s, v) => s + (v - mean) ** 2, 0) / 2) / mean, 8)
  }
})

// Raw inputs are intentionally not distributed in Git; run this audit when available.
it.skipIf(!existsSync(new URL('../../dataset_raw/3. 미추홀구 버스 정류장.csv', import.meta.url)))('502개 물리 정류장은 정류장 ID 단위로 확인하며 286개 분석 그룹과 구분한다', () => {
  const rows = parseTable(read('dataset_raw/3. 미추홀구 버스 정류장.csv'), { title: '물리 정류장 원본', columns: ['station_id', 'station_name'] })
  expect(rows).toHaveLength(502)
  expect(new Set(rows.map((r) => r.station_id)).size).toBe(502)
})
