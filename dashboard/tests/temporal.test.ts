import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildTemporal, TEMPORAL_SOURCES } from '../src/data/temporal'
import { parseCsv, parseTable } from '../src/data/overview'
import { DATA_SOURCES } from '../src/data/sources'
import type { SourceKey, SourceTables } from '../src/types/data'

function fixture() {
  const tables = Object.fromEntries((Object.keys(DATA_SOURCES) as SourceKey[]).map((k) => [k, parseCsv(readFileSync(new URL(`../public/data/${DATA_SOURCES[k].file}`, import.meta.url), 'utf8'), k)])) as SourceTables
  const read = (key: keyof typeof TEMPORAL_SOURCES) => parseTable(readFileSync(new URL(`../public/data/${TEMPORAL_SOURCES[key].file}`, import.meta.url), 'utf8'), TEMPORAL_SOURCES[key])
  return { tables, hourly: read('hourly'), monthly: read('monthly') }
}
describe('STEP 7 시간·월별 데이터 계약', () => {
  it('실제 6개 권역의 순서, 최대 시간, 비중 합과 90일 분모를 검증한다', () => {
    const { tables, hourly, monthly } = fixture()
    const { zones } = buildTemporal(tables, hourly, monthly)
    expect(zones.map((z) => z.candidate.zoneId)).toEqual(['Z06', 'Z23', 'Z10', 'Z22', 'Z01', 'Z02'])
    expect(zones.map((z) => z.peak.hour)).toEqual([18, 16, 15, 18, 21, 7])
    for (const z of zones) {
      expect(z.hours).toHaveLength(24)
      expect(z.hours.reduce((s, r) => s + r.demand, 0)).toBeCloseTo(100, 9)
      expect(z.hours.reduce((s, r) => s + r.supply, 0)).toBeCloseTo(100, 9)
      expect(z.hours.reduce((s, r) => s + r.gap, 0)).toBeCloseTo(0, 9)
      expect(z.months.map((r) => r.days)).toEqual([30, 31, 29])
      expect(z.totalRiders / 90).toBeCloseTo(z.candidate.dailyDemand, 5)
      expect(z.hours.some((r) => r.gap < 0)).toBe(true)
    }
    expect(zones[0].peak.gap).toBeCloseTo(4.980713782, 8)
    expect(zones[0].peak.riders).toBe(94788)
  })
  it('행 순서와 무관하게 권역 ID 및 시간·월로 결합한다', () => {
    const { tables, hourly, monthly } = fixture()
    expect(buildTemporal(tables, [...hourly].reverse(), [...monthly].reverse())).toEqual(buildTemporal(tables, hourly, monthly))
  })
  it.each(['demand_share', 'supply_share', 'passenger_count'])('결측 %s를 0으로 바꾸지 않는다', (key) => {
    const { tables, hourly, monthly } = fixture()
    hourly.find((r) => r.zone_id === 'Z06')![key] = ''
    expect(() => buildTemporal(tables, hourly, monthly)).toThrow(/결측/)
  })
  it('누락 시간, 중복 키, 잘못된 비중을 거부한다', () => {
    const { tables, hourly, monthly } = fixture()
    expect(() => buildTemporal(tables, hourly.filter((r) => !(r.zone_id === 'Z06' && r.hour === '2')), monthly)).toThrow(/완전/)
    expect(() => buildTemporal(tables, [...hourly, hourly[0]], monthly)).toThrow(/중복/)
    hourly.find((r) => r.zone_id === 'Z06')!.demand_share = '0.5'
    expect(() => buildTemporal(tables, hourly, monthly)).toThrow(/승차 비중/)
  })
  it('STEP 7 최대 시간 및 월별 관측일 불일치를 차단한다', () => {
    const { tables, hourly, monthly } = fixture()
    tables.candidates[0].peak_hour = '17'; tables.scores[0].peak_hour = '17'
    expect(() => buildTemporal(tables, hourly, monthly)).toThrow(/최대 상대 격차 시간/)
    const f = fixture(); f.monthly.find((r) => r.zone_id === 'Z06' && r.month === '6')!.observed_days = '30'
    expect(() => buildTemporal(f.tables, f.hourly, f.monthly)).toThrow(/관측일/)
  })
  it('빈 자료와 월별 일평균 변조를 차단한다', () => {
    const f = fixture()
    expect(() => buildTemporal(f.tables, [], f.monthly)).toThrow(/비어/)
    f.monthly.find((r) => r.zone_id === 'Z06')!.daily_riders = '1'
    expect(() => buildTemporal(f.tables, f.hourly, f.monthly)).toThrow(/월별 일평균/)
  })
})
